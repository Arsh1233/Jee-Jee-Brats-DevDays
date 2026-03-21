"""
📈 Scheduler — ML Demand Forecaster
Gradient Boosting Regressor trained on synthetic 365-day demand data.
Replaces static demand curves with a learned model.
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


class DemandForecaster:
    """
    Gradient Boosting demand forecaster.
    Features: hour, hour_sin, hour_cos, day_of_week, month, is_weekend,
              temperature_proxy, prev_hour_demand
    Predicts: demand_mw
    """

    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=250,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.85,
            random_state=42,
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.training_metrics = {}

    @staticmethod
    def generate_training_data(n_days: int = 365) -> tuple[np.ndarray, np.ndarray]:
        """
        Generate 365 days of realistic hourly demand data.
        Base demand follows Kaggle household patterns:
          - Morning peak 7–9, evening peak 18–22
          - Weekday/weekend variation
          - Seasonal variation (summer vs winter)
          - Weather-correlated noise
        """
        rng = np.random.RandomState(42)

        # Base hourly demand curve (normalised MW)
        base_curve = np.array([
            35, 30, 28, 27, 26, 28, 38, 55,
            68, 72, 74, 76, 78, 80, 82, 85,
            88, 92, 95, 90, 82, 70, 55, 42,
        ], dtype=float)

        X_list, y_list = [], []

        for day in range(n_days):
            month = (day // 30) % 12
            dow = day % 7
            is_weekend = 1.0 if dow >= 5 else 0.0

            # Seasonal factor (summer higher)
            seasonal = [0.8, 0.85, 0.9, 1.0, 1.15, 1.3,
                        1.35, 1.3, 1.2, 1.0, 0.9, 0.85][month]

            # Temperature proxy (higher in summer months)
            temp = 15 + 15 * np.sin(2 * np.pi * (month - 3) / 12) + rng.normal(0, 3)

            prev_demand = 35.0

            for hour in range(24):
                # Weekend dampening
                weekend_factor = 0.85 if is_weekend else 1.0

                # Base demand with all factors
                demand = (base_curve[hour]
                          * seasonal
                          * weekend_factor
                          + temp * 0.3  # temperature correlation
                          + rng.normal(0, 3))  # noise

                demand = max(10, demand)  # floor

                X_list.append([
                    hour,
                    np.sin(2 * np.pi * hour / 24),
                    np.cos(2 * np.pi * hour / 24),
                    dow,
                    month,
                    is_weekend,
                    temp,
                    prev_demand,
                ])
                y_list.append(demand)
                prev_demand = demand

        return np.array(X_list), np.array(y_list)

    def train(self, X: np.ndarray = None, y: np.ndarray = None) -> dict:
        """Train on demand data. Generates its own if not provided."""
        if X is None or y is None:
            X, y = self.generate_training_data()

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        X_train_s = self.scaler.fit_transform(X_train)
        X_test_s = self.scaler.transform(X_test)

        self.model.fit(X_train_s, y_train)
        self.is_trained = True

        y_pred = self.model.predict(X_test_s)
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        mae = float(mean_absolute_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))

        feat_names = [
            "hour", "hour_sin", "hour_cos", "day_of_week", "month",
            "is_weekend", "temperature", "prev_hour_demand",
        ]
        importances = self.model.feature_importances_
        top_features = sorted(
            zip(feat_names, importances), key=lambda x: x[1], reverse=True
        )[:5]

        self.training_metrics = {
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "r2_score": round(r2, 4),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "top_features": [{"name": f, "importance": round(float(i), 4)} for f, i in top_features],
        }
        return self.training_metrics

    def predict_next_24h(self, current_hour: int = 0, month: int = 3,
                         dow: int = 3, temperature: float = 30.0) -> list[dict]:
        """Predict next 24 hours of demand."""
        if not self.is_trained:
            return []

        predictions = []
        prev_demand = 60.0
        is_weekend = 1.0 if dow >= 5 else 0.0

        for i in range(24):
            hour = (current_hour + i) % 24
            features = np.array([[
                hour,
                np.sin(2 * np.pi * hour / 24),
                np.cos(2 * np.pi * hour / 24),
                dow,
                month,
                is_weekend,
                temperature,
                prev_demand,
            ]])
            features_s = self.scaler.transform(features)
            pred = float(self.model.predict(features_s)[0])
            pred = max(10, pred)

            predictions.append({
                "hour": hour,
                "predicted_demand_mw": round(pred, 2),
                "confidence_band": round(pred * 0.05, 2),  # ±5%
            })
            prev_demand = pred

        return predictions

    def save(self):
        joblib.dump(self.model, os.path.join(MODELS_DIR, "demand_forecaster.joblib"))
        joblib.dump(self.scaler, os.path.join(MODELS_DIR, "demand_scaler.joblib"))

    def load(self) -> bool:
        path = os.path.join(MODELS_DIR, "demand_forecaster.joblib")
        if os.path.exists(path):
            self.model = joblib.load(path)
            self.scaler = joblib.load(os.path.join(MODELS_DIR, "demand_scaler.joblib"))
            self.is_trained = True
            return True
        return False

"""
🧠 Optimizer — Production ML Models
Trained scikit-learn models for:
  1. AnomalyDetector     — Isolation Forest for consumption anomaly detection
  2. ConsumptionPredictor — Gradient Boosting Regressor for 24h consumption forecasting
  3. UserSegmenter        — K-Means clustering for user segmentation by consumption pattern
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest, GradientBoostingRegressor
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
    classification_report, precision_score, recall_score, f1_score,
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ═══════════════════════════════════════════════════════════════════
# 1. Anomaly Detector — Isolation Forest
# ═══════════════════════════════════════════════════════════════════

class AnomalyDetector:
    """
    Isolation Forest trained on hourly consumption features.
    Detects anomalous readings that deviate from normal patterns.
    """

    def __init__(self):
        self.model = IsolationForest(
            n_estimators=200,
            contamination=0.05,  # expect ~5% anomalies
            max_samples="auto",
            random_state=42,
        )
        self.scaler = StandardScaler()
        self.is_trained = False

    def _extract_features(self, profiles: list[dict]) -> np.ndarray:
        """
        Extract features from consumption profiles.
        Features per reading: [kwh, hour, hour_sin, hour_cos, is_peak, rolling_mean_3h]
        """
        all_features = []
        for profile in profiles:
            hourly = profile.get("hourly_consumption", [])
            for i, entry in enumerate(hourly):
                kwh = entry["kwh"] if isinstance(entry, dict) else entry
                hour = entry.get("hour", i % 24) if isinstance(entry, dict) else i % 24

                # Rolling mean (previous 3 hours)
                start = max(0, i - 3)
                window = hourly[start:i + 1]
                rolling = np.mean([
                    e["kwh"] if isinstance(e, dict) else e for e in window
                ])

                all_features.append([
                    kwh,
                    hour,
                    np.sin(2 * np.pi * hour / 24),
                    np.cos(2 * np.pi * hour / 24),
                    1.0 if 17 <= hour < 22 else 0.0,
                    rolling,
                ])
        return np.array(all_features)

    def train(self, profiles: list[dict]) -> dict:
        """Train on consumption profiles. Returns training metrics."""
        X = self._extract_features(profiles)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self.is_trained = True

        # Get anomaly predictions on training data
        preds = self.model.predict(X_scaled)  # 1 = normal, -1 = anomaly
        n_anomalies = np.sum(preds == -1)

        # Compare with labeled anomalies if available
        true_labels = []
        for profile in profiles:
            for entry in profile.get("hourly_consumption", []):
                if isinstance(entry, dict):
                    true_labels.append(1 if entry.get("is_anomaly", False) else 0)
                else:
                    true_labels.append(0)

        metrics = {
            "total_samples": len(X),
            "anomalies_detected": int(n_anomalies),
            "anomaly_rate": round(n_anomalies / len(X), 4),
        }

        if any(true_labels):
            true_arr = np.array(true_labels)
            pred_arr = np.array([1 if p == -1 else 0 for p in preds])
            metrics["precision"] = round(float(precision_score(true_arr, pred_arr, zero_division=0)), 4)
            metrics["recall"] = round(float(recall_score(true_arr, pred_arr, zero_division=0)), 4)
            metrics["f1_score"] = round(float(f1_score(true_arr, pred_arr, zero_division=0)), 4)

        return metrics

    def predict(self, hourly_kwh: list[float]) -> list[dict]:
        """Predict anomalies in a 24h consumption array."""
        if not self.is_trained:
            return []
        profile = {"hourly_consumption": [
            {"kwh": kwh, "hour": i} for i, kwh in enumerate(hourly_kwh)
        ]}
        X = self._extract_features([profile])
        X_scaled = self.scaler.transform(X)
        preds = self.model.predict(X_scaled)
        scores = self.model.decision_function(X_scaled)

        anomalies = []
        for i, (pred, score) in enumerate(zip(preds, scores)):
            if pred == -1:
                anomalies.append({
                    "hour": i % 24,
                    "kwh": hourly_kwh[i],
                    "anomaly_score": round(float(-score), 4),
                    "severity": "critical" if score < -0.3 else "warning",
                })
        return anomalies

    def save(self):
        joblib.dump(self.model, os.path.join(MODELS_DIR, "anomaly_detector.joblib"))
        joblib.dump(self.scaler, os.path.join(MODELS_DIR, "anomaly_scaler.joblib"))

    def load(self):
        path = os.path.join(MODELS_DIR, "anomaly_detector.joblib")
        if os.path.exists(path):
            self.model = joblib.load(path)
            self.scaler = joblib.load(os.path.join(MODELS_DIR, "anomaly_scaler.joblib"))
            self.is_trained = True
            return True
        return False


# ═══════════════════════════════════════════════════════════════════
# 2. Consumption Predictor — Gradient Boosting Regressor
# ═══════════════════════════════════════════════════════════════════

class ConsumptionPredictor:
    """
    Gradient Boosting Regressor for predicting hourly consumption.
    Features: hour, day_of_week, month, is_weekend, conn_type, avg_kwh, appliance_count
    """

    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
        )
        self.scaler = StandardScaler()
        self.is_trained = False

    def _extract_features(self, profiles: list[dict]) -> tuple[np.ndarray, np.ndarray]:
        """
        Build feature matrix and target vector.
        Features: [hour, hour_sin, hour_cos, day_of_week, month, is_weekend,
                   is_peak, conn_type_enc, appliance_count, avg_daily_kwh,
                   prev_hour_kwh]
        Target: kwh
        """
        CONN_MAP = {"residential": 0, "commercial": 1, "industrial": 2}
        X_list, y_list = [], []

        for profile in profiles:
            hourly = profile.get("hourly_consumption", [])
            conn = CONN_MAP.get(profile.get("conn_type", "residential"), 0)
            n_apps = len(profile.get("appliances", []))
            avg_kwh = profile.get("avg_daily_kwh", 0)
            if avg_kwh == 0 and hourly:
                avg_kwh = sum(
                    e["kwh"] if isinstance(e, dict) else e for e in hourly
                )

            for i, entry in enumerate(hourly):
                kwh = entry["kwh"] if isinstance(entry, dict) else entry
                hour = entry.get("hour", i % 24) if isinstance(entry, dict) else i % 24
                prev_kwh = (
                    hourly[i - 1]["kwh"] if isinstance(hourly[i - 1], dict) else hourly[i - 1]
                ) if i > 0 else kwh

                X_list.append([
                    hour,
                    np.sin(2 * np.pi * hour / 24),
                    np.cos(2 * np.pi * hour / 24),
                    hash(profile.get("profile_id", i)) % 7,  # day_of_week proxy
                    hash(profile.get("profile_id", i)) % 12,  # month proxy
                    1.0 if (hash(profile.get("profile_id", i)) % 7) >= 5 else 0.0,
                    1.0 if 17 <= hour < 22 else 0.0,
                    conn,
                    n_apps,
                    avg_kwh / 24 if avg_kwh else 0,
                    prev_kwh,
                ])
                y_list.append(kwh)

        return np.array(X_list), np.array(y_list)

    def train(self, profiles: list[dict]) -> dict:
        """Train and return metrics on test split."""
        X, y = self._extract_features(profiles)
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

        # Feature importances
        feat_names = [
            "hour", "hour_sin", "hour_cos", "day_of_week", "month",
            "is_weekend", "is_peak", "conn_type", "appliance_count",
            "avg_hourly_kwh", "prev_hour_kwh",
        ]
        importances = self.model.feature_importances_
        top_features = sorted(
            zip(feat_names, importances), key=lambda x: x[1], reverse=True
        )[:5]

        return {
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "r2_score": round(r2, 4),
            "test_samples": len(X_test),
            "train_samples": len(X_train),
            "top_features": [{"name": f, "importance": round(float(imp), 4)} for f, imp in top_features],
        }

    def predict_next_24h(self, profile: dict) -> list[dict]:
        """Predict next 24h consumption for a user profile."""
        if not self.is_trained:
            return []

        CONN_MAP = {"residential": 0, "commercial": 1, "industrial": 2}
        conn = CONN_MAP.get(profile.get("conn_type", "residential"), 0)
        n_apps = len(profile.get("appliances", []))
        hourly = profile.get("hourly_consumption", [0] * 24)
        avg_kwh = sum(e["kwh"] if isinstance(e, dict) else e for e in hourly)

        predictions = []
        prev_kwh = hourly[-1]["kwh"] if isinstance(hourly[-1], dict) else hourly[-1]

        for hour in range(24):
            features = np.array([[
                hour,
                np.sin(2 * np.pi * hour / 24),
                np.cos(2 * np.pi * hour / 24),
                3, 2,  # Wednesday, March
                0.0,
                1.0 if 17 <= hour < 22 else 0.0,
                conn,
                n_apps,
                avg_kwh / 24,
                prev_kwh,
            ]])
            features_s = self.scaler.transform(features)
            pred = float(self.model.predict(features_s)[0])
            pred = max(0, pred)  # clamp non-negative
            predictions.append({
                "hour": hour,
                "predicted_kwh": round(pred, 4),
                "is_peak": 17 <= hour < 22,
            })
            prev_kwh = pred

        return predictions

    def save(self):
        joblib.dump(self.model, os.path.join(MODELS_DIR, "consumption_predictor.joblib"))
        joblib.dump(self.scaler, os.path.join(MODELS_DIR, "consumption_scaler.joblib"))

    def load(self):
        path = os.path.join(MODELS_DIR, "consumption_predictor.joblib")
        if os.path.exists(path):
            self.model = joblib.load(path)
            self.scaler = joblib.load(os.path.join(MODELS_DIR, "consumption_scaler.joblib"))
            self.is_trained = True
            return True
        return False


# ═══════════════════════════════════════════════════════════════════
# 3. User Segmenter — K-Means Clustering
# ═══════════════════════════════════════════════════════════════════

class UserSegmenter:
    """
    K-Means clustering for user segmentation by consumption pattern.
    Segments: low_usage, moderate, high_usage, peak_heavy, night_owl
    """

    SEGMENT_LABELS = {
        0: "low_usage",
        1: "moderate",
        2: "high_usage",
        3: "peak_heavy",
        4: "night_owl",
    }

    def __init__(self, n_clusters: int = 5):
        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        self.scaler = StandardScaler()
        self.n_clusters = n_clusters
        self.is_trained = False
        self.cluster_descriptions = {}

    def _extract_features(self, profiles: list[dict]) -> np.ndarray:
        """
        Per-user features: [avg_kwh, max_kwh, min_kwh, peak_ratio,
                            off_peak_ratio, std_dev, anomaly_count]
        """
        features = []
        for profile in profiles:
            hourly = profile.get("hourly_consumption", [])
            values = [e["kwh"] if isinstance(e, dict) else e for e in hourly]
            if not values:
                values = [0] * 24

            avg = np.mean(values)
            peak_vals = [v for i, v in enumerate(values) if 17 <= (i % 24) < 22]
            off_peak_vals = [v for i, v in enumerate(values) if 0 <= (i % 24) < 6]

            features.append([
                avg,
                max(values),
                min(values),
                np.mean(peak_vals) / avg if avg > 0 and peak_vals else 0,
                np.mean(off_peak_vals) / avg if avg > 0 and off_peak_vals else 0,
                np.std(values),
                profile.get("anomaly_count", 0),
            ])
        return np.array(features)

    def train(self, profiles: list[dict]) -> dict:
        """Train K-Means and return cluster analysis."""
        X = self._extract_features(profiles)
        X_scaled = self.scaler.fit_transform(X)
        labels = self.model.fit_predict(X_scaled)
        self.is_trained = True

        # Analyse clusters
        cluster_info = {}
        for i in range(self.n_clusters):
            mask = labels == i
            cluster_data = X[mask]
            label = self.SEGMENT_LABELS.get(i, f"segment_{i}")

            cluster_info[label] = {
                "count": int(np.sum(mask)),
                "avg_consumption": round(float(np.mean(cluster_data[:, 0])), 2),
                "avg_peak_ratio": round(float(np.mean(cluster_data[:, 3])), 3),
                "avg_std_dev": round(float(np.mean(cluster_data[:, 5])), 3),
            }

        self.cluster_descriptions = cluster_info
        return {
            "n_clusters": self.n_clusters,
            "total_users": len(X),
            "inertia": round(float(self.model.inertia_), 2),
            "clusters": cluster_info,
        }

    def predict(self, profile: dict) -> dict:
        """Classify a single user into a segment."""
        if not self.is_trained:
            return {"segment": "unknown", "cluster": -1}
        X = self._extract_features([profile])
        X_scaled = self.scaler.transform(X)
        cluster = int(self.model.predict(X_scaled)[0])
        return {
            "segment": self.SEGMENT_LABELS.get(cluster, f"segment_{cluster}"),
            "cluster": cluster,
            "description": self.cluster_descriptions.get(
                self.SEGMENT_LABELS.get(cluster, ""), {}
            ),
        }

    def save(self):
        joblib.dump(self.model, os.path.join(MODELS_DIR, "user_segmenter.joblib"))
        joblib.dump(self.scaler, os.path.join(MODELS_DIR, "segmenter_scaler.joblib"))
        joblib.dump(self.cluster_descriptions, os.path.join(MODELS_DIR, "cluster_desc.joblib"))

    def load(self):
        path = os.path.join(MODELS_DIR, "user_segmenter.joblib")
        if os.path.exists(path):
            self.model = joblib.load(path)
            self.scaler = joblib.load(os.path.join(MODELS_DIR, "segmenter_scaler.joblib"))
            self.cluster_descriptions = joblib.load(os.path.join(MODELS_DIR, "cluster_desc.joblib"))
            self.is_trained = True
            return True
        return False

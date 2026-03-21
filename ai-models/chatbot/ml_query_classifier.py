"""
💬 Chatbot — ML Query Classifier
TF-IDF + Random Forest multi-class classifier for query type detection.
"""

import os
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


class QueryClassifier:
    """
    TF-IDF + Random Forest classifier for chatbot query types.
    Classifies queries into: usage_period, comparison, bill_analysis,
    peak_analysis, forecast, tariff_info, optimization, complaint,
    live_status, history, general.
    """

    def __init__(self):
        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 3),
                max_features=6000,
                sublinear_tf=True,
                strip_accents="unicode",
                min_df=1,
                max_df=0.95,
            )),
            ("classifier", RandomForestClassifier(
                n_estimators=200,
                max_depth=20,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            )),
        ])
        self.is_trained = False
        self.classes_ = []
        self.training_metrics = {}

    def train(self, training_data: list[dict]) -> dict:
        """
        Train on query-type pairs.
        Args:
            training_data: list of {"query": str, "query_type": str}
        """
        texts = [d["query"] for d in training_data]
        labels = [d["query_type"] for d in training_data]

        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )

        self.pipeline.fit(X_train, y_train)
        self.is_trained = True
        self.classes_ = list(self.pipeline.classes_)

        y_pred = self.pipeline.predict(X_test)
        accuracy = float(accuracy_score(y_test, y_pred))
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

        per_type = {}
        for qtype in set(y_test):
            if qtype in report:
                per_type[qtype] = {
                    "precision": round(report[qtype]["precision"], 4),
                    "recall": round(report[qtype]["recall"], 4),
                    "f1": round(report[qtype]["f1-score"], 4),
                    "support": int(report[qtype]["support"]),
                }

        self.training_metrics = {
            "accuracy": round(accuracy, 4),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "n_query_types": len(set(labels)),
            "per_type": per_type,
            "macro_f1": round(report.get("macro avg", {}).get("f1-score", 0), 4),
            "weighted_f1": round(report.get("weighted avg", {}).get("f1-score", 0), 4),
        }

        return self.training_metrics

    def predict(self, text: str) -> dict:
        """Classify a single query."""
        if not self.is_trained:
            return {"query_type": "general", "confidence": 0.0, "all_scores": {}}

        probas = self.pipeline.predict_proba([text])[0]
        top_idx = int(np.argmax(probas))
        qtype = self.classes_[top_idx]
        confidence = float(probas[top_idx])

        all_scores = {
            self.classes_[i]: round(float(p), 4)
            for i, p in enumerate(probas) if p > 0.01
        }
        all_scores = dict(sorted(all_scores.items(), key=lambda x: x[1], reverse=True))

        return {
            "query_type": qtype,
            "confidence": round(confidence, 4),
            "all_scores": all_scores,
        }

    def save(self):
        joblib.dump(self.pipeline, os.path.join(MODELS_DIR, "query_classifier.joblib"))
        joblib.dump(self.classes_, os.path.join(MODELS_DIR, "query_classes.joblib"))

    def load(self) -> bool:
        path = os.path.join(MODELS_DIR, "query_classifier.joblib")
        if os.path.exists(path):
            self.pipeline = joblib.load(path)
            self.classes_ = joblib.load(os.path.join(MODELS_DIR, "query_classes.joblib"))
            self.is_trained = True
            return True
        return False

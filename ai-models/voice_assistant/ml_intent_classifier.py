"""
🎙️ Voice Assistant — ML Intent Classifier
TF-IDF (1–3 ngrams) + LinearSVC pipeline for intent classification.
Trained on synthetic utterance dataset.
"""

import os
import json
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


class IntentClassifier:
    """
    Production-quality TF-IDF + SVM intent classifier.
    - TF-IDF with unigrams, bigrams, trigrams
    - CalibratedClassifierCV wrapping LinearSVC for probability estimates
    - Trained on synthetic utterances, evaluated on held-out test set
    """

    def __init__(self):
        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 3),
                max_features=8000,
                sublinear_tf=True,
                strip_accents="unicode",
                analyzer="word",
                min_df=1,
                max_df=0.95,
            )),
            ("classifier", CalibratedClassifierCV(
                LinearSVC(max_iter=5000, C=1.0, class_weight="balanced"),
                cv=3,
            )),
        ])
        self.is_trained = False
        self.classes_ = []
        self.training_metrics = {}

    def train(self, training_data: list[dict]) -> dict:
        """
        Train on intent-utterance pairs.
        Args:
            training_data: list of {"utterance": str, "intent": str}
        Returns:
            dict with accuracy, per-intent precision/recall/F1
        """
        texts = [d["utterance"] for d in training_data]
        labels = [d["intent"] for d in training_data]

        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )

        self.pipeline.fit(X_train, y_train)
        self.is_trained = True
        self.classes_ = list(self.pipeline.classes_)

        # Evaluate
        y_pred = self.pipeline.predict(X_test)
        accuracy = float(accuracy_score(y_test, y_pred))
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

        # Per-intent metrics
        per_intent = {}
        for intent in set(y_test):
            if intent in report:
                per_intent[intent] = {
                    "precision": round(report[intent]["precision"], 4),
                    "recall": round(report[intent]["recall"], 4),
                    "f1": round(report[intent]["f1-score"], 4),
                    "support": int(report[intent]["support"]),
                }

        self.training_metrics = {
            "accuracy": round(accuracy, 4),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "n_intents": len(set(labels)),
            "per_intent": per_intent,
            "macro_f1": round(report.get("macro avg", {}).get("f1-score", 0), 4),
            "weighted_f1": round(report.get("weighted avg", {}).get("f1-score", 0), 4),
        }

        return self.training_metrics

    def predict(self, text: str) -> dict:
        """
        Classify a single utterance.
        Returns:
            {"intent": str, "confidence": float, "all_scores": dict}
        """
        if not self.is_trained:
            return {"intent": "general_query", "confidence": 0.0, "all_scores": {}}

        probas = self.pipeline.predict_proba([text])[0]
        top_idx = int(np.argmax(probas))
        intent = self.classes_[top_idx]
        confidence = float(probas[top_idx])

        # All scores
        all_scores = {
            self.classes_[i]: round(float(p), 4)
            for i, p in enumerate(probas) if p > 0.01
        }
        # Sort by score
        all_scores = dict(sorted(all_scores.items(), key=lambda x: x[1], reverse=True))

        return {
            "intent": intent,
            "confidence": round(confidence, 4),
            "all_scores": all_scores,
        }

    def predict_batch(self, texts: list[str]) -> list[dict]:
        """Classify multiple utterances."""
        return [self.predict(t) for t in texts]

    def save(self):
        joblib.dump(self.pipeline, os.path.join(MODELS_DIR, "intent_classifier.joblib"))
        joblib.dump(self.classes_, os.path.join(MODELS_DIR, "intent_classes.joblib"))

    def load(self) -> bool:
        path = os.path.join(MODELS_DIR, "intent_classifier.joblib")
        if os.path.exists(path):
            self.pipeline = joblib.load(path)
            self.classes_ = joblib.load(os.path.join(MODELS_DIR, "intent_classes.joblib"))
            self.is_trained = True
            return True
        return False

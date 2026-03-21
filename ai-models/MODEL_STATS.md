# ═══════════════════════════════════════════════════════════════════════
#           ⚡ PowerPilot AI Engine v2.0.0 — Model Stats Report
# ═══════════════════════════════════════════════════════════════════════


# ┌─────────────────────────────────────────────────────────────────────┐
# │                      OVERVIEW                                      │
# ├─────────────────────────────────────────────────────────────────────┤
# │  Total ML Models:         6                                        │
# │  Total Model Files:      12  (.joblib)                             │
# │  Total Model Size:       11.8 MB                                   │
# │  Total Training Records: 31,000                                    │
# │  Total Dataset Size:     95.9 MB                                   │
# │  Training Time:          ~60 seconds                               │
# │  Framework:              scikit-learn 1.3+                         │
# │  Language:               Python 3.10+                              │
# └─────────────────────────────────────────────────────────────────────┘


# ═══════════════════════════════════════════════════════════════════════
# MODEL 1:  🎙️ Intent Classifier (Voice Assistant + Chatbot NLU)
# ═══════════════════════════════════════════════════════════════════════
#
#   Algorithm:     TF-IDF (1–3 ngrams) + CalibratedClassifierCV(LinearSVC)
#   Training Data: 8,000 utterances (5,000 chatbot + 3,000 voice)
#   Train/Test:    6,400 / 1,600 (80/20 split, stratified)
#   Intents:       10
#
#   ┌─────────────────────────────────────────────────────────────────┐
#   │  OVERALL METRICS                                                │
#   │  Accuracy:      99.94%                                          │
#   │  Macro F1:      0.9994                                          │
#   │  Weighted F1:   0.9994                                          │
#   └─────────────────────────────────────────────────────────────────┘
#
#   PER-INTENT BREAKDOWN:
#   ┌───────────────────┬───────────┬──────────┬────────┬─────────┐
#   │ Intent            │ Precision │ Recall   │ F1     │ Support │
#   ├───────────────────┼───────────┼──────────┼────────┼─────────┤
#   │ check_usage       │ 0.9938    │ 1.0000   │ 0.9969 │ 160     │
#   │ check_bill        │ 1.0000    │ 1.0000   │ 1.0000 │ 160     │
#   │ control_device    │ 1.0000    │ 1.0000   │ 1.0000 │ 160     │
#   │ get_tips          │ 1.0000    │ 1.0000   │ 1.0000 │ 160     │
#   │ file_complaint    │ 1.0000    │ 1.0000   │ 1.0000 │ 160     │
#   │ compare_usage     │ 1.0000    │ 0.9938   │ 0.9969 │ 160     │
#   │ check_tariff      │ 1.0000    │ 1.0000   │ 1.0000 │ 160     │
#   │ greet             │ 1.0000    │ 1.0000   │ 1.0000 │ 160     │
#   │ goodbye           │ 1.0000    │ 1.0000   │ 1.0000 │ 160     │
#   │ general_query     │ 1.0000    │ 1.0000   │ 1.0000 │ 160     │
#   └───────────────────┴───────────┴──────────┴────────┴─────────┘
#
#   Model File:  intent_classifier.joblib (1,714 KB)
#   Scaler File: intent_classes.joblib    (1 KB)


# ═══════════════════════════════════════════════════════════════════════
# MODEL 2:  💬 Query Classifier (Chatbot)
# ═══════════════════════════════════════════════════════════════════════
#
#   Algorithm:     TF-IDF (1–3 ngrams) + RandomForestClassifier (200 trees)
#   Training Data: 3,000 query-type samples
#   Train/Test:    2,400 / 600 (80/20 split, stratified)
#   Query Types:   11
#
#   ┌─────────────────────────────────────────────────────────────────┐
#   │  OVERALL METRICS                                                │
#   │  Accuracy:      94.00%                                          │
#   │  Macro F1:      0.9426                                          │
#   │  Weighted F1:   0.9428                                          │
#   └─────────────────────────────────────────────────────────────────┘
#
#   PER-TYPE BREAKDOWN:
#   ┌───────────────────┬───────────┬──────────┬────────┬─────────┐
#   │ Query Type        │ Precision │ Recall   │ F1     │ Support │
#   ├───────────────────┼───────────┼──────────┼────────┼─────────┤
#   │ usage_period      │ 1.0000    │ 0.9818   │ 0.9908 │ 55      │
#   │ comparison        │ 1.0000    │ 0.8333   │ 0.9091 │ 54      │
#   │ bill_analysis     │ 1.0000    │ 1.0000   │ 1.0000 │ 55      │
#   │ peak_analysis     │ 1.0000    │ 1.0000   │ 1.0000 │ 55      │
#   │ forecast          │ 1.0000    │ 0.8889   │ 0.9412 │ 54      │
#   │ tariff_info       │ 1.0000    │ 0.9818   │ 0.9908 │ 55      │
#   │ optimization      │ 1.0000    │ 1.0000   │ 1.0000 │ 55      │
#   │ complaint         │ 0.6548    │ 1.0000   │ 0.7914 │ 55      │
#   │ live_status       │ 1.0000    │ 0.8704   │ 0.9307 │ 54      │
#   │ history           │ 0.8852    │ 1.0000   │ 0.9391 │ 54      │
#   │ general           │ 1.0000    │ 0.7778   │ 0.8750 │ 54      │
#   └───────────────────┴───────────┴──────────┴────────┴─────────┘
#
#   Model File:  query_classifier.joblib (3,412 KB)
#   Scaler File: query_classes.joblib    (1 KB)


# ═══════════════════════════════════════════════════════════════════════
# MODEL 3:  📈 Demand Forecaster (Scheduler)
# ═══════════════════════════════════════════════════════════════════════
#
#   Algorithm:     GradientBoostingRegressor (250 trees, depth 5, lr 0.05)
#   Training Data: 8,760 hourly samples (365 days × 24 hours)
#   Train/Test:    7,008 / 1,752 (80/20 split)
#
#   ┌─────────────────────────────────────────────────────────────────┐
#   │  OVERALL METRICS                                                │
#   │  RMSE:          3.7047 MW                                       │
#   │  MAE:           2.9322 MW                                       │
#   │  R² Score:      0.9839                                          │
#   └─────────────────────────────────────────────────────────────────┘
#
#   FEATURE IMPORTANCE:
#   ┌─────────────────────┬──────────────┐
#   │ Feature             │ Importance   │
#   ├─────────────────────┼──────────────┤
#   │ prev_hour_demand    │ 0.8560       │
#   │ hour_cos            │ 0.0810       │
#   │ hour                │ 0.0367       │
#   │ temperature         │ 0.0185       │
#   │ hour_sin            │ 0.0043       │
#   └─────────────────────┴──────────────┘
#
#   Model File:  demand_forecaster.joblib (1,129 KB)
#   Scaler File: demand_scaler.joblib     (1 KB)


# ═══════════════════════════════════════════════════════════════════════
# MODEL 4:  📊 Consumption Predictor (Optimizer)
# ═══════════════════════════════════════════════════════════════════════
#
#   Algorithm:     GradientBoostingRegressor (300 trees, depth 6, lr 0.05)
#   Training Data: 120,000 hourly readings (5,000 profiles × 24 hours)
#   Train/Test:    96,000 / 24,000 (80/20 split)
#
#   ┌─────────────────────────────────────────────────────────────────┐
#   │  OVERALL METRICS                                                │
#   │  RMSE:          31.0331 kWh                                     │
#   │  MAE:           6.1267 kWh                                      │
#   │  R² Score:      0.8020                                          │
#   └─────────────────────────────────────────────────────────────────┘
#
#   FEATURE IMPORTANCE:
#   ┌─────────────────────┬──────────────┐
#   │ Feature             │ Importance   │
#   ├─────────────────────┼──────────────┤
#   │ avg_hourly_kwh      │ 0.8719       │
#   │ prev_hour_kwh       │ 0.0720       │
#   │ hour_cos            │ 0.0169       │
#   │ conn_type           │ 0.0129       │
#   │ hour                │ 0.0085       │
#   └─────────────────────┴──────────────┘
#
#   Model File:  consumption_predictor.joblib (2,145 KB)
#   Scaler File: consumption_scaler.joblib    (1 KB)


# ═══════════════════════════════════════════════════════════════════════
# MODEL 5:  🔍 Anomaly Detector (Optimizer)
# ═══════════════════════════════════════════════════════════════════════
#
#   Algorithm:     IsolationForest (200 trees, contamination 5%)
#   Training Data: 120,000 hourly readings (5,000 profiles × 24 hours)
#
#   ┌─────────────────────────────────────────────────────────────────┐
#   │  OVERALL METRICS                                                │
#   │  Total Samples:     120,000                                     │
#   │  Anomalies Found:   5,996 (5.0%)                                │
#   │  Precision:         0.1594                                      │
#   │  Recall:            0.1580                                      │
#   │  F1 Score:          0.1587                                      │
#   └─────────────────────────────────────────────────────────────────┘
#
#   Features Used:
#     [kwh, hour, hour_sin, hour_cos, is_peak, rolling_mean_3h]
#
#   Model File:  anomaly_detector.joblib (3,347 KB)
#   Scaler File: anomaly_scaler.joblib   (1 KB)


# ═══════════════════════════════════════════════════════════════════════
# MODEL 6:  👥 User Segmenter (Optimizer)
# ═══════════════════════════════════════════════════════════════════════
#
#   Algorithm:     KMeans (5 clusters, n_init 10)
#   Training Data: 10,000 user profiles
#   Inertia:       8,763.93
#
#   CLUSTER ANALYSIS:
#   ┌────────────────┬───────┬──────────────┬────────────────┬───────────┐
#   │ Segment        │ Users │ Avg kWh/day  │ Peak Ratio     │ Std Dev   │
#   ├────────────────┼───────┼──────────────┼────────────────┼───────────┤
#   │ low_usage      │ 3,317 │ 3.77         │ 0.818          │ 3.35      │
#   │ high_usage     │ 3,349 │ 0.60         │ 1.782          │ 0.44      │
#   │ peak_heavy     │ 1,485 │ 100.37       │ 1.022          │ 30.89     │
#   │ night_owl      │   991 │ 127.74       │ 1.021          │ 19.07     │
#   │ moderate       │   858 │ 161.73       │ 1.029          │ 91.94     │
#   └────────────────┴───────┴──────────────┴────────────────┴───────────┘
#
#   Features Used:
#     [avg_kwh, max_kwh, min_kwh, peak_ratio, off_peak_ratio, std_dev, anomaly_count]
#
#   Model File:  user_segmenter.joblib   (40 KB)
#   Scaler File: segmenter_scaler.joblib (1 KB)


# ═══════════════════════════════════════════════════════════════════════
#                      TRAINING DATASETS
# ═══════════════════════════════════════════════════════════════════════
#
#   ┌────────────────────────────┬──────────┬───────────┐
#   │ Dataset                    │ Records  │ Size      │
#   ├────────────────────────────┼──────────┼───────────┤
#   │ optimizer_training.json    │ 20,000   │ 94.3 MB   │
#   │ chatbot_intents.json       │ 5,000    │ 702 KB    │
#   │ query_training.json        │ 3,000    │ 328 KB    │
#   │ voice_commands.json        │ 3,000    │ 662 KB    │
#   ├────────────────────────────┼──────────┼───────────┤
#   │ TOTAL                      │ 31,000   │ 95.9 MB   │
#   └────────────────────────────┴──────────┴───────────┘
#
#   Data Characteristics:
#     • Kaggle-quality seasonal & weather-correlated distributions
#     • 3 connection types: residential, commercial, industrial
#     • 24 appliance types across 3 categories
#     • ~5% anomaly injection rate (spike + drop)
#     • Hindi-English code-switching in voice/chatbot data
#     • Typo injection and filler words for realism


# ═══════════════════════════════════════════════════════════════════════
#                      MODEL FILE INVENTORY
# ═══════════════════════════════════════════════════════════════════════
#
#   ┌──────────────────────────────────┬───────────┐
#   │ File                             │ Size      │
#   ├──────────────────────────────────┼───────────┤
#   │ anomaly_detector.joblib          │ 3,347 KB  │
#   │ query_classifier.joblib          │ 3,412 KB  │
#   │ consumption_predictor.joblib     │ 2,145 KB  │
#   │ intent_classifier.joblib         │ 1,714 KB  │
#   │ demand_forecaster.joblib         │ 1,129 KB  │
#   │ user_segmenter.joblib            │    40 KB  │
#   │ anomaly_scaler.joblib            │     1 KB  │
#   │ consumption_scaler.joblib        │     1 KB  │
#   │ demand_scaler.joblib             │     1 KB  │
#   │ segmenter_scaler.joblib          │     1 KB  │
#   │ intent_classes.joblib            │     1 KB  │
#   │ query_classes.joblib             │     1 KB  │
#   │ cluster_desc.joblib              │     1 KB  │
#   │ training_metrics.json            │     5 KB  │
#   ├──────────────────────────────────┼───────────┤
#   │ TOTAL                            │ 11,800 KB │
#   └──────────────────────────────────┴───────────┘

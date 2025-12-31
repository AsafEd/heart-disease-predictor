"""Machine Learning model: training, preprocessing, and prediction."""
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
)
from typing import Dict, Any, List, Optional

# Column definitions
FEATURE_COLUMNS = ['age', 'sex', 'cp', 'trtbps', 'chol', 'fbs', 'restecg', 'thalachh', 'exng', 'ca']
TARGET_COLUMN = 'target'

CATEGORICAL_COLS = ['cp', 'restecg', 'ca']
NUMERIC_COLS = ['age', 'trtbps', 'chol', 'thalachh']
BINARY_COLS = ['sex', 'fbs', 'exng']

# Feature explanations for the UI
FEATURE_INFO = {
    'age': {
        'label': 'Age',
        'description': 'Patient age in years',
        'min': 1,
        'max': 120,
        'type': 'numeric'
    },
    'sex': {
        'label': 'Sex',
        'description': 'Biological sex',
        'options': [
            {'value': 0, 'label': 'Female'},
            {'value': 1, 'label': 'Male'}
        ],
        'type': 'binary'
    },
    'cp': {
        'label': 'Chest Pain Type',
        'description': 'Type of chest pain experienced',
        'options': [
            {'value': 0, 'label': 'Typical Angina'},
            {'value': 1, 'label': 'Atypical Angina'},
            {'value': 2, 'label': 'Non-Anginal Pain'},
            {'value': 3, 'label': 'Asymptomatic'}
        ],
        'type': 'categorical'
    },
    'trtbps': {
        'label': 'Resting Blood Pressure',
        'description': 'Resting blood pressure in mm Hg on admission',
        'min': 50,
        'max': 250,
        'unit': 'mm Hg',
        'type': 'numeric'
    },
    'chol': {
        'label': 'Cholesterol',
        'description': 'Serum cholesterol level',
        'min': 80,
        'max': 700,
        'unit': 'mg/dl',
        'type': 'numeric'
    },
    'fbs': {
        'label': 'Fasting Blood Sugar',
        'description': 'Fasting blood sugar > 120 mg/dl',
        'options': [
            {'value': 0, 'label': 'No (<=120 mg/dl)'},
            {'value': 1, 'label': 'Yes (>120 mg/dl)'}
        ],
        'type': 'binary'
    },
    'restecg': {
        'label': 'Resting ECG',
        'description': 'Resting electrocardiographic results',
        'options': [
            {'value': 0, 'label': 'Normal'},
            {'value': 1, 'label': 'ST-T Wave Abnormality'},
            {'value': 2, 'label': 'Left Ventricular Hypertrophy'}
        ],
        'type': 'categorical'
    },
    'thalachh': {
        'label': 'Max Heart Rate',
        'description': 'Maximum heart rate achieved during exercise',
        'min': 50,
        'max': 250,
        'unit': 'bpm',
        'type': 'numeric'
    },
    'exng': {
        'label': 'Exercise-Induced Angina',
        'description': 'Exercise-induced chest pain',
        'options': [
            {'value': 0, 'label': 'No'},
            {'value': 1, 'label': 'Yes'}
        ],
        'type': 'binary'
    },
    'ca': {
        'label': 'Major Vessels',
        'description': 'Number of major vessels colored by fluoroscopy',
        'options': [
            {'value': 0, 'label': '0 vessels'},
            {'value': 1, 'label': '1 vessel'},
            {'value': 2, 'label': '2 vessels'},
            {'value': 3, 'label': '3 vessels'}
        ],
        'type': 'categorical'
    }
}


class HeartDiseaseModel:
    """Heart disease prediction model with preprocessing pipeline."""

    def __init__(self, data_path: str = None):
        self.pipeline: Optional[Pipeline] = None
        self.metrics: Dict[str, Any] = {}
        self.distributions: Dict[str, Dict] = {}
        self.is_trained = False

        # Default data path
        if data_path is None:
            # Try multiple locations for the data file
            possible_paths = [
                os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'heart.csv'),
                '/app/data/heart.csv',  # Docker path
                'data/heart.csv',  # Relative to working directory
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    data_path = path
                    break
            else:
                data_path = possible_paths[0]  # Default to first option

        self.data_path = data_path

    def load_and_train(self) -> bool:
        """Load data and train the model."""
        try:
            # Load data
            df = pd.read_csv(self.data_path)

            # Verify columns
            missing_cols = set(FEATURE_COLUMNS + [TARGET_COLUMN]) - set(df.columns)
            if missing_cols:
                raise ValueError(f"Missing columns in dataset: {missing_cols}")

            # Separate features and target
            X = df[FEATURE_COLUMNS]
            y = df[TARGET_COLUMN]

            # Compute distributions for numeric features (before any transformations)
            self._compute_distributions(df)

            # Train/test split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=0.2,
                random_state=0,
                stratify=y
            )

            # Build preprocessing pipeline
            preprocessor = ColumnTransformer(
                transformers=[
                    ('num', StandardScaler(), NUMERIC_COLS),
                    ('cat', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_COLS),
                    ('bin', 'passthrough', BINARY_COLS)
                ]
            )

            # Full pipeline with logistic regression
            self.pipeline = Pipeline([
                ('preprocessor', preprocessor),
                ('classifier', LogisticRegression(max_iter=1000, random_state=0))
            ])

            # Train
            self.pipeline.fit(X_train, y_train)

            # Evaluate on test set
            y_pred = self.pipeline.predict(X_test)
            y_proba = self.pipeline.predict_proba(X_test)[:, 1]

            # Compute metrics
            self.metrics = {
                'accuracy': round(accuracy_score(y_test, y_pred), 4),
                'precision': round(precision_score(y_test, y_pred), 4),
                'recall': round(recall_score(y_test, y_pred), 4),
                'f1': round(f1_score(y_test, y_pred), 4),
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
                'test_size': len(y_test),
                'train_size': len(y_train)
            }

            self.is_trained = True
            return True

        except Exception as e:
            print(f"Error training model: {e}")
            raise

    def _compute_distributions(self, df: pd.DataFrame):
        """Compute histogram data for numeric features."""
        for col in NUMERIC_COLS:
            values = df[col].dropna().values
            hist, bin_edges = np.histogram(values, bins=20)
            self.distributions[col] = {
                'histogram': hist.tolist(),
                'bin_edges': bin_edges.tolist(),
                'min': float(values.min()),
                'max': float(values.max()),
                'mean': float(values.mean()),
                'std': float(values.std())
            }

    def predict(self, features: Dict[str, int]) -> Dict[str, Any]:
        """Make a prediction for a single patient."""
        if not self.is_trained:
            raise RuntimeError("Model is not trained. Call load_and_train() first.")

        # Create DataFrame with single row
        input_df = pd.DataFrame([features])[FEATURE_COLUMNS]

        # Get prediction and probability
        prediction = int(self.pipeline.predict(input_df)[0])
        probability = float(self.pipeline.predict_proba(input_df)[0, 1])

        return {
            'predicted_label': prediction,
            'predicted_probability': round(probability, 4),
            'input_echo': features
        }

    def get_metrics(self) -> Dict[str, Any]:
        """Return model evaluation metrics."""
        return self.metrics

    def get_distributions(self) -> Dict[str, Dict]:
        """Return feature distributions for visualization."""
        return self.distributions

    def get_feature_info(self) -> Dict[str, Dict]:
        """Return feature information for the UI."""
        return FEATURE_INFO


# Singleton instance for the application
_model_instance: Optional[HeartDiseaseModel] = None


def get_model() -> HeartDiseaseModel:
    """Get or create the model singleton."""
    global _model_instance
    if _model_instance is None:
        _model_instance = HeartDiseaseModel()
        _model_instance.load_and_train()
    return _model_instance


def init_model():
    """Initialize the model on startup."""
    get_model()

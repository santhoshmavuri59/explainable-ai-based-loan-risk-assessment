# Explainable AI-Based Loan Risk Assessment — Python Backend

This directory contains the Python 3 / Flask / SQLAlchemy / Scikit-Learn / XGBoost / LightGBM / SHAP backend implementation as specified in the project engineering requirements.

## Architecture & Technology Stack
- **Web Framework**: Flask 3.0.x with Werkzeug password hashing
- **ORM & Database**: Flask-SQLAlchemy with SQLite (`loan_risk.db`) or PostgreSQL
- **Machine Learning**: XGBoost, LightGBM, Random Forest (Scikit-Learn)
- **Explainability**: SHAP (SHapley Additive exPlanations)
- **OCR Engine**: Tesseract OCR & OpenCV for preprocessing
- **Anomaly Detection**: Scikit-Learn Isolation Forest

## Local Execution Instructions

### 1. Setup Virtual Environment
```bash
python3 -m venv .venv
# On Linux/macOS:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate
```

### 2. Install Required Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Tesseract OCR (if not already installed)
- **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr libtesseract-dev`
- **macOS**: `brew install tesseract`
- **Windows**: Download Tesseract installer from UB-Mannheim and add to system PATH.

### 4. Run Pytest Automated Verification
```bash
python -m pytest -v tests/
```

### 5. Launch Flask Development Server
```bash
flask --app app run --port 5000 --debug
```
The REST API will be accessible at `http://127.0.0.1:5000`.

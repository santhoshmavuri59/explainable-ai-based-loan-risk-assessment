import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, LoanApplication, DocumentRecord, RiskPredictionRecord, FraudAnomalyRecord, AuditLogRecord
from services.ml_service import LoanMLService
from services.ocr_service import OCRVerificationService
from services.fraud_detector import FraudAnomalyDetector

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'loan-risk-secret-key-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///loan_risk.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db.init_app(app)

ml_service = LoanMLService()
ocr_service = OCRVerificationService()
fraud_detector = FraudAnomalyDetector()

with app.app_context():
    db.create_all()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'backend': 'Python/Flask + SQLAlchemy',
        'models': ['XGBoost', 'Random Forest', 'LightGBM'],
        'ocr': 'Tesseract + OpenCV Service'
    })

@app.route('/api/applications', methods=['POST'])
def submit_application():
    data = request.json or {}
    loan_amount = float(data.get('loan_amount', 0))
    monthly_income = float(data.get('monthly_income', 0))

    if loan_amount <= 0 or monthly_income <= 0:
        return jsonify({'error': 'Invalid financial parameters'}), 400

    app_id = f"APP-2026-{str(uuid.uuid4())[:8]}"
    loan_app = LoanApplication(
        id=app_id,
        applicant_id=data.get('applicant_id', 'anon'),
        applicant_name=data.get('applicant_name', 'Applicant'),
        applicant_email=data.get('applicant_email', 'app@example.com'),
        loan_amount=loan_amount,
        loan_tenure_months=int(data.get('loan_tenure_months', 36)),
        monthly_income=monthly_income,
        existing_monthly_debt=float(data.get('existing_monthly_debt', 0)),
        credit_score=int(data.get('credit_score', 650)),
        debt_to_income_ratio=(float(data.get('existing_monthly_debt', 0)) / monthly_income) * 100.0,
        status='Submitted'
    )
    db.session.add(loan_app)

    # ML Inference
    prediction_result = ml_service.predict_risk(data, model_name=data.get('model_name', 'XGBoost'))
    pred_record = RiskPredictionRecord(
        id=f"pred_{str(uuid.uuid4())[:8]}",
        application_id=app_id,
        model_name=prediction_result['model_name'],
        model_version=prediction_result['model_version'],
        risk_score=prediction_result['risk_score'],
        risk_band=prediction_result['risk_band'],
        default_probability=prediction_result['default_probability'],
        shap_factors_json=str(prediction_result['shap_factors']),
        is_hypothetical=False
    )
    db.session.add(pred_record)
    loan_app.status = 'Risk Assessment Completed'

    db.session.commit()
    return jsonify({'application_id': app_id, 'prediction': prediction_result}), 201

if __name__ == '__main__':
    app.run(port=5000, debug=True)

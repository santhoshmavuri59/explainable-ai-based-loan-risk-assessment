"""
Pytest functional and integration test suite for Explainable AI Loan Risk Assessment.
"""
import pytest
from services.ml_service import LoanMLService
from services.fraud_detector import FraudAnomalyDetector

def test_ml_score_bounds_and_shap():
    ml = LoanMLService()
    app_data = {
        'loan_amount': 30000,
        'monthly_income': 6000,
        'existing_monthly_debt': 1500,
        'credit_score': 710,
        'loan_tenure_months': 36
    }
    result = ml.predict_risk(app_data, model_name='XGBoost')
    assert 0 <= result['risk_score'] <= 100
    assert result['risk_band'] in ['Low Risk', 'Medium Risk', 'High Risk']
    assert 0.0 <= result['default_probability'] <= 1.0
    assert len(result['shap_factors']) > 0

def test_high_risk_dti_shap_contribution():
    ml = LoanMLService()
    high_dti_app = {
        'loan_amount': 50000,
        'monthly_income': 4000,
        'existing_monthly_debt': 2500, # 62.5% DTI
        'credit_score': 580,
        'loan_tenure_months': 24
    }
    result = ml.predict_risk(high_dti_app, model_name='XGBoost')
    assert result['risk_score'] >= 60
    # Confirm DTI appears with positive risk attribution
    dti_factor = next((f for f in result['shap_factors'] if f['feature'] == 'dti_ratio'), None)
    assert dti_factor is not None
    assert dti_factor['contribution'] > 0

def test_fraud_detector_financial_implausibility():
    detector = FraudAnomalyDetector()
    invalid_app = {
        'id': 'test_app_1',
        'monthly_income': 3000,
        'existing_monthly_debt': 4500, # Debt exceeds income
        'loan_amount': 20000
    }
    alerts = detector.screen_application(invalid_app, [])
    assert any(a['detection_type'] == 'financial_implausibility' for a in alerts)

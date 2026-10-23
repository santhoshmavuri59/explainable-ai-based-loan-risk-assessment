from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30), nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='applicant', nullable=False) # 'applicant' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship('LoanApplication', backref='applicant', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class LoanApplication(db.Model):
    __tablename__ = 'loan_applications'
    id = db.Column(db.String(36), primary_key=True)
    applicant_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    applicant_name = db.Column(db.String(120), nullable=False)
    applicant_email = db.Column(db.String(120), nullable=False)
    
    # Financial fields
    loan_amount = db.Column(db.Float, nullable=False)
    loan_tenure_months = db.Column(db.Integer, nullable=False)
    loan_purpose = db.Column(db.String(50), default='Personal')
    monthly_income = db.Column(db.Float, nullable=False)
    employment_type = db.Column(db.String(50), default='Salaried')
    employment_duration_years = db.Column(db.Float, default=1.0)
    existing_monthly_debt = db.Column(db.Float, default=0.0)
    credit_score = db.Column(db.Integer, default=650)
    asset_value = db.Column(db.Float, default=0.0)
    home_ownership = db.Column(db.String(30), default='Rent')
    
    # Derived metrics
    debt_to_income_ratio = db.Column(db.Float, default=0.0)
    
    # Status
    status = db.Column(db.String(40), default='Submitted', index=True)
    admin_decision = db.Column(db.String(40), nullable=True)
    admin_decision_reason = db.Column(db.Text, nullable=True)
    admin_decision_by = db.Column(db.String(120), nullable=True)
    admin_decision_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = db.relationship('DocumentRecord', backref='application', lazy=True, cascade='all, delete-orphan')
    predictions = db.relationship('RiskPredictionRecord', backref='application', lazy=True, cascade='all, delete-orphan')
    fraud_alerts = db.relationship('FraudAnomalyRecord', backref='application', lazy=True, cascade='all, delete-orphan')


class DocumentRecord(db.Model):
    __tablename__ = 'document_records'
    id = db.Column(db.String(36), primary_key=True)
    application_id = db.Column(db.String(36), db.ForeignKey('loan_applications.id'), nullable=False, index=True)
    doc_type = db.Column(db.String(50), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, default=0)
    status = db.Column(db.String(40), default='Processing')
    confidence = db.Column(db.Float, default=0.0)
    extracted_fields_json = db.Column(db.Text, default='{}')
    mismatches_json = db.Column(db.Text, default='[]')
    reviewed_by = db.Column(db.String(120), nullable=True)
    reviewer_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class RiskPredictionRecord(db.Model):
    __tablename__ = 'risk_predictions'
    id = db.Column(db.String(36), primary_key=True)
    application_id = db.Column(db.String(36), db.ForeignKey('loan_applications.id'), nullable=False, index=True)
    model_name = db.Column(db.String(50), nullable=False)
    model_version = db.Column(db.String(50), nullable=False)
    risk_score = db.Column(db.Integer, nullable=False)
    risk_band = db.Column(db.String(30), nullable=False)
    default_probability = db.Column(db.Float, nullable=False)
    shap_factors_json = db.Column(db.Text, default='[]')
    summary_explanation = db.Column(db.Text, nullable=True)
    is_hypothetical = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class FraudAnomalyRecord(db.Model):
    __tablename__ = 'fraud_anomalies'
    id = db.Column(db.String(36), primary_key=True)
    application_id = db.Column(db.String(36), db.ForeignKey('loan_applications.id'), nullable=False, index=True)
    detection_type = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), default='medium')
    reason = db.Column(db.Text, nullable=False)
    evidence_json = db.Column(db.Text, default='{}')
    status = db.Column(db.String(40), default='Pending')
    admin_action = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class AuditLogRecord(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.String(36), primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    actor = db.Column(db.String(120), nullable=False)
    actor_role = db.Column(db.String(30), nullable=False)
    action = db.Column(db.String(80), nullable=False)
    target_id = db.Column(db.String(80), nullable=False)
    target_type = db.Column(db.String(40), nullable=False)
    details = db.Column(db.Text, nullable=False)
    previous_state = db.Column(db.String(50), nullable=True)
    new_state = db.Column(db.String(50), nullable=True)

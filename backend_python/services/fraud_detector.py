from typing import Dict, Any, List

class FraudAnomalyDetector:
    """
    Detects velocity patterns, financial discrepancies, and multivariate anomalies.
    """

    def screen_application(self, app_data: Dict[str, Any], existing_apps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        alerts = []
        app_id = app_data.get('id', 'temp')
        email = app_data.get('applicant_email', '').lower()
        phone = app_data.get('applicant_phone', '')
        income = float(app_data.get('monthly_income', 1.0))
        debt = float(app_data.get('existing_monthly_debt', 0.0))
        loan_amount = float(app_data.get('loan_amount', 0.0))

        # 1. Duplicate velocity check
        for prior in existing_apps:
            if prior.get('id') != app_id:
                if prior.get('applicant_email', '').lower() == email or prior.get('applicant_phone') == phone:
                    alerts.append({
                        'detection_type': 'duplicate_pattern',
                        'severity': 'high',
                        'reason': f"Duplicate application detected with matching email/phone (Prior ID: {prior.get('id')})",
                        'status': 'Pending'
                    })
                    break

        # 2. Financial implausibility
        if debt > income:
            alerts.append({
                'detection_type': 'financial_implausibility',
                'severity': 'critical',
                'reason': f"Monthly debt (${debt:,.0f}) exceeds total monthly income (${income:,.0f})",
                'status': 'Pending'
            })

        if loan_amount > income * 12 * 8:
            alerts.append({
                'detection_type': 'financial_implausibility',
                'severity': 'medium',
                'reason': f"Loan amount (${loan_amount:,.0f}) exceeds 8x annual income",
                'status': 'Pending'
            })

        return alerts

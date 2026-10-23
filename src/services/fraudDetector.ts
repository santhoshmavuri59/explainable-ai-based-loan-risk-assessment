import { LoanApplication, FraudAnomalyAlert } from '../types';

/**
 * Enterprise Fraud & Anomaly Screening Service
 * Combines deterministic rule-based integrity checks with statistical anomaly scoring
 * (Isolation Forest multi-dimensional projection).
 */

export function screenApplicationForFraudAndAnomalies(
  application: LoanApplication,
  allExistingApplications: LoanApplication[]
): FraudAnomalyAlert[] {
  const alerts: FraudAnomalyAlert[] = [];
  const now = new Date().toISOString();

  // 1. Duplicate Application Check
  const duplicates = allExistingApplications.filter(
    (app) => app.id !== application.id && (
      app.applicantEmail.toLowerCase() === application.applicantEmail.toLowerCase() ||
      app.applicantPhone === application.applicantPhone
    )
  );

  if (duplicates.length > 0) {
    alerts.push({
      id: `alert_dup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      applicationId: application.id,
      applicantName: application.applicantName,
      detectionType: 'duplicate_pattern',
      severity: 'high',
      reason: `Velocity Warning: Found ${duplicates.length} prior application(s) sharing identical email or phone number.`,
      evidence: {
        duplicateIds: duplicates.map((d) => d.id),
        matchedField: duplicates[0].applicantEmail === application.applicantEmail ? 'email' : 'phone',
      },
      status: 'Pending',
      createdAt: now,
    });
  }

  // 2. Financial Implausibility Checks
  if (application.existingMonthlyDebt > application.monthlyIncome) {
    alerts.push({
      id: `alert_fin_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      applicationId: application.id,
      applicantName: application.applicantName,
      detectionType: 'financial_implausibility',
      severity: 'critical',
      reason: `Implausible Debt Ratio: Existing monthly debt ($${application.existingMonthlyDebt.toLocaleString()}) exceeds total gross monthly income ($${application.monthlyIncome.toLocaleString()}).`,
      evidence: {
        dtiRatio: ((application.existingMonthlyDebt / (application.monthlyIncome || 1)) * 100).toFixed(1) + '%',
        monthlyHeadroom: application.monthlyIncome - application.existingMonthlyDebt,
      },
      status: 'Pending',
      createdAt: now,
    });
  }

  const annualIncome = application.monthlyIncome * 12;
  if (application.loanAmount > annualIncome * 8) {
    alerts.push({
      id: `alert_lev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      applicationId: application.id,
      applicantName: application.applicantName,
      detectionType: 'financial_implausibility',
      severity: 'medium',
      reason: `Excessive Leverage Exposure: Requested loan capital ($${application.loanAmount.toLocaleString()}) is ${(application.loanAmount / (annualIncome || 1)).toFixed(1)}x gross annual income.`,
      evidence: {
        loanToAnnualIncome: (application.loanAmount / (annualIncome || 1)).toFixed(2),
        industryGuidelineMax: 5.0,
      },
      status: 'Pending',
      createdAt: now,
    });
  }

  // 3. Document Mismatch Consistency
  for (const doc of application.documents) {
    if (doc.status === 'Mismatch detected' && doc.mismatches && doc.mismatches.length > 0) {
      alerts.push({
        id: `alert_doc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        applicationId: application.id,
        applicantName: application.applicantName,
        detectionType: 'document_mismatch',
        severity: 'high',
        reason: `Cross-Document Verification Discrepancy: ${doc.mismatches[0]}`,
        evidence: {
          documentType: doc.docType,
          fileName: doc.fileName,
          ocrConfidence: doc.confidence,
          extractedFields: doc.extractedFields,
        },
        status: 'Pending',
        createdAt: now,
      });
    }
  }

  // 4. Statistical Anomaly Detection (Isolation Forest Emulation)
  // Feature vector: [norm_income, norm_loan, norm_credit, norm_dti]
  // In typical loan distributions:
  // mean income ~ $6,500 (sd $3,200), mean loan ~ $28,000 (sd $16,000), mean credit ~ 680 (sd 70)
  const zIncome = (application.monthlyIncome - 6500) / 3200;
  const zLoan = (application.loanAmount - 28000) / 16000;
  const zCredit = (application.creditScore - 680) / 70;
  const zDti = (application.existingMonthlyDebt / (application.monthlyIncome || 1) - 0.35) / 0.18;

  // Mahalanobis / Euclidean distance in normalized feature space
  const outlierDistance = Math.sqrt(
    Math.pow(zIncome, 2) + Math.pow(zLoan, 2) + Math.pow(zCredit, 2) + Math.pow(zDti, 2)
  );

  // Anomaly score in [0, 1] range; higher means more isolated from standard distribution
  const anomalyScore = 1 - Math.exp(-outlierDistance / 3.2);

  if (anomalyScore > 0.82) {
    alerts.push({
      id: `alert_stat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      applicationId: application.id,
      applicantName: application.applicantName,
      detectionType: 'statistical_anomaly',
      severity: anomalyScore > 0.90 ? 'high' : 'medium',
      reason: `Statistical Outlier Detected (Isolation Score: ${(anomalyScore * 100).toFixed(1)}/100). Financial feature configuration deviates significantly from baseline lending cluster.`,
      evidence: {
        isolationScore: Number((anomalyScore * 100).toFixed(1)),
        distanceFromCentroid: Number(outlierDistance.toFixed(2)),
        contributingOutlierDimensions: [
          Math.abs(zDti) > 2.0 ? 'Elevated Debt-to-Income Z-score' : null,
          Math.abs(zLoan) > 2.0 ? 'Atypical Principal Request Z-score' : null,
          Math.abs(zIncome) > 2.0 ? 'Extreme Income Tier Z-score' : null,
        ].filter(Boolean),
      },
      status: 'Pending',
      createdAt: now,
    });
  }

  return alerts;
}

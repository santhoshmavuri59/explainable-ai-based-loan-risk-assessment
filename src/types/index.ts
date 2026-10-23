export type UserRole = 'applicant' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Document Processing'
  | 'Verification Required'
  | 'Risk Assessment Completed'
  | 'Awaiting Administrator Decision'
  | 'Approved'
  | 'Rejected'
  | 'More Information Required';

export type RiskBand = 'Low Risk' | 'Medium Risk' | 'High Risk';

export interface UploadedDocument {
  id: string;
  applicationId: string;
  docType: 'identity_proof' | 'salary_slip' | 'bank_statement' | 'tax_return';
  fileName: string;
  fileSize: number;
  fileData?: string; // Base64 or text preview
  status: 'Processing' | 'Extracted' | 'Matched' | 'Mismatch detected' | 'Needs manual review' | 'OCR failed';
  confidence: number;
  extractedFields: {
    applicantName?: string;
    income?: number;
    employerName?: string;
    accountNumber?: string;
    documentDate?: string;
    idNumber?: string;
    issueAuthority?: string;
  };
  mismatches?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

export interface ShapFactor {
  feature: string;
  label: string;
  value: number | string;
  contribution: number; // positive = increased risk, negative = reduced risk
  description: string;
}

export interface RiskPrediction {
  id: string;
  applicationId: string;
  modelVersion: string;
  modelName: 'XGBoost' | 'Random Forest' | 'LightGBM' | 'Ensemble';
  riskScore: number; // 0 - 100
  riskBand: RiskBand;
  defaultProbability: number; // 0.0 - 1.0
  calibrated: boolean;
  baseValue: number; // base expected score
  shapFactors: ShapFactor[];
  summaryExplanation: string;
  createdAt: string;
  isHypothetical?: boolean;
}

export interface FraudAnomalyAlert {
  id: string;
  applicationId: string;
  applicantName: string;
  detectionType: 'duplicate_pattern' | 'document_mismatch' | 'financial_implausibility' | 'statistical_anomaly' | 'velocity_flag';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  evidence: Record<string, any>;
  status: 'Pending' | 'Under Investigation' | 'Cleared' | 'Confirmed Fraud';
  adminAction?: string;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole | 'system';
  action: string;
  targetId: string;
  targetType: 'application' | 'document' | 'prediction' | 'user' | 'model_training' | 'policy_config';
  details: string;
  previousState?: string;
  newState?: string;
}

export interface LoanApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  
  // Loan parameters
  loanAmount: number;
  loanTenureMonths: number;
  loanPurpose: 'Home Purchase' | 'Auto' | 'Education' | 'Debt Consolidation' | 'Small Business' | 'Personal';
  
  // Financial details
  monthlyIncome: number;
  employmentType: 'Salaried' | 'Self-Employed' | 'Business Owner' | 'Contractor';
  employmentDurationYears: number;
  existingMonthlyDebt: number;
  creditScore: number;
  assetValue: number;
  homeOwnership: 'Own' | 'Mortgage' | 'Rent';
  
  // Derived metrics
  debtToIncomeRatio: number; // DTI %
  paymentToIncomeRatio: number; // PTI %
  
  // Status and flow
  status: ApplicationStatus;
  adminDecision?: 'Approved' | 'Rejected' | 'More Information Required';
  adminDecisionReason?: string;
  adminDecisionBy?: string;
  adminDecisionAt?: string;
  
  // Documents
  documents: UploadedDocument[];
  
  // Prediction & Anomalies
  latestPrediction?: RiskPrediction;
  fraudAlerts: FraudAnomalyAlert[];
  
  createdAt: string;
  updatedAt: string;
}

export interface ModelMetrics {
  modelName: 'XGBoost' | 'Random Forest' | 'LightGBM';
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  trainingTimeMs: number;
  testedSamples: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  features: string[];
  calibrationBrierScore: number;
}

export interface SystemTestResult {
  suiteName: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  durationMs: number;
  details: string;
  timestamp: string;
}

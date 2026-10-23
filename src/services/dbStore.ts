import fs from 'fs';
import path from 'path';
import { User, LoanApplication, AuditLogEvent, UploadedDocument, RiskPrediction, FraudAnomalyAlert } from '../types';
import { calculateRiskPrediction } from './mlEngine';

export interface DatabaseSchema {
  users: User[];
  applications: LoanApplication[];
  auditLogs: AuditLogEvent[];
  systemSettings: {
    lowRiskMax: number;
    mediumRiskMax: number;
    highRiskMin: number;
    activeModel: 'XGBoost' | 'Random Forest' | 'LightGBM';
    autoFraudScreening: boolean;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initial Seed Data if fresh database
function getInitialSeedData(): DatabaseSchema {
  const adminUser: User = {
    id: 'usr_admin_001',
    name: 'Eleanor Vance',
    email: 'admin@riskmatrix.ai',
    phone: '+1 (555) 902-1144',
    role: 'admin',
    createdAt: '2026-01-10T09:00:00Z',
  };

  const applicantUser1: User = {
    id: 'usr_app_001',
    name: 'David Miller',
    email: 'david.miller@example.com',
    phone: '+1 (555) 349-2810',
    role: 'applicant',
    createdAt: '2026-02-14T11:20:00Z',
  };

  const applicantUser2: User = {
    id: 'usr_app_002',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    phone: '+1 (555) 781-9921',
    role: 'applicant',
    createdAt: '2026-02-18T14:10:00Z',
  };

  const applicantUser3: User = {
    id: 'usr_app_003',
    name: 'Marcus Brody',
    email: 'marcus.brody@example.com',
    phone: '+1 (555) 441-6532',
    role: 'applicant',
    createdAt: '2026-02-22T16:45:00Z',
  };

  // Pre-seed 3 detailed applications
  const app1: LoanApplication = {
    id: 'APP-2026-0041',
    applicantId: applicantUser1.id,
    applicantName: 'David Miller',
    applicantEmail: 'david.miller@example.com',
    applicantPhone: '+1 (555) 349-2810',
    loanAmount: 45000,
    loanTenureMonths: 36,
    loanPurpose: 'Debt Consolidation',
    monthlyIncome: 6200,
    employmentType: 'Salaried',
    employmentDurationYears: 4,
    existingMonthlyDebt: 2400,
    creditScore: 640,
    assetValue: 35000,
    homeOwnership: 'Rent',
    debtToIncomeRatio: 38.7,
    paymentToIncomeRatio: 23.4,
    status: 'Risk Assessment Completed',
    documents: [
      {
        id: 'doc_seed_01',
        applicationId: 'APP-2026-0041',
        docType: 'identity_proof',
        fileName: 'david_miller_passport.pdf',
        fileSize: 245000,
        status: 'Matched',
        confidence: 0.98,
        extractedFields: {
          applicantName: 'David Miller',
          idNumber: 'P-98831092',
          issueAuthority: 'Dept of State',
          documentDate: '2024-06-15',
        },
      },
      {
        id: 'doc_seed_02',
        applicationId: 'APP-2026-0041',
        docType: 'salary_slip',
        fileName: 'paystub_jan2026.pdf',
        fileSize: 182000,
        status: 'Matched',
        confidence: 0.94,
        extractedFields: {
          applicantName: 'David Miller',
          income: 6200,
          employerName: 'Apex Logistics LLC',
          documentDate: '2026-01-31',
        },
      },
      {
        id: 'doc_seed_03',
        applicationId: 'APP-2026-0041',
        docType: 'bank_statement',
        fileName: 'bank_statement_q4.pdf',
        fileSize: 420000,
        status: 'Matched',
        confidence: 0.91,
        extractedFields: {
          applicantName: 'David Miller',
          income: 6150,
          accountNumber: '****-****-4412',
          documentDate: '2026-01-15',
        },
      },
    ],
    fraudAlerts: [],
    createdAt: '2026-02-15T09:30:00Z',
    updatedAt: '2026-02-15T09:45:00Z',
  };
  app1.latestPrediction = calculateRiskPrediction(app1, 'XGBoost');

  const app2: LoanApplication = {
    id: 'APP-2026-0042',
    applicantId: applicantUser2.id,
    applicantName: 'Sarah Chen',
    applicantEmail: 'sarah.chen@example.com',
    applicantPhone: '+1 (555) 781-9921',
    loanAmount: 25000,
    loanTenureMonths: 24,
    loanPurpose: 'Home Purchase',
    monthlyIncome: 11500,
    employmentType: 'Salaried',
    employmentDurationYears: 8,
    existingMonthlyDebt: 1200,
    creditScore: 785,
    assetValue: 140000,
    homeOwnership: 'Own',
    debtToIncomeRatio: 10.4,
    paymentToIncomeRatio: 9.8,
    status: 'Approved',
    adminDecision: 'Approved',
    adminDecisionReason: 'Low DTI (<11%), prime credit history (785), clean document verification and strong reserve assets.',
    adminDecisionBy: 'Eleanor Vance',
    adminDecisionAt: '2026-02-19T10:15:00Z',
    documents: [
      {
        id: 'doc_seed_04',
        applicationId: 'APP-2026-0042',
        docType: 'identity_proof',
        fileName: 'chen_dl_verified.png',
        fileSize: 195000,
        status: 'Matched',
        confidence: 0.99,
        extractedFields: {
          applicantName: 'Sarah Chen',
          idNumber: 'DL-7729103',
          issueAuthority: 'DMV California',
          documentDate: '2025-08-20',
        },
      },
      {
        id: 'doc_seed_05',
        applicationId: 'APP-2026-0042',
        docType: 'salary_slip',
        fileName: 'earnings_statement.pdf',
        fileSize: 310000,
        status: 'Matched',
        confidence: 0.97,
        extractedFields: {
          applicantName: 'Sarah Chen',
          income: 11500,
          employerName: 'BioHealth Solutions',
          documentDate: '2026-01-31',
        },
      },
    ],
    fraudAlerts: [],
    createdAt: '2026-02-18T14:30:00Z',
    updatedAt: '2026-02-19T10:15:00Z',
  };
  app2.latestPrediction = calculateRiskPrediction(app2, 'LightGBM');

  const app3: LoanApplication = {
    id: 'APP-2026-0043',
    applicantId: applicantUser3.id,
    applicantName: 'Marcus Brody',
    applicantEmail: 'marcus.brody@example.com',
    applicantPhone: '+1 (555) 441-6532',
    loanAmount: 85000,
    loanTenureMonths: 60,
    loanPurpose: 'Small Business',
    monthlyIncome: 4500,
    employmentType: 'Self-Employed',
    employmentDurationYears: 1,
    existingMonthlyDebt: 3100,
    creditScore: 590,
    assetValue: 8000,
    homeOwnership: 'Rent',
    debtToIncomeRatio: 68.9,
    paymentToIncomeRatio: 42.1,
    status: 'Verification Required',
    documents: [
      {
        id: 'doc_seed_06',
        applicationId: 'APP-2026-0043',
        docType: 'identity_proof',
        fileName: 'm_brody_id_scan.png',
        fileSize: 310000,
        status: 'Matched',
        confidence: 0.95,
        extractedFields: {
          applicantName: 'Marcus Brody',
          idNumber: 'ID-5501934',
          issueAuthority: 'Dept of Licensing',
          documentDate: '2023-01-10',
        },
      },
      {
        id: 'doc_seed_07',
        applicationId: 'APP-2026-0043',
        docType: 'salary_slip',
        fileName: 'payslip_mismatch.pdf',
        fileSize: 220000,
        status: 'Mismatch detected',
        confidence: 0.88,
        extractedFields: {
          applicantName: 'Marcus Brody',
          income: 2800,
          employerName: 'Brody Consulting',
          documentDate: '2026-01-15',
        },
        mismatches: [
          'Declared monthly income ($4,500) deviates from Pay Slip gross income ($2,800) by 37.8%',
        ],
      },
    ],
    fraudAlerts: [
      {
        id: 'alert_seed_01',
        applicationId: 'APP-2026-0043',
        applicantName: 'Marcus Brody',
        detectionType: 'document_mismatch',
        severity: 'high',
        reason: 'Cross-Document Verification Discrepancy: Declared income $4,500 vs Payslip $2,800 (37.8% lower)',
        evidence: { declaredIncome: 4500, extractedIncome: 2800, discrepancy: '37.8%' },
        status: 'Pending',
        createdAt: '2026-02-22T17:05:00Z',
      },
      {
        id: 'alert_seed_02',
        applicationId: 'APP-2026-0043',
        applicantName: 'Marcus Brody',
        detectionType: 'statistical_anomaly',
        severity: 'high',
        reason: 'Statistical Outlier: DTI (68.9%) and Loan-to-Annual Income ratio (18.8x) significantly exceed lending tolerance.',
        evidence: { isolationScore: 92.4, dti: '68.9%' },
        status: 'Pending',
        createdAt: '2026-02-22T17:05:00Z',
      },
    ],
    createdAt: '2026-02-22T17:00:00Z',
    updatedAt: '2026-02-22T17:05:00Z',
  };
  app3.latestPrediction = calculateRiskPrediction(app3, 'XGBoost');

  const auditLogs: AuditLogEvent[] = [
    {
      id: 'aud_001',
      timestamp: '2026-02-15T09:30:00Z',
      actor: 'David Miller',
      actorRole: 'applicant',
      action: 'APPLICATION_SUBMITTED',
      targetId: 'APP-2026-0041',
      targetType: 'application',
      details: 'Submitted loan request for $45,000 (Debt Consolidation, 36 months).',
      newState: 'Submitted',
    },
    {
      id: 'aud_002',
      timestamp: '2026-02-15T09:45:00Z',
      actor: 'System OCR & ML Engine',
      actorRole: 'system',
      action: 'RISK_ASSESSMENT_COMPLETED',
      targetId: 'APP-2026-0041',
      targetType: 'prediction',
      details: 'Risk score computed: 72 (High Risk) via XGBoost v2.4.1. TreeSHAP generated 5 key factors.',
      previousState: 'Submitted',
      newState: 'Risk Assessment Completed',
    },
    {
      id: 'aud_003',
      timestamp: '2026-02-18T14:30:00Z',
      actor: 'Sarah Chen',
      actorRole: 'applicant',
      action: 'APPLICATION_SUBMITTED',
      targetId: 'APP-2026-0042',
      targetType: 'application',
      details: 'Submitted loan request for $25,000 (Home Purchase, 24 months).',
      newState: 'Submitted',
    },
    {
      id: 'aud_004',
      timestamp: '2026-02-19T10:15:00Z',
      actor: 'Eleanor Vance',
      actorRole: 'admin',
      action: 'ADMIN_DECISION_RECORDED',
      targetId: 'APP-2026-0042',
      targetType: 'application',
      details: 'Decision Approved recorded with underwriter reason: Low DTI and prime credit score.',
      previousState: 'Risk Assessment Completed',
      newState: 'Approved',
    },
    {
      id: 'aud_005',
      timestamp: '2026-02-22T17:00:00Z',
      actor: 'Marcus Brody',
      actorRole: 'applicant',
      action: 'APPLICATION_SUBMITTED',
      targetId: 'APP-2026-0043',
      targetType: 'application',
      details: 'Submitted loan request for $85,000.',
      newState: 'Submitted',
    },
    {
      id: 'aud_006',
      timestamp: '2026-02-22T17:05:00Z',
      actor: 'System OCR Service',
      actorRole: 'system',
      action: 'DOCUMENT_MISMATCH_FLAGGED',
      targetId: 'APP-2026-0043',
      targetType: 'document',
      details: 'Discrepancy detected: Declared income $4,500 vs Payslip $2,800. Status shifted to Verification Required.',
      previousState: 'Submitted',
      newState: 'Verification Required',
    },
  ];

  return {
    users: [adminUser, applicantUser1, applicantUser2, applicantUser3],
    applications: [app1, app2, app3],
    auditLogs,
    systemSettings: {
      lowRiskMax: 34,
      mediumRiskMax: 64,
      highRiskMin: 65,
      activeModel: 'XGBoost',
      autoFraudScreening: true,
    },
  };
}

export class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed reading existing db file, resetting to seed:', err);
        this.data = getInitialSeedData();
        this.persist();
      }
    } else {
      this.data = getInitialSeedData();
      this.persist();
    }
  }

  private persist() {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // --- Users ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users.splice(idx, 1);
      // Remove or anonymize their applications
      this.data.applications = this.data.applications.filter((a) => a.applicantId !== id);
      this.persist();
      return true;
    }
    return false;
  }

  // --- Applications ---
  getApplications(): LoanApplication[] {
    return this.data.applications;
  }

  getApplicationById(id: string): LoanApplication | undefined {
    return this.data.applications.find((a) => a.id === id);
  }

  getApplicationsByApplicantId(applicantId: string): LoanApplication[] {
    return this.data.applications.filter((a) => a.applicantId === applicantId);
  }

  saveApplication(app: LoanApplication): LoanApplication {
    const existingIdx = this.data.applications.findIndex((a) => a.id === app.id);
    if (existingIdx !== -1) {
      this.data.applications[existingIdx] = app;
    } else {
      this.data.applications.push(app);
    }
    this.persist();
    return app;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLogEvent[] {
    return this.data.auditLogs;
  }

  addAuditLog(event: Omit<AuditLogEvent, 'id' | 'timestamp'>): AuditLogEvent {
    const log: AuditLogEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.data.auditLogs.unshift(log); // Prepend for recency
    this.persist();
    return log;
  }

  // --- System Settings ---
  getSettings() {
    return this.data.systemSettings;
  }

  updateSettings(settings: Partial<DatabaseSchema['systemSettings']>) {
    this.data.systemSettings = { ...this.data.systemSettings, ...settings };
    this.persist();
    return this.data.systemSettings;
  }

  // --- Reset to seed ---
  resetToSeed() {
    this.data = getInitialSeedData();
    this.persist();
  }
}

export const db = new DatabaseStore();

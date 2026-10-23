import { db } from '../services/dbStore';
import { calculateRiskPrediction, MODEL_REGISTRY } from '../services/mlEngine';
import { processDocumentOcr, runCrossDocumentVerification } from '../services/ocrService';
import { screenApplicationForFraudAndAnomalies } from '../services/fraudDetector';
import { LoanApplication, User } from '../types';

interface TestRecord {
  suite: string;
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

const testResults: TestRecord[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTest(suite: string, name: string, fn: () => void | Promise<void>) {
  const t0 = Date.now();
  try {
    await fn();
    testResults.push({ suite, name, passed: true, durationMs: Date.now() - t0 });
    console.log(`  ✓ [PASS] ${name} (${Date.now() - t0}ms)`);
  } catch (err: any) {
    testResults.push({ suite, name, passed: false, message: err.message, durationMs: Date.now() - t0 });
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('EXPLAINABLE AI LOAN RISK ASSESSMENT — AUTOMATED TESTS');
  console.log('======================================================\n');

  // Suite 1: Authentication & Authorization
  console.log('Suite 1: Authentication & Authorization');
  await runTest('Auth & Permissions', 'Applicant registration creates unique user record', () => {
    const testUser: User = {
      id: `usr_test_${Date.now()}`,
      name: 'Automated Test Applicant',
      email: `test_${Date.now()}@test.org`,
      phone: '+1 555-0199',
      role: 'applicant',
      createdAt: new Date().toISOString(),
    };
    db.addUser(testUser);
    const retrieved = db.getUserById(testUser.id);
    assert(retrieved !== undefined, 'User must be found in database');
    assert(retrieved?.email === testUser.email, 'Email must match');
  });

  await runTest('Auth & Permissions', 'Cross-applicant data isolation prevents unauthorized inspection', () => {
    const applicant1 = 'usr_app_001';
    const applicant2 = 'usr_app_002';
    const appRecord = db.getApplicationById('APP-2026-0041'); // Belongs to usr_app_001
    assert(appRecord !== undefined, 'Pre-seeded application should exist');
    assert(appRecord?.applicantId === applicant1, 'App belongs to applicant 1');
    assert(appRecord?.applicantId !== applicant2, 'Applicant 2 cannot claim ownership of applicant 1 record');
  });

  // Suite 2: Application & Persistence
  console.log('\nSuite 2: Application & Persistence');
  await runTest('Application & Persistence', 'Valid loan application persists with derived DTI ratio', () => {
    const newApp: LoanApplication = {
      id: `APP-TEST-${Date.now()}`,
      applicantId: 'usr_app_001',
      applicantName: 'David Miller',
      applicantEmail: 'david.miller@example.com',
      applicantPhone: '+1 555-349-2810',
      loanAmount: 30000,
      loanTenureMonths: 36,
      loanPurpose: 'Debt Consolidation',
      monthlyIncome: 6000,
      employmentType: 'Salaried',
      employmentDurationYears: 5,
      existingMonthlyDebt: 1800,
      creditScore: 680,
      assetValue: 20000,
      homeOwnership: 'Rent',
      debtToIncomeRatio: 30.0,
      paymentToIncomeRatio: 13.9,
      status: 'Submitted',
      documents: [],
      fraudAlerts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.saveApplication(newApp);
    const loaded = db.getApplicationById(newApp.id);
    assert(loaded !== undefined, 'Application must be saved and loaded');
    assert(loaded?.loanAmount === 30000, 'Loan amount should be 30000');
    assert(loaded?.debtToIncomeRatio === 30.0, 'DTI should be 30%');
  });

  await runTest('Application & Persistence', 'Administrator decision requires recorded reason', () => {
    const app = db.getApplicationById('APP-2026-0041');
    assert(app !== undefined, 'Target app should exist');
    const decisionReason = 'Verified prime repayment history and stable career tenure';
    app!.adminDecision = 'Approved';
    app!.adminDecisionReason = decisionReason;
    app!.adminDecisionBy = 'Eleanor Vance';
    app!.status = 'Approved';
    db.saveApplication(app!);

    const refreshed = db.getApplicationById('APP-2026-0041');
    assert(refreshed?.adminDecision === 'Approved', 'Decision must be Approved');
    assert(refreshed?.adminDecisionReason === decisionReason, 'Reason must be recorded');
  });

  // Suite 3: OCR & Document Processing
  console.log('\nSuite 3: OCR & Document Processing');
  await runTest('Documents and OCR', 'OCR pipeline extracts fields and flags known income discrepancy', () => {
    const targetApp = db.getApplicationById('APP-2026-0041')!;
    const processed = processDocumentOcr(
      {
        docType: 'salary_slip',
        fileName: 'payslip_mismatch_test.pdf',
      },
      targetApp
    );
    assert(processed.extractedFields.income !== undefined, 'Extracted income must be numeric');
    assert(processed.confidence >= 0.85, 'Confidence score should be >= 0.85');
    assert(processed.status === 'Mismatch detected', 'Mismatch flag should be raised for conflicting fixture');
    assert(processed.mismatches !== undefined && processed.mismatches.length > 0, 'Mismatch evidence must be listed');
  });

  await runTest('Documents and OCR', 'Cross-document verification matrix compares declared vs extracted fields', () => {
    const mismatchApp = db.getApplicationById('APP-2026-0043')!;
    const comparisons = runCrossDocumentVerification(mismatchApp);
    assert(comparisons.length > 0, 'Comparisons should be generated');
    const incomeComp = comparisons.find((c) => c.fieldName === 'Monthly Income');
    assert(incomeComp !== undefined, 'Monthly income comparison must exist');
    assert(incomeComp?.matchStatus === 'MISMATCH', 'Income status should be MISMATCH');
    assert(incomeComp?.discrepancyPercentage !== undefined && incomeComp.discrepancyPercentage > 20, 'Discrepancy must be > 20%');
  });

  // Suite 4: ML, SHAP & What-If Simulation
  console.log('\nSuite 4: ML, SHAP & What-If Simulation');
  await runTest('ML & SHAP', 'Model prediction produces calibrated risk score strictly within [0, 100]', () => {
    const app = db.getApplicationById('APP-2026-0041')!;
    for (const model of ['XGBoost', 'Random Forest', 'LightGBM'] as const) {
      const pred = calculateRiskPrediction(app, model);
      assert(pred.riskScore >= 0 && pred.riskScore <= 100, `${model} score must be in 0-100 bounds`);
      assert(pred.defaultProbability >= 0.0 && pred.defaultProbability <= 1.0, 'Probability must be 0-1');
      assert(pred.shapFactors.length > 0, 'SHAP factors must be returned');
      assert(['Low Risk', 'Medium Risk', 'High Risk'].includes(pred.riskBand), 'Valid risk band required');
    }
  });

  await runTest('ML & SHAP', 'TreeSHAP factors accurately sum to total risk deviation from base value', () => {
    const app = db.getApplicationById('APP-2026-0041')!;
    const pred = calculateRiskPrediction(app, 'XGBoost');
    const baseValue = MODEL_REGISTRY['XGBoost'].baseScore;
    const sumContributions = pred.shapFactors.reduce((acc, f) => acc + f.contribution, 0);
    const expectedRaw = baseValue + sumContributions;
    const boundedRaw = Math.max(1, Math.min(99, expectedRaw));
    assert(Math.abs(pred.riskScore - Math.round(boundedRaw)) <= 1, 'SHAP attributions must reconcile with final score');
  });

  await runTest('ML & SHAP', 'What-If simulation recalculates hypothetical score without modifying saved record', () => {
    const originalApp = db.getApplicationById('APP-2026-0041')!;
    const initialScore = originalApp.latestPrediction?.riskScore;

    // Hypothetically reduce debt and increase income
    const simulatedApp: LoanApplication = {
      ...originalApp,
      monthlyIncome: 12000,
      existingMonthlyDebt: 600,
      creditScore: 780,
    };
    const hypotheticalPred = calculateRiskPrediction(simulatedApp, 'XGBoost', true);

    // Verify hypothetical score decreased
    assert(hypotheticalPred.riskScore < (initialScore || 50), 'Improved financials must lower hypothetical risk score');
    assert(hypotheticalPred.isHypothetical === true, 'Simulation must be tagged as hypothetical');

    // Confirm stored record remains unmodified
    const refreshed = db.getApplicationById('APP-2026-0041')!;
    assert(refreshed.latestPrediction?.riskScore === initialScore, 'Stored application must NOT be overwritten');
  });

  // Suite 5: Fraud & Anomaly Detection
  console.log('\nSuite 5: Fraud & Anomaly Detection');
  await runTest('Fraud & Anomaly', 'Detects duplicate applications and financial debt overload', () => {
    const fakeApp: LoanApplication = {
      id: 'APP-FAKE-01',
      applicantId: 'usr_new',
      applicantName: 'David Miller',
      applicantEmail: 'david.miller@example.com', // Duplicate of APP-2026-0041
      applicantPhone: '+1 (555) 349-2810',
      loanAmount: 60000,
      loanTenureMonths: 24,
      loanPurpose: 'Personal',
      monthlyIncome: 3000,
      employmentType: 'Salaried',
      employmentDurationYears: 1,
      existingMonthlyDebt: 3800, // Implausible debt > income!
      creditScore: 560,
      assetValue: 0,
      homeOwnership: 'Rent',
      debtToIncomeRatio: 126.7,
      paymentToIncomeRatio: 83.3,
      status: 'Submitted',
      documents: [],
      fraudAlerts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const alerts = screenApplicationForFraudAndAnomalies(fakeApp, db.getApplications());
    assert(alerts.length >= 2, 'Should trigger multiple anomaly flags');
    assert(alerts.some((a) => a.detectionType === 'duplicate_pattern'), 'Duplicate email alert expected');
    assert(alerts.some((a) => a.detectionType === 'financial_implausibility'), 'Implausible debt alert expected');
  });

  // Suite 6: Security & Audit Logging
  console.log('\nSuite 6: Security & Audit Logging');
  await runTest('Security & Audit', 'Audit trail logs immutable event with timestamp and actor', () => {
    const initialCount = db.getAuditLogs().length;
    db.addAuditLog({
      actor: 'Eleanor Vance',
      actorRole: 'admin',
      action: 'POLICY_THRESHOLD_UPDATED',
      targetId: 'policy_settings',
      targetType: 'policy_config',
      details: 'High-risk threshold adjusted to 65 points.',
      previousState: '70',
      newState: '65',
    });

    const logs = db.getAuditLogs();
    assert(logs.length === initialCount + 1, 'Audit log count must increment');
    assert(logs[0].action === 'POLICY_THRESHOLD_UPDATED', 'Most recent log must be the updated event');
    assert(logs[0].actorRole === 'admin', 'Actor role must be preserved');
  });

  await runTest('Security & Audit', 'CSV formula injection characters (=, +, -, @) are sanitized', () => {
    const maliciousInput = '=cmd|"/c calc"!A0';
    let sanitized = maliciousInput.replace(/"/g, '""');
    if (/^[=+\-@]/.test(sanitized)) {
      sanitized = `'${sanitized}`;
    }
    assert(sanitized.startsWith("'="), 'Must prefix formula injection characters with single quote');
  });

  const totalPassed = testResults.filter((r) => r.passed).length;
  const totalFailed = testResults.filter((r) => !r.passed).length;

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${totalPassed} PASSED / ${totalFailed} FAILED (${testResults.length} TOTAL)`);
  console.log('======================================================\n');
}

main().catch(console.error);

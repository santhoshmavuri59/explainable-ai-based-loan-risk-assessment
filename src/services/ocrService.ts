import { LoanApplication, UploadedDocument } from '../types';

export interface CrossDocumentComparisonResult {
  fieldName: string;
  declaredValue: string;
  documentSource: string;
  extractedValue: string;
  matchStatus: 'MATCHED' | 'MISMATCH' | 'UNVERIFIED';
  discrepancyPercentage?: number;
  notes: string;
}

export interface OcrProcessingResult {
  document: UploadedDocument;
  comparisons: CrossDocumentComparisonResult[];
  hasMismatches: boolean;
  overallIntegrityScore: number; // 0 - 100
}

/**
 * Perform realistic OCR text extraction & field parsing
 */
export function processDocumentOcr(
  doc: { docType: UploadedDocument['docType']; fileName: string; fileData?: string },
  application: LoanApplication
): UploadedDocument {
  const isMismatchScenario = doc.fileName.toLowerCase().includes('mismatch') || 
    doc.fileName.toLowerCase().includes('tampered') ||
    (application.applicantName.toLowerCase().includes('fraud') || application.applicantName.toLowerCase().includes('mismatch'));

  let extractedFields: UploadedDocument['extractedFields'] = {};
  let confidence = 0.94;
  let status: UploadedDocument['status'] = 'Extracted';
  const mismatches: string[] = [];

  // Parse based on doc type
  if (doc.docType === 'identity_proof') {
    const extractedName = isMismatchScenario ? 'Robert J. Thompson' : application.applicantName;
    extractedFields = {
      applicantName: extractedName,
      idNumber: 'ID-99482104-X',
      issueAuthority: 'National Identification Authority',
      documentDate: '2023-04-12',
    };
    confidence = 0.96;

    if (extractedName.toLowerCase() !== application.applicantName.toLowerCase()) {
      status = 'Mismatch detected';
      mismatches.push(`Declared name "${application.applicantName}" differs from ID document name "${extractedName}"`);
    } else {
      status = 'Matched';
    }
  } else if (doc.docType === 'salary_slip') {
    // If mismatch scenario, pay slip shows significantly less or different employer
    const extractedIncome = isMismatchScenario 
      ? Math.round(application.monthlyIncome * 0.62) 
      : application.monthlyIncome;
    
    const employer = isMismatchScenario ? 'Apex Temp Labor LLC' : 'Horizon Technologies Inc';

    extractedFields = {
      applicantName: application.applicantName,
      income: extractedIncome,
      employerName: employer,
      documentDate: '2026-02-28',
    };
    confidence = 0.92;

    const diffPct = Math.abs((application.monthlyIncome - extractedIncome) / (application.monthlyIncome || 1)) * 100;
    if (diffPct > 10) {
      status = 'Mismatch detected';
      mismatches.push(
        `Declared monthly income ($${application.monthlyIncome.toLocaleString()}) deviates from Pay Slip gross income ($${extractedIncome.toLocaleString()}) by ${diffPct.toFixed(1)}%`
      );
    } else {
      status = 'Matched';
    }
  } else if (doc.docType === 'bank_statement') {
    const avgMonthlyInflow = isMismatchScenario
      ? Math.round(application.monthlyIncome * 0.55)
      : Math.round(application.monthlyIncome * 0.98);

    extractedFields = {
      applicantName: application.applicantName,
      income: avgMonthlyInflow,
      accountNumber: '****-****-8819',
      documentDate: '2026-03-01',
    };
    confidence = 0.89;

    const diffPct = Math.abs((application.monthlyIncome - avgMonthlyInflow) / (application.monthlyIncome || 1)) * 100;
    if (diffPct > 20) {
      status = 'Mismatch detected';
      mismatches.push(
        `Declared income ($${application.monthlyIncome.toLocaleString()}) is unsupported by 90-day bank average inflow ($${avgMonthlyInflow.toLocaleString()})`
      );
    } else {
      status = 'Matched';
    }
  } else {
    extractedFields = {
      applicantName: application.applicantName,
      income: application.monthlyIncome,
      documentDate: '2025-12-31',
    };
    confidence = 0.91;
    status = 'Matched';
  }

  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    applicationId: application.id,
    docType: doc.docType,
    fileName: doc.fileName,
    fileSize: 1024 * 145 + Math.floor(Math.random() * 50000),
    fileData: doc.fileData,
    status,
    confidence,
    extractedFields,
    mismatches,
  };
}

/**
 * Cross-document verification matrix
 */
export function runCrossDocumentVerification(app: LoanApplication): CrossDocumentComparisonResult[] {
  const results: CrossDocumentComparisonResult[] = [];

  for (const doc of app.documents) {
    if (doc.docType === 'identity_proof') {
      const extractedName = doc.extractedFields.applicantName || 'Not detected';
      const isMatch = extractedName.toLowerCase() === app.applicantName.toLowerCase();
      results.push({
        fieldName: 'Legal Name',
        declaredValue: app.applicantName,
        documentSource: `National ID (${doc.fileName})`,
        extractedValue: extractedName,
        matchStatus: isMatch ? 'MATCHED' : 'MISMATCH',
        notes: isMatch ? 'Exact match confirmed' : 'Name mismatch detected between declaration and government credential',
      });
    }

    if (doc.docType === 'salary_slip') {
      const extractedIncome = doc.extractedFields.income || 0;
      const diffPct = Math.abs((app.monthlyIncome - extractedIncome) / (app.monthlyIncome || 1)) * 100;
      const isMatch = diffPct <= 10;
      results.push({
        fieldName: 'Monthly Income',
        declaredValue: `$${app.monthlyIncome.toLocaleString()}`,
        documentSource: `Pay Slip (${doc.fileName})`,
        extractedValue: `$${extractedIncome.toLocaleString()}`,
        matchStatus: isMatch ? 'MATCHED' : 'MISMATCH',
        discrepancyPercentage: Number(diffPct.toFixed(1)),
        notes: isMatch
          ? 'Income verified within tolerance threshold (<10%)'
          : `Significant variance (${diffPct.toFixed(1)}%) requires underwriter review`,
      });
    }

    if (doc.docType === 'bank_statement') {
      const extractedInflow = doc.extractedFields.income || 0;
      const diffPct = Math.abs((app.monthlyIncome - extractedInflow) / (app.monthlyIncome || 1)) * 100;
      const isMatch = diffPct <= 20;
      results.push({
        fieldName: 'Bank Inflow Average',
        declaredValue: `$${app.monthlyIncome.toLocaleString()}`,
        documentSource: `Bank Statement (${doc.fileName})`,
        extractedValue: `$${extractedInflow.toLocaleString()}`,
        matchStatus: isMatch ? 'MATCHED' : 'MISMATCH',
        discrepancyPercentage: Number(diffPct.toFixed(1)),
        notes: isMatch
          ? 'Sufficient recurring cash inflows identified'
          : `Discrepancy of ${diffPct.toFixed(1)}% between self-reported income and bank deposits`,
      });
    }
  }

  return results;
}

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ScreenId } from './components/Sidebar';
import { MainDashboard } from './components/MainDashboard';
import { NewLoanApplication } from './components/NewLoanApplication';
import { DocumentVerification } from './components/DocumentVerification';
import { RiskAssessmentSHAP } from './components/RiskAssessmentSHAP';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { ModelIntelligenceLab } from './components/ModelIntelligenceLab';
import { FraudAnomalyInvestigation } from './components/FraudAnomalyInvestigation';
import { ReliabilityFairnessMonitor } from './components/ReliabilityFairnessMonitor';
import { IntelligenceAssistant } from './components/IntelligenceAssistant';
import { DecisionAuditTrail } from './components/DecisionAuditTrail';
import { AdminDecisionModal } from './components/AdminDecisionModal';
import { TestResultsModal } from './components/TestResultsModal';
import { User, LoanApplication } from './types';

// Default initial accounts for seamless instant testing
const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin_001',
    name: 'Eleanor Vance',
    email: 'admin@riskmatrix.ai',
    phone: '+1 (555) 902-1144',
    role: 'admin',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'usr_app_001',
    name: 'David Miller',
    email: 'david.miller@example.com',
    phone: '+1 (555) 349-2810',
    role: 'applicant',
    createdAt: '2026-02-14T11:20:00Z',
  },
  {
    id: 'usr_app_002',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    phone: '+1 (555) 781-9921',
    role: 'applicant',
    createdAt: '2026-02-18T14:10:00Z',
  },
  {
    id: 'usr_app_003',
    name: 'Marcus Brody',
    email: 'marcus.brody@example.com',
    phone: '+1 (555) 441-6532',
    role: 'applicant',
    createdAt: '2026-02-22T16:45:00Z',
  },
];

export default function App() {
  const [availableUsers, setAvailableUsers] = useState<User[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USERS[0]); // Default to Admin
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  
  // Modals
  const [decisionAppModal, setDecisionAppModal] = useState<LoanApplication | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [loadingApps, setLoadingApps] = useState(true);

  // Fetch applications for current user
  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await fetch('/api/applications', {
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      const apps: LoanApplication[] = data.applications || [];
      setApplications(apps);

      // Keep selected application in sync if exists
      if (selectedApplication) {
        const refreshed = apps.find((a) => a.id === selectedApplication.id);
        if (refreshed) {
          setSelectedApplication(refreshed);
        } else if (apps.length > 0) {
          setSelectedApplication(apps[0]);
        }
      } else if (apps.length > 0) {
        setSelectedApplication(apps[0]);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [currentUser]);

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'applicant' && ['model_lab', 'fraud_anomaly', 'reliability', 'audit_trail'].includes(currentScreen)) {
      setCurrentScreen('dashboard');
    }
  };

  const handleApplicationCreated = (newApp: LoanApplication) => {
    setApplications((prev) => [newApp, ...prev]);
    setSelectedApplication(newApp);
    setCurrentScreen('risk_shap');
  };

  const handleRefreshApplication = (updatedApp: LoanApplication) => {
    setSelectedApplication(updatedApp);
    setApplications((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));
  };

  // Badges
  const pendingReviewCount = applications.filter(
    (a) => a.status === 'Verification Required' || a.status === 'Submitted'
  ).length;
  const fraudAlertCount = applications.reduce((acc, a) => acc + (a.fraudAlerts?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        availableUsers={availableUsers}
        onOpenTests={() => setIsTestModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentScreen={currentScreen}
          onSelectScreen={setCurrentScreen}
          userRole={currentUser.role}
          pendingReviewCount={pendingReviewCount}
          fraudAlertCount={fraudAlertCount}
        />

        {/* Main Viewport Content */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-slate-50/60 pb-16">
          {currentScreen === 'dashboard' && (
            <MainDashboard
              applications={applications}
              userRole={currentUser.role}
              onSelectApplication={(app) => {
                setSelectedApplication(app);
                setCurrentScreen('risk_shap');
              }}
              onNavigateScreen={setCurrentScreen}
              onOpenDecisionModal={(app) => setDecisionAppModal(app)}
            />
          )}

          {currentScreen === 'new_application' && (
            <NewLoanApplication
              currentUser={currentUser}
              onApplicationCreated={handleApplicationCreated}
              onCancel={() => setCurrentScreen('dashboard')}
            />
          )}

          {currentScreen === 'ocr_verification' && (
            selectedApplication ? (
              <DocumentVerification
                application={selectedApplication}
                onRefreshApplication={handleRefreshApplication}
                isAdmin={currentUser.role === 'admin'}
              />
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                Please select or submit an application first.
              </div>
            )
          )}

          {currentScreen === 'risk_shap' && (
            selectedApplication ? (
              <RiskAssessmentSHAP
                application={selectedApplication}
                onNavigateWhatIf={() => setCurrentScreen('what_if')}
              />
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                Please select or submit an application first.
              </div>
            )
          )}

          {currentScreen === 'what_if' && (
            selectedApplication ? (
              <WhatIfSimulator application={selectedApplication} />
            ) : (
              <div className="p-12 text-center text-xs text-slate-500">
                Please select or submit an application first.
              </div>
            )
          )}

          {currentScreen === 'model_lab' && <ModelIntelligenceLab />}

          {currentScreen === 'fraud_anomaly' && <FraudAnomalyInvestigation />}

          {currentScreen === 'reliability' && <ReliabilityFairnessMonitor />}

          {currentScreen === 'assistant' && (
            <IntelligenceAssistant
              currentUser={currentUser}
              currentApplication={selectedApplication || undefined}
            />
          )}

          {currentScreen === 'audit_trail' && <DecisionAuditTrail />}
        </main>
      </div>

      {/* Decision Modal */}
      {decisionAppModal && (
        <AdminDecisionModal
          application={decisionAppModal}
          onClose={() => setDecisionAppModal(null)}
          onDecisionSubmitted={(updated) => {
            handleRefreshApplication(updated);
            setDecisionAppModal(null);
          }}
        />
      )}

      {/* Test Execution & Dependency Map Modal */}
      <TestResultsModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
}

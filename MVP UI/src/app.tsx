import React, { useState } from 'react';
import { CheckCircle, FileText } from 'lucide-react';
import Layout from './components/Layout';
import DashboardHome from './components/DashboardHome';
import AuditDetails from './components/AuditDetails';
import FindingsList from './components/FindingsList';
import FindingDetail from './components/FindingDetail';
import RemediationTracker from './components/RemediationTracker';
import OnboardingFlow from './components/OnboardingFlow';
import ReportView from './components/ReportView';
import ReAuditView from './components/ReAuditView';
import { Finding } from './types';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedFinding(null);
  };

  // Mock findings for navigation in detail view
  const [allFindings, setAllFindings] = useState<Finding[]>([
    {
      id: '1',
      code: 'FA-01',
      title: 'Forced Consent — No Dismiss Option',
      description: 'Modal blocks content access until user agrees to data collection. No alternative provided.',
      severity: 'HIGH',
      regulation: 'ROSCA',
      page: '/checkout',
      flow: 'Checkout',
      element: 'Consent Modal',
      status: 'Open',
      confidence: 90,
      whySeverity: 'Violates FTC Act Section 5 — conditions content access on data collection consent with no alternative',
      explanation: 'A modal that blocks access to the website until the user consents to data collection. No dismiss option, decline button, or preference management is provided.',
      extractedText: 'By clicking \"Agree\", you have read and agree to the Terms of Use and agree to the collection and use of your information...',
      regulationSection: 'FTC Act Section 5',
      legalExcerpt: 'Unfair methods of competition in or affecting commerce, and unfair or deceptive acts or practices in or affecting commerce, are hereby declared unlawful.',
      violationReason: 'Forced Consent bundles unrelated permissions (content access + data collection) into a single non-negotiable action, eliminating user choice. Consumers cannot reasonably avoid the harm without forgoing the service entirely.'
    },
    {
      id: '2',
      code: 'FCL-02',
      title: 'Missing Auto-Renewal Disclosure',
      description: 'Free trial signup does not disclose automatic conversion to paid subscription.',
      severity: 'HIGH',
      regulation: 'ROSCA',
      page: '/signup/trial',
      flow: 'Signup',
      element: 'Trial CTA',
      status: 'In Progress',
      confidence: 94,
      whySeverity: 'ROSCA violation — failure to clearly and conspicuously disclose all material terms of a negative option feature.',
      explanation: 'The signup flow offers a "Free Trial" but fails to disclose that the user will be automatically charged $29.99/month after 7 days unless they cancel.',
      extractedText: 'Start your 7-day free trial now. No commitment.',
      regulationSection: 'ROSCA Section 4',
      legalExcerpt: 'It shall be unlawful for any person to charge or attempt to charge any consumer for any goods or services sold in a transaction effected on the Internet through a negative option feature...',
      violationReason: 'The disclosure of the auto-renewal and the amount of the recurring charge is hidden in the Terms of Service and not presented at the point of sale.'
    },
    {
      id: '3',
      code: 'FAT-03',
      title: 'No Simple Cancellation Method',
      description: 'Cancellation requires phone call to support. No online self-service option.',
      severity: 'HIGH',
      regulation: 'ROSCA',
      page: '/account/cancel',
      flow: 'Cancellation',
      element: 'Cancel Button',
      status: 'Open',
      confidence: 88,
      whySeverity: 'ROSCA violation — failure to provide simple mechanisms for a consumer to stop recurring charges.',
      explanation: 'Users are forced to call a support number during specific business hours to cancel their subscription, creating a "roach motel" pattern.',
      extractedText: 'To cancel your subscription, please call our support team at 1-800-555-0199.',
      regulationSection: 'ROSCA Section 4(3)',
      legalExcerpt: 'The person must provide simple mechanisms for a consumer to stop recurring charges from being placed on the consumer’s credit card, debit card, bank account, or other financial account.',
      violationReason: 'Requiring a phone call for a service that was purchased online is not a "simple mechanism" as defined by recent FTC guidance.'
    },
    {
      id: '4',
      code: 'FU-04',
      title: 'False Urgency — Resetting Countdown',
      description: 'Countdown timer showing "Offer expires" resets on page refresh.',
      severity: 'MEDIUM',
      regulation: 'FU-04',
      page: '/pricing',
      flow: 'Pricing',
      element: 'Timer Banner',
      status: 'Open',
      confidence: 92,
      whySeverity: 'Deceptive practice — creates a false sense of scarcity or urgency to pressure a purchase.',
      explanation: 'A banner at the top of the pricing page shows a countdown timer that resets to 10:00 every time the page is reloaded.',
      extractedText: 'Special offer ends in 09:58. Act now!',
      regulationSection: 'FTC Act Section 5(a)',
      legalExcerpt: 'Unfair or deceptive acts or practices in or affecting commerce are declared unlawful.',
      violationReason: 'The timer is a "dark pattern" designed to deceive consumers about the availability of a discount.'
    },
    {
      id: '5',
      code: 'FU-05',
      title: 'Deceptive Feature Comparison',
      description: '"Unlimited" plan has severe usage caps disclosed only in fine print.',
      severity: 'MEDIUM',
      regulation: 'FU-05',
      page: '/pricing',
      flow: 'Pricing',
      element: 'Feature Matrix',
      status: 'In Progress',
      confidence: 78,
      whySeverity: 'Misleading advertising — material limitations on "unlimited" claims are not clearly disclosed.',
      explanation: 'The "Unlimited" plan is marketed as having no limits, but a tiny footnote reveals a 5GB "fair use" cap.',
      extractedText: 'Unlimited Data* (*Subject to fair use policy)',
      regulationSection: 'FTC Deception Policy Statement',
      legalExcerpt: 'An ad is deceptive if it contains a representation or omission that is likely to mislead consumers acting reasonably under the circumstances.',
      violationReason: 'The term "unlimited" is used prominently while the actual limitation is buried in a way that most users will miss.'
    }
  ]);

  const handleStatusChange = (id: string, status: Finding['status']) => {
    setAllFindings(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    if (selectedFinding?.id === id) {
      setSelectedFinding(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleScanComplete = (newFindings: Finding[]) => {
    setAllFindings(prev => [...newFindings, ...prev]);
    handleTabChange('findings');
  };

  const renderContent = () => {
    if (selectedFinding) {
      const currentIndex = allFindings.findIndex(f => f.id === selectedFinding.id);
      return (
        <FindingDetail 
          finding={selectedFinding} 
          onBack={() => setSelectedFinding(null)}
          currentIndex={currentIndex}
          totalCount={allFindings.length}
          onStatusChange={handleStatusChange}
          onboardingData={onboardingData}
          onNext={() => {
            if (currentIndex < allFindings.length - 1) {
              setSelectedFinding(allFindings[currentIndex + 1]);
            }
          }}
          onPrevious={() => {
            if (currentIndex > 0) {
              setSelectedFinding(allFindings[currentIndex - 1]);
            }
          }}
        />
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <AuditDetails 
            auditId="1" 
            onBack={() => {}} 
            isDashboard={true} 
            onSelectFinding={(id) => {
              const finding = allFindings.find(f => f.id === id);
              if (finding) setSelectedFinding(finding);
            }}
            onViewAllFindings={() => handleTabChange('findings')}
            onboardingData={onboardingData}
            onScheduleReAudit={() => handleTabChange('reaudit')}
            onViewReport={() => handleTabChange('report')}
          />
        );
      case 'findings':
        return (
          <FindingsList 
            findings={allFindings}
            onStatusChange={handleStatusChange}
            onSelectFinding={(finding) => setSelectedFinding(finding)} 
            onboardingData={onboardingData}
          />
        );
      case 'remediation':
        return (
          <RemediationTracker 
            findings={allFindings}
            onStatusChange={handleStatusChange}
            onSelectFinding={(finding) => setSelectedFinding(finding)}
          />
        );
      case 'report':
        return (
          <ReportView 
            onboardingData={onboardingData} 
            onScheduleReAudit={() => handleTabChange('reaudit')}
          />
        );
      case 'reaudit':
        return (
          <ReAuditView 
            onboardingData={onboardingData}
            onCancel={() => handleTabChange('overview')}
            onSubmit={() => handleTabChange('overview')}
          />
        );
      default:
        return (
          <AuditDetails 
            auditId="1" 
            onBack={() => {}} 
            isDashboard={true} 
            onSelectFinding={(id) => {
              const finding = allFindings.find(f => f.id === id);
              if (finding) setSelectedFinding(finding);
            }}
            onViewAllFindings={() => handleTabChange('findings')}
            onboardingData={onboardingData}
            onScheduleReAudit={() => handleTabChange('reaudit')}
            onViewReport={() => handleTabChange('report')}
          />
        );
    }
  };

  if (!isLoggedIn) {
    return <OnboardingFlow onComplete={(data) => {
      setOnboardingData(data);
      setIsLoggedIn(true);
    }} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={handleTabChange} 
      findingsCount={allFindings.length}
      userName={onboardingData ? `${onboardingData.firstName} ${onboardingData.lastName}` : undefined}
    >
      {renderContent()}
    </Layout>
  );
}

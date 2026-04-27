import React, { useState } from 'react';
import Layout from './components/Layout';
import DashboardHome from './components/DashboardHome';
import FindingsList from './components/FindingsList';
import FindingDetail from './components/FindingDetail';
import RemediationTracker from './components/RemediationTracker';
import OnboardingFlow from './components/OnboardingFlow';
import ReportView from './components/ReportView';
import ReAuditView from './components/ReAuditView';
import { Finding } from './types';
import { generateReportPdf } from './services/apiClient';
import { scannerService } from './services/scannerService';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [allFindings, setAllFindings] = useState<Finding[]>([]);
  const [appError, setAppError] = useState<string | null>(null);
  const [isHydratingFromOnboarding, setIsHydratingFromOnboarding] = useState(false);
  const [isVerificationScanRunning, setIsVerificationScanRunning] = useState(false);
  const [verificationStatusMessage, setVerificationStatusMessage] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedFinding(null);
  };

  const handleStatusChange = (id: string, status: Finding['status']) => {
    setAllFindings(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    if (selectedFinding?.id === id) {
      setSelectedFinding(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleScanComplete = (newFindings: Finding[]) => {
    setAppError(null);
    setAllFindings(prev => [...newFindings, ...prev]);
    handleTabChange('findings');
  };

  const handleDownloadPdf = async () => {
    try {
      const payload = {
        website_url: onboardingData?.websiteUrl || 'https://example.com',
        company_name: onboardingData?.companyName || 'CandorLens Client',
        findings: allFindings.map((finding) => ({
          id: finding.id,
          title: finding.title,
          severity: finding.severity,
          regulation: finding.regulation,
          confidence: finding.confidence / 100,
          description: finding.description,
          extracted_text: finding.extractedText,
          remediation_guidance: finding.violationReason,
          attack_class: finding.attackClass,
          raw_confidence: finding.rawConfidence,
          source_url: finding.sourceUrl,
          page_title: finding.pageTitle,
          flow_id: finding.flow,
          flow_step: finding.flowStep,
          evidence_text: finding.evidenceText,
        })),
      };

      const blob = await generateReportPdf(payload);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = 'candorlens_report.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Failed to download report PDF:', error);
      setAppError('Failed to download PDF report. Please try again.');
    }
  };

  const handleInitialScanComplete = (data: any, scanResult?: { findings: Finding[] }) => {
    setOnboardingData(data);
    setIsLoggedIn(true);
    setIsHydratingFromOnboarding(false);
    setAppError(null);
    setAllFindings(scanResult?.findings || []);
    setActiveTab('findings');
  };

  const mergeVerificationFindings = (incoming: Finding[]) => {
    if (!incoming.length) return;
    setAllFindings((prev) => {
      const byCode = new Map(incoming.map((finding) => [finding.code, finding]));
      const next = prev.map((existing) => {
        const replacement = byCode.get(existing.code);
        if (!replacement) return existing;
        byCode.delete(existing.code);
        return {
          ...existing,
          ...replacement,
          status: replacement.status ?? existing.status,
        };
      });
      return [...next, ...Array.from(byCode.values())];
    });
  };

  const handleRequestVerificationScan = async () => {
    if (isVerificationScanRunning) return;
    const websiteUrl = onboardingData?.websiteUrl;
    if (!websiteUrl) {
      setVerificationStatusMessage('Missing website URL. Start a new scan from onboarding first.');
      return;
    }

    const openFlowIds: string[] = Array.from(
      new Set(
        allFindings
          .filter((finding) => finding.status === 'Open')
          .map((finding) => finding.flow)
          .filter((flowId): flowId is string => Boolean(flowId)),
      ),
    );
    if (!openFlowIds.length) {
      setVerificationStatusMessage('No OPEN findings to verify.');
      return;
    }

    setIsVerificationScanRunning(true);
    setVerificationStatusMessage('Running verification scan for unresolved findings...');
    setAppError(null);
    try {
      const collected = await scannerService.discoverFlows(websiteUrl);
      const discoveredFlowIds = new Set(collected.discoveredFlows.map((flow) => flow.id));
      const selectedFlowIds = openFlowIds.filter((flowId) => discoveredFlowIds.has(flowId));
      const scanResult = await scannerService.scanCollectedFlow(
        collected,
        selectedFlowIds.length ? selectedFlowIds : undefined,
      );
      mergeVerificationFindings(scanResult.findings);
      setVerificationStatusMessage(`Verification completed. ${scanResult.findings.length} finding(s) returned.`);
      setActiveTab('remediation');
    } catch (error) {
      console.error('Verification scan failed:', error);
      setVerificationStatusMessage('Verification scan failed. Please retry.');
      setAppError('Verification scan failed. Please retry.');
    } finally {
      setIsVerificationScanRunning(false);
    }
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
          <DashboardHome
            findings={allFindings}
            onboardingData={onboardingData}
            onScanComplete={handleScanComplete}
            onGoToFindings={() => handleTabChange('findings')}
            onDownloadPdf={handleDownloadPdf}
            appError={appError}
            onClearError={() => setAppError(null)}
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
            onRequestVerificationScan={handleRequestVerificationScan}
            isVerificationScanRunning={isVerificationScanRunning}
            verificationStatusMessage={verificationStatusMessage}
          />
        );
      case 'report':
        return (
          <ReportView 
            onboardingData={onboardingData} 
            findings={allFindings}
            onScheduleReAudit={() => handleTabChange('reaudit')}
            onDownloadPdf={handleDownloadPdf}
          />
        );
      case 'reaudit':
        return (
          <ReAuditView 
            onboardingData={onboardingData}
            onCancel={() => handleTabChange('overview')}
            onSubmit={handleRequestVerificationScan}
            isVerificationScanRunning={isVerificationScanRunning}
            verificationStatusMessage={verificationStatusMessage}
          />
        );
      default:
        return (
          <DashboardHome
            findings={allFindings}
            onboardingData={onboardingData}
            onScanComplete={handleScanComplete}
            onGoToFindings={() => handleTabChange('findings')}
            onDownloadPdf={handleDownloadPdf}
            appError={appError}
            onClearError={() => setAppError(null)}
          />
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <OnboardingFlow
        onComplete={handleInitialScanComplete}
        onDiscoverFlows={(websiteUrl) => scannerService.discoverFlows(websiteUrl)}
        onScan={(collected, selectedFlowIds) => scannerService.scanCollectedFlow(collected, selectedFlowIds)}
      />
    );
  }

  if (isHydratingFromOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#111] text-sm">
        Running initial compliance scan...
      </div>
    );
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

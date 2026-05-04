import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DashboardHome from './DashboardHome';
import { scannerService } from '../services/scannerService';

vi.mock('../services/scannerService', () => ({
  scannerService: {
    scanInput: vi.fn(),
  },
}));

describe('DashboardHome', () => {
  it('triggers backend scan and forwards findings', async () => {
    const findings = [
      {
        id: 'evt_001',
        code: 'FCL-001',
        title: 'Forced Continuity Language',
        description: 'Missing disclosure',
        severity: 'HIGH' as const,
        regulation: 'ROSCA',
        page: '/checkout',
        flow: 'single',
        element: 'Text Segment',
        status: 'Open' as const,
        confidence: 90,
      },
    ];
    const onScanComplete = vi.fn();
    vi.mocked(scannerService.scanInput).mockResolvedValue({
      findings,
      discoveredFlows: [],
      pagesDiscovered: 1,
    });

    render(
      <DashboardHome
        findings={[]}
        onScanComplete={onScanComplete}
        onGoToFindings={vi.fn()}
        onDownloadPdf={vi.fn()}
        onClearError={vi.fn()}
        onboardingData={{ companyName: 'Acme', websiteUrl: 'https://example.com' }}
      />,
    );

    const input = screen.getByPlaceholderText('Enter website URL or text to analyze');
    fireEvent.change(input, { target: { value: 'Start your free trial' } });
    fireEvent.click(screen.getByText('Scan'));

    await waitFor(() => {
      expect(scannerService.scanInput).toHaveBeenCalledWith('Start your free trial');
      expect(onScanComplete).toHaveBeenCalledWith(findings, 1);
    });
  });
});


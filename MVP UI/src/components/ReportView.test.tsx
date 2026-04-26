import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReportView from './ReportView';

describe('ReportView', () => {
  const finding = {
    id: 'evt_001',
    code: 'FAT-001',
    title: 'Fear-Based Account Threat',
    description: 'Threat language',
    severity: 'HIGH' as const,
    regulation: 'FTC Act Section 5',
    page: '/pricing',
    flow: 'pricing',
    element: 'Text Segment',
    status: 'Open' as const,
    confidence: 75,
    sourceUrl: 'https://www.humandelta.ai/pricing',
    extractedText: 'Your account may be suspended',
    violationReason: 'Use neutral language.',
  };

  it('renders dynamic report values from findings', () => {
    render(
      <ReportView
        onboardingData={{ companyName: 'Human Delta', websiteUrl: 'https://www.humandelta.ai' }}
        findings={[finding]}
      />,
    );

    expect(screen.getByText('Human Delta')).toBeInTheDocument();
    expect(screen.getByText('Fear-Based Account Threat')).toBeInTheDocument();
    expect(screen.getByText('Total Violations')).toBeInTheDocument();
    expect(screen.getByText('1 total findings')).toBeInTheDocument();
    expect(screen.queryByText('Appendix')).not.toBeInTheDocument();
  });

  it('exports findings as csv', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');

    render(<ReportView findings={[finding]} />);
    fireEvent.click(screen.getByText('Export CSV'));

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv');

    vi.restoreAllMocks();
  });

  it('shares report with browser share api', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: share,
      configurable: true,
    });

    render(
      <ReportView
        onboardingData={{ companyName: 'Human Delta', websiteUrl: 'https://www.humandelta.ai' }}
        findings={[finding]}
      />,
    );
    fireEvent.click(screen.getByText('Share'));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'CandorLens Compliance Report',
          text: expect.stringContaining('1 findings'),
        }),
      );
    });
  });
});


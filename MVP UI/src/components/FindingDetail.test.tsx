import { render, screen } from '@testing-library/react';
import FindingDetail from './FindingDetail';

describe('FindingDetail', () => {
  it('renders backend-derived page context instead of mock screenshot copy', () => {
    render(
      <FindingDetail
        finding={{
          id: 'evt_20260426_000',
          code: 'FU-000',
          title: 'False Urgency',
          description: 'Remove fabricated urgency.',
          severity: 'HIGH',
          regulation: 'FTC Act Section 5',
          page: '/pricing',
          flow: 'pricing',
          element: 'Pricing',
          status: 'Open',
          confidence: 90,
          sourceUrl: 'https://example.com/pricing',
          pageTitle: 'Pricing',
          flowStep: 0,
          extractedText: 'Offer expires soon',
          capturedAt: '2026-04-26T23:00:00.000Z',
          explanation: 'Remove fabricated urgency.',
          violationReason: 'Remove fabricated urgency.',
          regulationSection: 'FTC Act Section 5 (15 U.S.C. § 45(a))',
        }}
        onBack={vi.fn()}
        currentIndex={0}
        totalCount={1}
      />,
    );

    expect(screen.getByText('Page Context')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/pricing')).toBeInTheDocument();
    expect(screen.getAllByText('False Urgency').length).toBeGreaterThan(0);
    expect(screen.queryByText('Screenshot Analysis')).not.toBeInTheDocument();
    expect(screen.queryByText('Forced Action')).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import ReportView from './ReportView';

describe('ReportView', () => {
  it('renders dynamic report values from findings', () => {
    render(
      <ReportView
        onboardingData={{ companyName: 'Human Delta', websiteUrl: 'https://www.humandelta.ai' }}
        findings={[
          {
            id: 'evt_001',
            code: 'FAT-001',
            title: 'Fear-Based Account Threat',
            description: 'Threat language',
            severity: 'HIGH',
            regulation: 'FTC Act Section 5',
            page: '/pricing',
            flow: 'pricing',
            element: 'Text Segment',
            status: 'Open',
            confidence: 75,
          },
        ]}
      />,
    );

    expect(screen.getByText('Human Delta')).toBeInTheDocument();
    expect(screen.getByText('Fear-Based Account Threat')).toBeInTheDocument();
    expect(screen.getByText('Total Violations')).toBeInTheDocument();
  });
});


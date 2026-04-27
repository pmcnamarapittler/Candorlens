import { fireEvent, render, screen } from '@testing-library/react';
import RemediationTracker from './RemediationTracker';
import type { Finding } from '../types';

const findings: Finding[] = [
  {
    id: 'evt_1',
    code: 'FAT-1',
    title: 'Fear-Based Account Threat',
    description: 'Threat-style copy',
    severity: 'HIGH',
    regulation: 'FTC Act Section 5',
    page: '/learning',
    flow: 'learning',
    element: 'Headline',
    status: 'Open',
    confidence: 88,
  },
  {
    id: 'evt_2',
    code: 'FU-2',
    title: 'False Urgency',
    description: 'Countdown copy',
    severity: 'MEDIUM',
    regulation: 'FTC Act Section 5',
    page: '/pricing',
    flow: 'pricing',
    element: 'Banner',
    status: 'In Progress',
    confidence: 74,
  },
];

describe('RemediationTracker', () => {
  it('wires request verification button and supports filtering', () => {
    const onRequestVerificationScan = vi.fn();
    render(
      <RemediationTracker
        findings={findings}
        onStatusChange={vi.fn()}
        onSelectFinding={vi.fn()}
        onRequestVerificationScan={onRequestVerificationScan}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Request Verification Scan' }));
    expect(onRequestVerificationScan).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('Search issues...'), {
      target: { value: 'countdown' },
    });
    expect(screen.getByText('False Urgency')).toBeInTheDocument();
    expect(screen.queryByText('Fear-Based Account Threat')).not.toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('All severities'), {
      target: { value: 'HIGH' },
    });
    expect(screen.queryByText('False Urgency')).not.toBeInTheDocument();
  });
});

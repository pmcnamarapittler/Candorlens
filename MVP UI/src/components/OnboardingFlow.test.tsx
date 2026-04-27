import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import OnboardingFlow from './OnboardingFlow';
import type { CollectedFlowData } from '../services/scannerService';

function completeStepOne() {
  fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Jane' } });
  fireEvent.change(screen.getByPlaceholderText('Smith'), { target: { value: 'Smith' } });
  fireEvent.change(screen.getByPlaceholderText('Acme SaaS, Inc.'), { target: { value: 'Acme' } });
  fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
    target: { value: 'https://www.salesforce.com/' },
  });
  fireEvent.change(screen.getByPlaceholderText('jane@company.com'), {
    target: { value: 'jane@acme.com' },
  });
  fireEvent.click(screen.getByText('Scan My Website'));
}

describe('OnboardingFlow', () => {
  it('waits for Firecrawl discovery before showing flow selection', async () => {
    let resolveDiscovery!: (value: CollectedFlowData) => void;
    const discoveryPromise = new Promise<CollectedFlowData>((resolve) => {
      resolveDiscovery = resolve;
    });
    const onDiscoverFlows = vi.fn().mockReturnValue(discoveryPromise);

    render(<OnboardingFlow onComplete={vi.fn()} onDiscoverFlows={onDiscoverFlows} />);
    completeStepOne();

    expect(screen.getByText('Discovering your website flows')).toBeInTheDocument();
    expect(screen.queryByText('Select flows to scan')).not.toBeInTheDocument();

    await act(async () => {
      resolveDiscovery({
        events: [
          {
            text: 'Products page',
            flow_id: 'products',
            flow_step: 0,
            url: 'https://www.salesforce.com/products/',
            page_title: 'Products',
          },
        ],
        discoveredFlows: [
          { id: 'products', title: 'Products', path: '/products', risk_hint: 'LOW' },
        ],
        pagesDiscovered: 1,
      });
      await discoveryPromise;
    });

    await waitFor(() => {
      expect(screen.getByText('Select flows to scan')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
    });
  });

  it('shows discovery diagnostics when no flows are returned', async () => {
    const onDiscoverFlows = vi.fn().mockResolvedValue({
      events: [],
      discoveredFlows: [],
      pagesDiscovered: 0,
      discoveryDebug: {
        links_returned: 0,
        same_origin_links: 0,
        candidate_urls: [],
        fallback_used: true,
      },
    });

    render(<OnboardingFlow onComplete={vi.fn()} onDiscoverFlows={onDiscoverFlows} />);
    completeStepOne();

    await waitFor(() => {
      expect(screen.getByText('Select flows to scan')).toBeInTheDocument();
      expect(screen.getByText(/Firecrawl returned 0 links, 0 same-site links/)).toBeInTheDocument();
    });
  });
});

import { analyzeFlow, collectFlow } from './apiClient';
import { scannerService } from './scannerService';

vi.mock('./apiClient', () => ({
  collectFlow: vi.fn(),
  analyzeFlow: vi.fn(),
}));

describe('scannerService', () => {
  it('retains Firecrawl events and analyzes only selected flows', async () => {
    vi.mocked(collectFlow).mockResolvedValue({
      events: [
        {
          text: 'Home page text',
          flow_id: 'root',
          flow_step: 0,
          url: 'https://example.com/',
          page_title: 'Home',
        },
        {
          text: 'Offer expires soon',
          flow_id: 'pricing',
          flow_step: 0,
          url: 'https://example.com/pricing',
          page_title: 'Pricing',
        },
      ],
      discovered_flows: [
        { id: 'pricing', title: 'Pricing', path: '/pricing', risk_hint: 'HIGH' },
      ],
      pages_discovered: 2,
    });
    vi.mocked(analyzeFlow).mockResolvedValue({
      findings: [
        {
          event_id: 'evt_20260426_000',
          text: 'Offer expires soon',
          attack_class: 'false_urgency',
          confidence: 'HIGH',
          rationale: 'Remove fabricated urgency.',
          flow_id: 'pricing',
          flow_step: 0,
          url: 'https://example.com/pricing',
          page_title: 'Pricing',
          legal_mapping: {
            regulations: [{ name: 'FTC Act Section 5', citation: '15 U.S.C. § 45(a)' }],
            risk_severity: 'high',
            remediation_guidance: 'Remove fabricated urgency.',
          },
        },
      ],
      flow_context: { flow_id: 'pricing', total_events: 1, summary: { false_urgency: 1 } },
    });

    const collected = await scannerService.discoverFlows('https://example.com');
    const result = await scannerService.scanCollectedFlow(collected, ['pricing']);

    expect(analyzeFlow).toHaveBeenCalledWith([
      {
        text: 'Offer expires soon',
        flow_id: 'pricing',
        flow_step: 0,
        url: 'https://example.com/pricing',
        page_title: 'Pricing',
      },
    ]);
    expect(result.findings[0]).toMatchObject({
      title: 'False Urgency',
      page: '/pricing',
      sourceUrl: 'https://example.com/pricing',
      pageTitle: 'Pricing',
      attackClass: 'false_urgency',
    });
  });
});

import { analyzeFlow, analyzeText, collectFlow } from './apiClient';
import { scannerService } from './scannerService';

vi.mock('./apiClient', () => ({
  collectFlow: vi.fn(),
  analyzeFlow: vi.fn(),
  analyzeText: vi.fn(),
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
      extractedText: 'Offer expires soon',
    });
  });

  it('routes URL inputs through flow scan and text inputs through /analyze-text', async () => {
    vi.mocked(collectFlow).mockResolvedValue({
      events: [],
      discovered_flows: [],
      pages_discovered: 0,
    });
    vi.mocked(analyzeFlow).mockResolvedValue({
      findings: [],
      flow_context: { flow_id: 'root', total_events: 0, summary: {} },
    });
    vi.mocked(analyzeText).mockResolvedValue({
      event_id: 'evt_20260426_001',
      text: 'Your account will be suspended',
      attack_class: 'fear_based_threat',
      confidence: 'HIGH',
      rationale: 'Use neutral language.',
      flow_id: 'single',
      flow_step: 0,
      raw_confidence: 0.91,
      evidence_text: 'Your account will be suspended',
      context_text: null,
      snippet_index: 0,
      legal_mapping: {
        regulations: [{ name: 'FTC Act Section 5', citation: '15 U.S.C. § 45(a)' }],
        risk_severity: 'high',
        remediation_guidance: 'Use neutral language.',
      },
    });

    await scannerService.scanInput('https://example.com');
    const textResult = await scannerService.scanInput('Your account will be suspended');

    expect(collectFlow).toHaveBeenCalledWith('https://example.com');
    expect(analyzeText).toHaveBeenCalledWith('Your account will be suspended');
    expect(textResult.findings[0]).toMatchObject({
      attackClass: 'fear_based_threat',
      rawConfidence: 0.91,
      evidenceText: 'Your account will be suspended',
    });
  });
});

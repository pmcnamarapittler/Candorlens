"""
HTML renderer used for browser-based PDF export.
"""

from __future__ import annotations

from html import escape

from backend.schemas.report import GenerateReportRequest


def build_report_html(payload: GenerateReportRequest) -> str:
    findings = payload.findings
    high = sum(1 for f in findings if f.severity == "HIGH")
    medium = sum(1 for f in findings if f.severity == "MEDIUM")
    low = sum(1 for f in findings if f.severity == "LOW")

    rows = []
    for finding in findings:
        rows.append(
            f"""
            <tr>
              <td class="severity {finding.severity.lower()}">{escape(finding.severity)}</td>
              <td>{escape(finding.id)}</td>
              <td>{escape(finding.title)}</td>
              <td>{escape(finding.regulation)}</td>
            </tr>
            """
        )
    table_rows = "\n".join(rows) if rows else '<tr><td colspan="4">No findings</td></tr>'

    return f"""
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>CandorLens Compliance Report</title>
    <style>
      body {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        margin: 44px;
        color: #111;
      }}
      .header {{
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
      }}
      .brand {{
        font-size: 22px;
        font-weight: 300;
      }}
      .meta {{
        font-size: 11px;
        color: #777;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }}
      .meta div {{
        margin-bottom: 4px;
      }}
      h1 {{
        font-size: 44px;
        margin: 0 0 6px;
        font-weight: 300;
      }}
      .subtitle {{
        color: #666;
        margin-bottom: 28px;
      }}
      .summary {{
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin-bottom: 24px;
      }}
      .card {{
        border: 1px solid #eee;
        text-align: center;
        padding: 16px 8px;
      }}
      .card .value {{
        font-size: 32px;
        font-weight: 300;
      }}
      .card .label {{
        margin-top: 8px;
        font-size: 10px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }}
      .alert {{
        border-left: 4px solid #dc2626;
        background: #fff4f4;
        padding: 14px;
        margin-bottom: 24px;
      }}
      .section-title {{
        font-size: 10px;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 8px;
      }}
      table {{
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 28px;
      }}
      th, td {{
        border-bottom: 1px solid #f0f0f0;
        text-align: left;
        padding: 8px 6px;
        font-size: 12px;
      }}
      th {{
        font-size: 10px;
        color: #999;
        text-transform: uppercase;
      }}
      .severity {{
        font-size: 10px;
        font-weight: 600;
      }}
      .severity.high {{ color: #dc2626; }}
      .severity.medium {{ color: #b45309; }}
      .severity.low {{ color: #2563eb; }}
      .reg-chip {{
        display: inline-block;
        background: #f3f7ff;
        color: #2563eb;
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 12px;
        margin-right: 8px;
      }}
    </style>
  </head>
  <body>
    <div class="header">
      <div class="brand">candor lens</div>
      <div class="meta">
        <div>Client: {escape(payload.company_name)}</div>
        <div>Website: {escape(str(payload.website_url))}</div>
      </div>
    </div>
    <hr />
    <h1>Compliance Audit Report</h1>
    <div class="subtitle">Subscription Interface Regulatory Compliance Assessment</div>

    <div class="section-title">Executive Summary</div>
    <div class="summary">
      <div class="card"><div class="value">{len(findings)}</div><div class="label">Total Violations</div></div>
      <div class="card"><div class="value">{high}</div><div class="label">High Severity</div></div>
      <div class="card"><div class="value">{medium}</div><div class="label">Medium Severity</div></div>
      <div class="card"><div class="value">{low}</div><div class="label">Low Severity</div></div>
    </div>

    <div class="alert">
      {"High Risk — Immediate remediation recommended." if high else "No high-severity findings detected."}
    </div>

    <div class="section-title">Detailed Findings</div>
    <table>
      <thead>
        <tr><th>Severity</th><th>Code</th><th>Finding</th><th>Regulation</th></tr>
      </thead>
      <tbody>
        {table_rows}
      </tbody>
    </table>

    <div class="section-title">Applicable Regulations</div>
    <div>
      {"".join(f'<span class="reg-chip">{escape(f.regulation)}</span>' for f in findings[:10])}
    </div>
  </body>
</html>
"""


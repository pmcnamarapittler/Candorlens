from backend.services import analyze_service
from backend.services import evidence_gates


class FakeClassifier:
    def __init__(self, predictions):
        self.predictions = predictions

    def predict_batch(self, texts):
        return [self.predictions(text) for text in texts]

    @staticmethod
    def raw_confidence_to_enum(raw):
        if raw >= 0.8:
            return "HIGH"
        if raw >= 0.5:
            return "MEDIUM"
        return "LOW"


def test_analyze_flow_returns_no_findings_for_unsupported_page_text(monkeypatch):
    monkeypatch.setattr(
        analyze_service,
        "get_classifier",
        lambda: FakeClassifier(lambda _: ("fear_based_threat", 0.95)),
    )

    findings, context = analyze_service.analyze_flow(
        [
            {
                "text": "Products\nResources\nCompany\nSupport\nLearn how our product works for teams.",
                "flow_id": "home",
                "flow_step": 0,
                "url": "https://example.com/",
                "page_title": "Home",
            }
        ]
    )

    assert findings == []
    assert context["total_snippets"] >= 1


def test_analyze_flow_returns_exact_violating_snippet(monkeypatch):
    def prediction(text):
        if "suspended" in text:
            return ("fear_based_threat", 0.96)
        return ("false_urgency", 0.20)

    monkeypatch.setattr(analyze_service, "get_classifier", lambda: FakeClassifier(prediction))

    findings, _ = analyze_service.analyze_flow(
        [
            {
                "text": "Welcome to Example.\nYour account will be suspended unless you verify now.\nThanks for visiting.",
                "flow_id": "account",
                "flow_step": 0,
                "url": "https://example.com/account",
                "page_title": "Account",
            }
        ]
    )

    assert len(findings) == 1
    finding = findings[0]
    assert finding.attack_class == "fear_based_threat"
    assert finding.text == "Your account will be suspended unless you verify now."
    assert finding.evidence_text == "Your account will be suspended unless you verify now."
    assert finding.url == "https://example.com/account"
    assert finding.raw_confidence == 0.96


def test_analyze_flow_suppresses_low_confidence_prediction(monkeypatch):
    monkeypatch.setattr(
        analyze_service,
        "get_classifier",
        lambda: FakeClassifier(lambda _: ("fear_based_threat", 0.40)),
    )

    findings, _ = analyze_service.analyze_flow(
        [
            {
                "text": "Your account will be suspended unless you verify now.",
                "flow_id": "account",
                "flow_step": 0,
            }
        ]
    )

    assert findings == []


def test_analyze_text_rejects_non_actionable_prediction(monkeypatch):
    class FakeClassifierSingle:
        @staticmethod
        def predict(_text):
            return ("fear_based_threat", 0.95)

        @staticmethod
        def raw_confidence_to_enum(_raw):
            return "HIGH"

    monkeypatch.setattr(analyze_service, "get_classifier", lambda: FakeClassifierSingle())

    try:
        analyze_service.analyze_text("Welcome to our product overview page.")
    except ValueError as exc:
        assert "No actionable violation evidence found" in str(exc)
    else:
        raise AssertionError("Expected analyze_text to reject benign copy")


def test_analyze_flow_suppresses_single_keyword_false_positive(monkeypatch):
    monkeypatch.setattr(
        analyze_service,
        "get_classifier",
        lambda: FakeClassifier(lambda _: ("fear_based_threat", 0.97)),
    )

    findings, _ = analyze_service.analyze_flow(
        [
            {
                "text": "Security resources and product updates for enterprise teams.",
                "flow_id": "resources",
                "flow_step": 0,
                "url": "https://example.com/resources",
                "page_title": "Resources",
            }
        ]
    )

    assert findings == []


def test_per_class_threshold_override(monkeypatch):
    monkeypatch.setenv("MIN_FINDING_CONFIDENCE_FEAR_BASED_THREAT", "0.98")
    assert evidence_gates.min_confidence_for_class("fear_based_threat") == 0.98
    assert evidence_gates.should_emit_finding(
        "fear_based_threat", 0.95, "Your account will be suspended unless you verify now."
    ) is False

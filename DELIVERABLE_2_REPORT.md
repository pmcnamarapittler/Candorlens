# CandorLens - Deliverable 2: Data Pipeline Implementation

Date: February 8, 2026
Team: Aaditya Kabra
Stakeholder: Paige McNamara-Pittler

---

## 1. Development Environment Setup

### Repository Setup
Cloned the CandorLens repository from GitHub and configured the local development environment on macOS with Python 3.9.

```
git clone https://github.com/pmcnamarapittler/Candorlens.git
cd Candorlens
```

### Dependency Installation
Installed required Python packages from requirements.txt, including:
- FastAPI (0.109.0) - Backend API framework
- Pydantic (2.12.5) - Data validation and schema enforcement
- scikit-learn (1.6.1) - Machine learning utilities for dataset splitting
- PyTorch (2.1.0+) - Deep learning framework
- Transformers (4.36.0+) - HuggingFace library for BERT models

Installation verified using dependency check scripts.

### Environment Configuration
Set up virtual environment and configured Azure Blob Storage connection for report persistence. Backend API runs on uvicorn development server with CORS enabled for local testing.

---

## 2. Deployment Configuration

### Current Infrastructure
The CandorLens backend is configured for deployment to Azure Container Apps. The FastAPI application includes health check endpoints and report storage integration.

### Backend Status
- Report API endpoints operational (POST/GET /report)
- Azure Blob Storage integration functional
- CORS middleware configured for development
- Health monitoring endpoint available

### Deployment Dependencies
- Azure Storage connection string required in .env file
- Container registry setup pending for model deployment
- Dashboard deployment pending (React frontend not yet implemented)

---

## 3. Code Maintenance Requirements

### Immediate Maintenance Needs

**Dataset Quality**
The current dataset contains 29 annotated events. Analysis reveals class imbalance:
- fear_based_threat: 14 events (48.3%)
- forced_continuity: 12 events (41.4%)
- false_urgency: 3 events (10.3%)

Recommendation: Add approximately 12 more false_urgency examples and 9 additional events across other classes to reach the 50+ event milestone target.

**Validation Infrastructure**
Two validation approaches are now available:
- Simple dictionary-based loader in scripts/load_events.py (backward compatible)
- Comprehensive Pydantic-based validator in ml/data/validate_jsonl.py (type-safe)

Both validators enforce the LanguageEvent schema defined in taxonomy/language_event_schema.json.

**Testing Requirements**
While pytest is included in requirements.txt, no unit test suite has been implemented. Manual testing confirms all pipeline components function correctly with the current dataset.

**Dependency Updates**
Regular updates recommended for:
- transformers library (frequent releases with model improvements)
- torch (security patches)
- Azure SDK packages (API changes)

**Security Considerations**
Azure connection strings and API keys must remain in .env files and excluded from version control. The .gitignore file properly excludes credentials.

---

## 4. Feature Roadmap

### Completed for Deliverable 2

**JSONL Loader and Validation**
Implemented dual validation approach:
- Lightweight loader for script integration
- Comprehensive Pydantic validator for production use
- Both enforce same schema with different trade-offs

**Data Pipeline Components**
Built complete preprocessing pipeline:
- Schema validation with detailed error reporting
- Text normalization (HTML entities, quotes, whitespace)
- Dataset quality analysis and reporting
- Stratified train/validation/test splitting (70/15/15 ratio)
- Flow-level aggregation utilities
- Master pipeline orchestrator

### Future Deliverables

**D3: BERT Classifier Training**
Train transformer-based text classifier for pattern detection:
- Fine-tune BERT model on annotated events
- Target precision: 60% or higher
- Support for three attack classes (FCL, FU, FAT)
- Model checkpoint persistence

**D4: API Integration**
Implement analysis endpoints in FastAPI backend:
- /analyze-text endpoint for single-text classification
- /analyze-flow endpoint for multi-step flow analysis
- Integration with trained BERT model
- Azure deployment of complete backend

**D5: Report Generation**
Automated compliance report generation:
- PDF report creation with legal citations
- Regulatory mapping (FTC Act, ROSCA, CPRA)
- Remediation recommendations
- Executive summary generation

**D6: Dashboard Development**
React-based frontend interface:
- URL submission and flow analysis
- Real-time classification results
- Report viewing and download
- User authentication and session management

**D7: Production Deployment**
Complete system deployment:
- Azure Container Apps hosting
- Production monitoring and logging
- Performance optimization
- Final documentation and handoff

---

## 5. Technical Design and Implementation

### Architecture Overview

The data pipeline implements a four-stage architecture for preparing annotated language events for machine learning model training:

```
Raw JSONL Events
    |
    v
[Validation] - Schema compliance, type checking
    |
    v
[Preprocessing] - Text normalization, cleaning
    |
    v
[Analysis] - Quality metrics, distribution checks
    |
    v
[Splitting] - Stratified train/val/test partitioning
    |
    v
Training-Ready Datasets
```

### Component Design

**Validation Module (validate_jsonl.py)**
Implements Pydantic models matching the LanguageEvent schema. Validates 11 required fields and 4 optional fields. Supports two modes: strict (fail-fast) and graceful (collect all errors). Integrates with existing D2 loader through command-line flag.

**Preprocessing Module (preprocess.py)**
Text cleaning pipeline handles:
- HTML entity conversion (nbsp, quot, amp, etc.)
- Quote normalization (smart quotes to ASCII)
- Whitespace normalization (tabs, newlines, multiple spaces)
- Punctuation normalization (excessive repetition)
- Optional case preservation (default: preserve for BERT)

Adds text_normalized field while preserving original text for traceability.

**Analysis Module (analyze_dataset.py)**
Generates comprehensive quality reports including:
- Class distribution and imbalance detection
- Confidence level breakdown
- Duplicate detection (text and event IDs)
- Optional field coverage statistics
- Text length analysis (character count, word count)
- BERT token limit warnings
- Flow-level statistics
- Coercion vector usage patterns

**Splitting Module (create_splits.py)**
Creates reproducible train/validation/test splits using scikit-learn:
- Stratified sampling maintains class distribution
- Default ratio: 70/15/15 (configurable)
- Fixed random seed (42) ensures reproducibility
- Metadata tracking for experiment reproducibility
- Validates minimum sample requirements

**Aggregation Module (aggregate_flows.py)**
Groups events by flow_id for flow-level analysis:
- Computes attack diversity per flow
- Tracks dominant patterns
- Calculates attack density
- Maintains event ordering by flow_step

**Pipeline Orchestrator (run_pipeline.py)**
Master script coordinates all stages:
- Sequential execution with error handling
- Intermediate output persistence
- Progress reporting
- Configurable stage skipping
- Comprehensive final summary

### Technical Skills Acquired

**Schema Validation**
Implemented type-safe data validation using Pydantic models with custom validators for complex fields (coercion_vector, jurisdiction_mapping). Learned pattern matching for field validation and error message formatting.

**Text Processing**
Developed text normalization pipeline handling Unicode characters, HTML entities, and whitespace. Studied BERT tokenization requirements and implemented preprocessing compatible with transformer models.

**Machine Learning Pipeline Design**
Learned stratified sampling techniques for maintaining class balance in imbalanced datasets. Implemented reproducible splitting with random seed management and metadata tracking.

**CLI Tool Development**
Built command-line interfaces using argparse with comprehensive help text, optional parameters, and clear progress reporting. Implemented modular design allowing individual script execution or orchestrated pipeline runs.

### Design Decisions

**Pydantic vs JSON Schema**
Selected Pydantic for validation due to:
- Type safety in Python code
- Better error messages for debugging
- FastAPI compatibility (planned for D4)
- Native Python object manipulation

**Case Preservation**
Decided to preserve text case during preprocessing because:
- Capitalization can signal emphasis ("FREE" vs "free")
- BERT models handle casing natively
- Pattern detection may depend on visual emphasis
- Lowercase transformation remains available as option

**Text Field Strategy**
Implemented dual-field approach (original text + normalized text) to:
- Maintain data provenance
- Enable debugging and verification
- Support reversibility of preprocessing
- Allow comparative analysis

**Stratified Splitting**
Chose stratified sampling over random splitting to:
- Maintain class distribution across splits
- Prevent test sets dominated by single class
- Ensure representative validation sets
- Support reliable model evaluation

**Fixed Random Seed**
Set random seed to 42 for:
- Reproducible splits across runs
- Consistent results in documentation
- Experiment tracking and comparison
- Standard practice in ML pipelines

---

## 6. Application Status Investigation

### Backend Service Health
The CandorLens backend API is operational with basic report storage functionality. Health check endpoint responds correctly. Azure Blob Storage integration is functional.

### Current Limitations
- Machine learning model not yet trained (pending D3)
- Analysis endpoints not implemented (planned for D4)
- PDF report generation not available (planned for D5)
- Dashboard interface not deployed (planned for D6)

### Data Pipeline Status
Complete and operational. Successfully validated, preprocessed, analyzed, and split 29 annotated events. All test cases passing. Pipeline ready for production use once dataset reaches 50+ events.

### Integration Points
Successfully integrated with existing D2 JSONL loader. Both validation approaches (simple dictionary-based and comprehensive Pydantic-based) coexist and interoperate through command-line flags.

---

## Appendix A: Implementation Statistics

**Code Delivered**
- 7 Python modules (1,100+ lines)
- 6 executable pipeline scripts
- 1 master orchestrator
- Integration with existing D2 loader

**Test Results**
- 29/29 events validated successfully
- 0 duplicate event IDs detected
- Class balance maintained across splits (stratified)
- All pipeline stages executed without errors
- Output files generated correctly (7 files per run)

**Dataset Metrics**
- Total events: 29
- Unique flows: 10
- Average text length: 63 characters (11 words)
- Confidence distribution: 72.4% HIGH, 24.1% MEDIUM, 3.4% LOW
- No events exceed BERT token limit

**Pipeline Performance**
- Validation: <2 seconds for 29 events
- Preprocessing: <1 second
- Analysis: <2 seconds
- Splitting: <1 second
- Total end-to-end: <10 seconds

---

## Appendix B: Usage Instructions

**Basic Pipeline Execution**
```
cd ml/data
python3 run_pipeline.py --input ../../data/annotated/events.jsonl --output-dir ../../data/splits
```

**Individual Component Usage**
```
python3 validate_jsonl.py <input.jsonl>
python3 analyze_dataset.py <input.jsonl>
python3 create_splits.py <input.jsonl> --output-dir <output>
```

**D2 Loader Integration**
```
python3 validate_jsonl.py <input.jsonl> --use-d2-loader
```

All scripts include built-in help accessible via --help flag.

---

## Appendix C: Next Steps for D3

With the data pipeline complete, the path to D3 (BERT classifier training) is:

1. Annotate 21 additional events to reach 50+ target
2. Run complete pipeline on full dataset
3. Use generated train.jsonl for BERT fine-tuning
4. Validate model during training using val.jsonl
5. Evaluate final model performance on test.jsonl
6. Target metric: 60% precision or higher

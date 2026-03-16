## ADDED Requirements

### Requirement: Major metric consistency for rankings
The system SHALL use consistent major metric definitions between single-major analytics and rankings outputs.

#### Scenario: Rankings use analytics-consistent metrics
- **WHEN** major ranking rows are generated
- **THEN** `applicants`, `admitted`, `acceptance_rate`, and `cutoff_score` follow the same definitions used by major analytics

### Requirement: Process-scoped comparative analytics semantics
The system MUST support comparative major analytics semantics within a selected admission process.

#### Scenario: Rankings are process-scoped snapshots
- **WHEN** ranking rows are computed for a `process_id`
- **THEN** each row metric is derived from that same process scope for valid cross-major comparison

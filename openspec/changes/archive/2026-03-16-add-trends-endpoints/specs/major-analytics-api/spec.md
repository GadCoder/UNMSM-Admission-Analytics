## MODIFIED Requirements

### Requirement: Major metric consistency for rankings
The system SHALL use consistent major metric definitions between single-major analytics, rankings outputs, and trends outputs.

#### Scenario: Rankings use analytics-consistent metrics
- **WHEN** major ranking rows are generated
- **THEN** `applicants`, `admitted`, `acceptance_rate`, and `cutoff_score` follow the same definitions used by major analytics

#### Scenario: Trends use analytics-consistent metrics
- **WHEN** major trends history rows are generated
- **THEN** shared metrics (`applicants`, `admitted`, `acceptance_rate`, `max_score`, `min_score`, `avg_score`, `median_score`, `cutoff_score`) follow the same definitions used by major analytics

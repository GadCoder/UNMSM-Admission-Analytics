## ADDED Requirements

### Requirement: Major analytics metric definitions
The system SHALL compute major analytics metrics from admission results using explicit and consistent definitions.

#### Scenario: Applicants and admitted metrics
- **WHEN** major analytics are computed
- **THEN** `applicants` equals total rows and `admitted` equals rows where `is_admitted = true` for the selected major and filter scope

#### Scenario: Acceptance rate metric
- **WHEN** major analytics are computed
- **THEN** `acceptance_rate` equals `admitted / applicants` and is `null` when `applicants = 0`

#### Scenario: Score aggregate metrics
- **WHEN** major analytics are computed
- **THEN** `max_score`, `min_score`, and `avg_score` are computed from all candidate scores in the filtered set

#### Scenario: Median score metric
- **WHEN** major analytics are computed
- **THEN** `median_score` is computed as the statistical median of filtered candidate scores

#### Scenario: Cutoff score metric
- **WHEN** major analytics are computed
- **THEN** `cutoff_score` equals the minimum admitted score in the filtered set and is `null` when no admitted rows exist

### Requirement: PostgreSQL-backed major analytics aggregation
The system MUST compute major analytics in PostgreSQL.

#### Scenario: Repository executes aggregate/statistical SQL
- **WHEN** major analytics endpoint requests metrics
- **THEN** repository logic executes PostgreSQL aggregate queries for counts, score stats, median, and cutoff values

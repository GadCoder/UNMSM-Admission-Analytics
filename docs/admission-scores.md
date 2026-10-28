# Admission scores

## Career page layout

1. Career header followed by the same compact, left-aligned process and modality selectors as the process overview. Labels sit above the fields; controls stack at 600px and below.
2. Exactly six KPI cards: Postulantes, Ingresantes, Porcentaje de ingresantes, Puntaje mínimo de ingreso, Puntaje promedio, Puntaje máximo.
3. One historical evolution chart with the existing metric selector.
4. Existing historical results timeline, with minimum, average and maximum scores in its detail area.

Admission scores are integrated into the existing KPIs, historical chart and timeline without an additional section or chart. The process overview retains its six-card structure and absentee KPI. Its average KPI uses the same admitted-applicant definition and asterisk note as the career page. Process, modality and Filtros have their own row beneath the page heading, in that order. The modality selector stays visible with a lighter sentence-case display label, using “Educación Básica Regular (EBR) y Alternativa (EBA)” for the default; the full original name remains in its title and accessible description. The API value is unchanged. Selectors have labels above and bounded widths, aligned left rather than stretched across the page. Controls stack on mobile; Filtros contains only area and faculty.

## Score definitions and API

`GET /api/v1/analytics/majors/{id}/?process={id}` includes numeric, nullable `minimum_admitted_score` in both `selected_processes` and `history`. Shared process overview and history responses expose it too. Storage retains four decimal places. The minimum is a JSON number; existing average and maximum fields retain their decimal-string representation.

The minimum includes only records whose status is exactly `admitted` and whose score is non-null and within the model's DecimalField precision (-9999.9999 through 9999.9999). Absent, disqualified and other statuses do not contribute. Valid zero and negative numeric scores are not treated as missing. Unavailable minima remain null.

Across process overview, latest-process, process-history, career-detail and per-career breakdown responses, `average_score` is SQL AVG over the same valid admitted-applicant population used by the minimum, within the selected process and modality. It excludes non-admitted, absent, disqualified and missing/invalid scores and returns null if no valid admitted scores exist. Selected and historical observations use the same definition, including KPI differences, the chart and timeline. This deliberately changes the former all-scored-applicant averages; no response field names or precision change.

The average KPI on both pages has an asterisk linked to a small note: “El puntaje promedio considera solo a los ingresantes con puntaje válido.” `highest_score` also retains its existing maximum over all scored records, regardless of status. The career timeline shows minimum, average and maximum scores, formatted to two decimals; unavailable values display an em dash. On mobile they appear under “Estadísticas adicionales”. The process overview timeline retains its absentee detail; absentee calculations and API fields remain intact.

## Modality and comparisons

Both pages require a selected modality and default to “EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)”. There is no combined/all-modalities choice. Missing or blank selections resolve before the first statistics request, including legacy empty dashboard session preferences. Explicit selections persist across process changes; dashboard filter resets restore basic education, while clearing optional area/faculty filters. Modality is changed in its own visible selector; filter chips are reserved for optional area and faculty selections.

All analytics services apply the same server-side default for omitted or blank modality parameters and always filter by one named modality. Explicit names are trimmed and matched exactly; unknown modalities return empty statistics rather than combined results. This changes the process overview/history endpoints' former unfiltered behavior when the parameter was omitted. The latest-process endpoint also uses basic education.

The dashboard keeps filter preferences in session storage and migrates explicit filter URL parameters through its existing flow. Career URLs retain their selected modality. Dashboard career links carry the chosen process and modality into the detail page. The same scope applies to KPIs, historical data, demand/ranking data and per-career averages. Both selectors use full modality names, with titles and accessible descriptions.

A minimum is null when admitted scores span multiple modalities. `admitted_score_modality_count` explains that state; `admitted_score_modality` identifies a single known modality. Unknown modality is a separate group and is never pooled with a known one.

Minimum KPI differences require finite values, exactly one identified modality in each process, and matching modality names. The reference is always the immediately preceding published process; an unavailable previous observation is not replaced by an older one. When there is no comparable previous minimum, the KPI shows no comparison. Score differences use the existing signed, two-decimal `pts` formatting; all three career score KPIs and the process average use neutral arrows rather than positive/negative colors.

The minimum is the initial career chart metric when the current process has a valid minimum, even when it is the only available observation. Historical minimum points are included only when the selected process and historical process have matching, identified modalities; otherwise the chart shows the selected process as a single point. Otherwise the initial metric remains Postulantes. All previous metric options remain available, and an explicit user metric selection persists across process changes. The process overview retains Postulantes as its chart default.

The minimum metric also supports the existing “Patrón histórico” insight inside this same chart. It describes the most recent uninterrupted segment for the selected, identified modality: a sustained increase/decrease when every transition follows that direction, or otherwise the last consecutive change (including no change). It never bridges missing, unknown, mixed or different modalities, and names the processes explicitly when later observations are unavailable. Wording is descriptive and uses points, without interpreting a higher score as better or predicting admission.

Modality is the comparison scope available in the current API. It does **not** establish that historical scoring scales/rules are identical: the models contain no authoritative metadata for them. This limitation is available through the chart's focusable, touch-accessible information tooltip, together with the explanation of mixed-modality gaps. No historical range, median, target or safety margin is inferred.

## Chart and data consistency

The one existing SVG chart preserves selected-process highlighting, exact minimum values in tooltips, keyboard/touch interactions, responsive labels and gaps for missing observations. Score axes use rounded whole-number tick intervals (1, 2 or 5 times a power of ten), expanding the padded domain to matching boundaries; points and grid lines use that same domain. Tooltip values retain their original precision. Lines also break when the recorded modality changes. The chart does not navigate to other processes.

When the minimum is selected, the only permanent explanation is:

> Menor puntaje obtenido por un ingresante en cada proceso. Los resultados históricos no garantizan el ingreso futuro.

A process change can reuse the full cached history for the same modality, selecting the requested process's row while the API refreshes. A career or modality change does not reuse data from the previous career or modality; it uses the existing loading state. Process overview placeholder data is reused only for identical filters and when it contains the requested process; history data is not reused across filter changes. The backend still uses three queries for full career/overview responses and two for process history, independent of process count. There are no persisted aggregates or backend caches to rebuild.

## Validation

- All 101 frontend tests pass, covering KPI count/order, the average footnote, neutral average comparisons, missing observations, historical charts and timelines, full modality naming, default/explicit filters, legacy session values, resets and career-link scope.
- TypeScript/Vite production build succeeds.
- The complete backend suite passes all 59 tests, including admitted-status filtering, career/process/modality isolation, null and zero scores, serialization, ordering and constant query count.
- Live Tailscale browser checks at 375px and 1440px confirm six ordered career KPIs, one chart, the minimum default for an identified modality, selected-process highlighting, an on-demand tooltip within the viewport, the full EBR/EBA name and 2024-II filtered minimum, with no horizontal overflow.

- Process-page browser checks at 375px, 1024px and 1440px verify initially filtered requests, the admitted average and asterisk note, six KPIs, mode/process/reload/reset persistence, matching career-link modality, and no horizontal overflow.

The subsequent dedicated control-row refinement has not had its test suites rerun; the suite results above precede it. Its production build passed, and the final layout was visually reviewed at 375px and 1440px.

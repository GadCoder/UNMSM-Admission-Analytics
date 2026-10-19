# Career admission scores

## Career page layout

1. Career header with process and modality selectors, side by side on desktop (1000px and wider) and stacked on narrower screens.
2. Exactly six KPI cards: Postulantes, Ingresantes, Porcentaje de ingresantes, Puntaje mínimo de ingreso, Puntaje promedio, Puntaje máximo.
3. One historical evolution chart with the existing metric selector.
4. Existing historical results timeline, with minimum, average and maximum scores in its detail area.

Admission scores are integrated into the existing KPIs, historical chart and timeline without an additional section or chart. The process overview keeps its existing six cards, order, absentee KPI and comparison styling; the shared KPI grid uses an explicit career variant.

## Score definitions and API

`GET /api/v1/analytics/majors/{id}/?process={id}` includes numeric, nullable `minimum_admitted_score` in both `selected_processes` and `history`. Shared process overview and history responses expose it too. Storage retains four decimal places. The minimum is a JSON number; existing average and maximum fields retain their decimal-string representation.

The minimum includes only records whose status is exactly `admitted` and whose score is non-null and within the model's DecimalField precision (-9999.9999 through 9999.9999). Absent, disqualified and other statuses do not contribute. Valid zero and negative numeric scores are not treated as missing. Unavailable minima remain null.

On the career endpoint, `average_score` is SQL AVG over the same valid admitted-applicant population used by the minimum, within the selected process and modality. It excludes non-admitted, absent, disqualified and missing/invalid scores and returns null if no valid admitted scores exist. Selected and historical observations use the same definition, including KPI differences, the chart and timeline. This deliberately changes the career endpoint's prior all-scored-applicant average; no response field names or precision change.

The career average KPI has an asterisk linked to a small note: “El puntaje promedio considera solo a los ingresantes con puntaje válido.” The process overview/history averages retain their existing all-non-null-score definition. `highest_score` also retains its existing maximum over all scored records, regardless of status. The career timeline shows minimum, average and maximum scores, formatted to two decimals; unavailable values display an em dash. On mobile they appear under “Estadísticas adicionales”. The process overview timeline retains its absentee detail; absentee calculations and API fields remain intact.

## Modality and comparisons

The career page requires a selected modality and defaults to “EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)”. There is no “Todas las modalidades” option. Missing or empty modality parameters resolve to that default before the first statistics request, and the resolved selection is written to the URL. Explicit modality selections are preserved when switching processes. The career endpoint applies that same default server-side for omitted or blank modality values and always filters its queryset by one modality. Explicit names are trimmed and matched exactly; an unavailable modality returns empty statistics rather than falling back to combined results. This changes the career endpoint’s former unfiltered behavior when the parameter was omitted. The shared process overview/history endpoints still support combined data and retain the mixed-modality safeguards. The same filter applies to KPI values, the chart and historical results, and forms part of the React Query cache key. The selector uses the full original modality name, including “EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)”, for its option label and value, selected-control description and titles.

A minimum is null when admitted scores span multiple modalities. `admitted_score_modality_count` explains that state; `admitted_score_modality` identifies a single known modality. Unknown modality is a separate group and is never pooled with a known one.

Minimum KPI differences require finite values, exactly one identified modality in each process, and matching modality names. The reference is always the immediately preceding published process; an unavailable previous observation is not replaced by an older one. Missing or mixed/unknown/different modalities yield a neutral “No disponible” comparison. Score differences use the existing signed, two-decimal `pts` formatting; all three career score KPIs use neutral arrows rather than positive/negative colors.

The minimum is the initial career chart metric when the current process has a valid minimum and another historical observation meets the same modality checks. Otherwise the initial metric remains Postulantes. All previous metric options remain available, and an explicit user metric selection persists across process changes. The process overview retains Postulantes as its chart default.

The minimum metric also supports the existing “Patrón histórico” insight inside this same chart. It describes the most recent uninterrupted segment for the selected, identified modality: a sustained increase/decrease when every transition follows that direction, or otherwise the last consecutive change (including no change). It never bridges missing, unknown, mixed or different modalities, and names the processes explicitly when later observations are unavailable. Wording is descriptive and uses points, without interpreting a higher score as better or predicting admission.

Modality is the comparison scope available in the current API. It does **not** establish that historical scoring scales/rules are identical: the models contain no authoritative metadata for them. This limitation is available through the chart's focusable, touch-accessible information tooltip, together with the explanation of mixed-modality gaps. No historical range, median, target or safety margin is inferred.

## Chart and data consistency

The one existing SVG chart preserves selected-process highlighting, exact minimum values in tooltips, keyboard/touch interactions, responsive labels and gaps for missing observations. Score axes use rounded whole-number tick intervals (1, 2 or 5 times a power of ten), expanding the padded domain to matching boundaries; points and grid lines use that same domain. Tooltip values retain their original precision. Lines also break when the recorded modality changes. The chart does not navigate to other processes.

When the minimum is selected, the only permanent explanation is:

> Menor puntaje obtenido por un ingresante en cada proceso. Los resultados históricos no garantizan el ingreso futuro.

A process change can reuse the full cached history for the same modality, selecting the requested process's row while the API refreshes. A career or modality change does not reuse data from the previous career or modality; it uses the existing loading state. The backend still uses three queries for the entire career response, independent of history length. There are no persisted aggregates or backend caches to rebuild.

## Validation

- Focused frontend tests cover exact KPI count/order, the unchanged process variant, neutral point comparisons, missing and incompatible observations, the minimum chart default, selected highlighting, precise tooltips, on-demand limitations, historical gaps, full modality naming, filter propagation and existing loading/error states.
- TypeScript/Vite production build succeeds.
- The complete backend suite passes all 55 tests, including admitted-status filtering, career/process/modality isolation, null and zero scores, serialization, ordering and constant query count.
- Full frontend testing during the original implementation identified three existing assertion failures in dashboard/timeline tests, reproduced against unmodified HEAD in a temporary checkout. They concern existing supplemental-statistics buttons and duplicate applicant labels.
- Live Tailscale browser checks at 375px and 1440px confirm six ordered career KPIs, one chart, the minimum default for an identified modality, selected-process highlighting, an on-demand tooltip within the viewport, the full EBR/EBA name and 2024-II filtered minimum, with no horizontal overflow.

# Major historical results: process timeline

## Intended result

Help readers understand how participation and admission changed without interpreting a grid of numbers. The chart shows trends; the timeline explains each process with one factual takeaway and its supporting evidence.

## Composition

1. Show newest-first processes grouped by year, with a subtle date rail and markers.
2. Lead each entry with a complete sentence comparing applicants and admitted counts with the immediately preceding process, named in the sentence. A relative count change of at most 5% is described as similar; explain this convention in a small note. Do not infer exam difficulty or causes from aggregate results.
3. Support the takeaway with two counts: applicants and admitted students.
4. Explain admission rate in a sentence, naming the comparison process when both rates are calculable. With zero applicants, show an unavailable-rate message rather than an invented 0%.
5. Keep average score, maximum score, and absence count/percentage in a quieter, always-visible detail area. On wide desktop screens, align this area to the right of the narrative. On mobile, give the two main counts their own columns, increase spacing, and show secondary details as aligned label/value rows. Preserve missing scores as unavailable.
6. Use a factual reference summary when there is no usable preceding process. Handle empty history explicitly.
7. Mark the selected process with burgundy and an accessible pressed-state button. Selection updates the existing URL-driven page context.
8. Use one responsive timeline for desktop and mobile, without tables, decorative metric bars, or expansion controls. Remove the previous highlights strip so it does not compete with the entry takeaways.

## Implementation and validation

- Implemented in MajorDetailHistory.tsx and its dedicated CSS module, integrated into MajorDetailPage.
- Tested opposing count changes, the 5% similarity boundary, newest-first ordering, year grouping, zero counts, missing scores, empty and single-process histories, visible details, and keyboard/URL selection.
- All 50 frontend tests pass; production build and lint pass.
- Reviewed Chrome previews at 1280px and 390px with sample API data. Both layouts fit without horizontal page overflow; process selection updates the URL and selector.
- The existing Tailscale preview remains available with clearly labeled illustrative data; production data is unchanged.
- Preserved unrelated existing edits to vite.config.ts.
- Quality review: removed obsolete table/card CSS, explicitly preserved list semantics for screen readers, documented newest-first input ordering, and shared one similarity threshold between logic and explanatory text. Verified zero-ingresantes baselines and distinguished an oldest process from a preceding process without applicants.

import { useMemo, useState } from 'react'

import {
  Button,
  FilterPill,
  GlobalFilterBar,
  Grid,
  GridItem,
  HighlightBanner,
  HighlightCard,
  InsightPanel,
  SectionHeader,
  StatCard,
  TrendIndicator,
  type SelectOption,
} from '../components/design-system'
import { useAcademicAreaOptions } from '../features/global-filters/api/use-academic-area-options'
import { useProcessOptions } from '../features/global-filters/api/use-process-options'
import { useGlobalFilters } from '../features/global-filters/model/use-global-filters'

export function DashboardPage() {
  const { filters, hasActiveFilters, setProcessId, setAcademicAreaId, resetFilters } = useGlobalFilters()
  const { options: processOptions } = useProcessOptions()
  const { options: areaOptions } = useAcademicAreaOptions()

  const [year, setYear] = useState('')

  const yearOptions: SelectOption[] = useMemo(
    () => [
      { value: '2026', label: '2026' },
      { value: '2025', label: '2025' },
      { value: '2024', label: '2024' },
    ],
    []
  )

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Dashboard"
        subtitle="Scan key admission signals quickly before drilling into detail views."
        actions={<Button variant="secondary">Export snapshot</Button>}
      />

      <GlobalFilterBar
        processId={filters.processId ?? ''}
        year={year}
        academicAreaId={filters.academicAreaId ?? ''}
        processOptions={processOptions}
        yearOptions={yearOptions}
        areaOptions={areaOptions}
        onProcessChange={(value) => setProcessId(value || null)}
        onYearChange={setYear}
        onAreaChange={(value) => setAcademicAreaId(value || null)}
        resetAction={
          <Button disabled={!hasActiveFilters && !year} variant="secondary" onClick={() => {
            resetFilters()
            setYear('')
          }}>
            Reset filters
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filters.processId ? <FilterPill label="Process" value={filters.processId} /> : null}
        {filters.academicAreaId ? <FilterPill label="Area" value={filters.academicAreaId} /> : null}
        {year ? <FilterPill label="Year" value={year} /> : null}
      </div>

      <Grid>
        <GridItem span={3}>
          <StatCard label="Applicants" value="42,198" trend={<TrendIndicator direction="up" value="+4.1%" />} />
        </GridItem>
        <GridItem span={3}>
          <StatCard label="Admitted" value="9,422" trend={<TrendIndicator direction="up" value="+1.8%" />} />
        </GridItem>
        <GridItem span={3}>
          <StatCard label="Acceptance Rate" value="22.3%" trend={<TrendIndicator direction="neutral" value="Stable" />} />
        </GridItem>
        <GridItem span={3}>
          <StatCard label="Majors" value="72" helperText="Active in selected process" variant="with-helper" />
        </GridItem>
      </Grid>

      <Grid>
        <GridItem span={6}>
          <HighlightCard title="Most Competitive Major" value="Medicine" description="38.4 applicants per seat" variant="primary" />
        </GridItem>
        <GridItem span={6}>
          <HighlightCard title="Largest Intake" value="Industrial Engineering" description="420 admitted candidates" />
        </GridItem>
      </Grid>

      <Grid>
        <GridItem span={8}>
          <HighlightBanner label="Top Insight" value="Engineering areas show sustained growth over 3 cycles" />
        </GridItem>
        <GridItem span={4}>
          <InsightPanel
            title="Contextual Insights"
            items={[
              { label: 'Demand Shift', description: 'Health majors outpaced previous cycle by 6.2%.' },
              { label: 'Stability', description: 'Acceptance rate remains stable despite applicant growth.' },
            ]}
          />
        </GridItem>
      </Grid>
    </div>
  )
}

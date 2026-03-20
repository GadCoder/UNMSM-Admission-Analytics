import {
  Badge,
  Button,
  ChartCard,
  ChartLegend,
  ComparisonTable,
  FilterPill,
  HighlightCard,
  InlineAnnotation,
  LineChartAdapter,
  RankingList,
  SectionHeader,
  Skeleton,
  StatCard,
  TrendIndicator,
  type ChartPoint,
  type ChartSeries,
} from '../components/design-system'

const demoSeries: ChartSeries[] = [
  { key: 'a', label: 'Series A', color: '#8f5658' },
  { key: 'b', label: 'Series B', color: '#2e8b57' },
]

const demoPoints: ChartPoint[] = [
  { x: 'Q1', a: 12, b: 10 },
  { x: 'Q2', a: 18, b: 13 },
  { x: 'Q3', a: 21, b: 16 },
]

export function ShowcasePage() {
  return (
    <div className="space-y-5">
      <SectionHeader title="Component Showcase" subtitle="Internal visual QA for reusable design-system components." />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">Success</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge>Neutral</Badge>
        <FilterPill label="Process" value="2026-I" />
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Applicants" value="41,220" trend={<TrendIndicator direction="up" value="+3.2%" />} />
        <HighlightCard title="Top Major" value="Medicine" variant="primary" description="Most competitive" />
        <Skeleton className="h-28" />
      </div>

      <ChartCard title="Chart Adapter Demo" actions={<InlineAnnotation label="DEMO" />}>
        <LineChartAdapter data={demoPoints} series={demoSeries} />
        <div className="mt-3">
          <ChartLegend series={demoSeries} />
        </div>
      </ChartCard>

      <RankingList
        items={[
          { id: '1', label: 'Computer Science', value: '97.4', progress: 97 },
          { id: '2', label: 'Medicine', value: '96.7', progress: 96 },
        ]}
      />

      <ComparisonTable
        entities={[
          { key: 'cs', label: 'CS' },
          { key: 'se', label: 'SE' },
        ]}
        rows={[
          { id: 'r1', metric: 'Applicants', values: { cs: '1900', se: '1700' } },
          { id: 'r2', metric: 'Cutoff', values: { cs: '88.2', se: '84.1' } },
        ]}
      />
    </div>
  )
}

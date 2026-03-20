import { useMemo, useState } from 'react'

import { Breadcrumbs, Button, ExploreHeader, HierarchicalSidebar, SectionHeader } from '../components/design-system'

const hierarchyData = [
  {
    id: 'area-eng',
    label: 'Engineering',
    children: [
      { id: 'major-cs', label: 'Computer Science' },
      { id: 'major-se', label: 'Software Engineering' },
    ],
  },
  {
    id: 'area-health',
    label: 'Health Sciences',
    children: [
      { id: 'major-medicine', label: 'Medicine' },
      { id: 'major-nursing', label: 'Nursing' },
    ],
  },
]

export function ExplorePage() {
  const [selectedNode, setSelectedNode] = useState('major-cs')

  const selectedLabel = useMemo(() => {
    for (const area of hierarchyData) {
      const match = area.children?.find((child) => child.id === selectedNode)
      if (match) {
        return match.label
      }
    }
    return 'Unknown'
  }, [selectedNode])

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Explore', href: '/explore' },
          { label: selectedLabel },
        ]}
      />

      <ExploreHeader
        title="Explore Admission Hierarchy"
        description="Navigate academic areas, faculties, and majors from a single expandable hierarchy."
        actions={
          <>
            <Button variant="secondary">Filter</Button>
            <Button variant="primary">Export</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <HierarchicalSidebar groups={hierarchyData} selectedId={selectedNode} onSelect={setSelectedNode} />
        <section className="rounded-card border border-primary/10 bg-surface p-5 shadow-soft">
          <SectionHeader
            title={selectedLabel}
            subtitle="Entity context appears here; future changes will add tables and trend visualizations."
          />
        </section>
      </div>
    </div>
  )
}

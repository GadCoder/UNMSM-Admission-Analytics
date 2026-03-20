import { useState } from 'react'

import {
  Button,
  GlobalFilterBar,
  ProgressBarList,
  RankingList,
  SectionHeader,
  type SelectOption,
} from '../components/design-system'

export function RankingsPage() {
  const [processId, setProcessId] = useState('')
  const [year, setYear] = useState('')
  const [areaId, setAreaId] = useState('')

  const processOptions: SelectOption[] = [
    { value: '1', label: '2026 - I' },
    { value: '2', label: '2025 - II' },
  ]
  const yearOptions: SelectOption[] = [
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
  ]
  const areaOptions: SelectOption[] = [
    { value: '10', label: 'Engineering' },
    { value: '20', label: 'Health Sciences' },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Rankings"
        subtitle="Compare top-performing entities with consistent ranking and progress views."
      />

      <GlobalFilterBar
        processId={processId}
        year={year}
        academicAreaId={areaId}
        processOptions={processOptions}
        yearOptions={yearOptions}
        areaOptions={areaOptions}
        onProcessChange={setProcessId}
        onYearChange={setYear}
        onAreaChange={setAreaId}
        resetAction={
          <Button
            variant="secondary"
            onClick={() => {
              setProcessId('')
              setYear('')
              setAreaId('')
            }}
          >
            Reset
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <RankingList
          items={[
            { id: '1', label: 'Medicine', value: '98.4', progress: 98 },
            { id: '2', label: 'Computer Science', value: '96.2', progress: 96 },
            { id: '3', label: 'Law', value: '93.7', progress: 94 },
          ]}
        />
        <ProgressBarList
          items={[
            { id: 'a', label: 'Engineering', value: 88 },
            { id: 'b', label: 'Health Sciences', value: 91 },
            { id: 'c', label: 'Business', value: 79 },
          ]}
        />
      </div>
    </div>
  )
}

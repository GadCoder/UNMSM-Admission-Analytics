import type { HierarchicalNode } from '../../../components/design-system'
import type { ExploreMajor } from '../api/use-explore-data'

export type ExploreNodeKind = 'area' | 'faculty' | 'major'

export type ExploreNodeMeta = {
  id: string
  sourceId: number
  kind: ExploreNodeKind
  label: string
  areaLabel: string
  facultyLabel: string | null
  majorLabel: string | null
  majorId: number | null
}

export type ExploreHierarchyData = {
  groups: HierarchicalNode[]
  nodesById: Record<string, ExploreNodeMeta>
  firstMajorNodeId: string | null
}

type MutableGroup = {
  areaId: number
  areaName: string
  faculties: Map<number, { facultyName: string; majors: ExploreMajor[] }>
}

function nodeId(kind: ExploreNodeKind, id: number): string {
  return `${kind}-${id}`
}

function byLabel<T extends { name: string }>(left: T, right: T): number {
  return left.name.localeCompare(right.name)
}

export function buildExploreHierarchy(majors: ExploreMajor[]): ExploreHierarchyData {
  const groupsMap = new Map<number, MutableGroup>()

  const sortedMajors = [...majors].sort(byLabel)

  sortedMajors.forEach((major) => {
    const areaGroup = groupsMap.get(major.academic_area.id) ?? {
      areaId: major.academic_area.id,
      areaName: major.academic_area.name,
      faculties: new Map<number, { facultyName: string; majors: ExploreMajor[] }>(),
    }

    const facultyGroup = areaGroup.faculties.get(major.faculty.id) ?? {
      facultyName: major.faculty.name,
      majors: [],
    }

    facultyGroup.majors.push(major)
    areaGroup.faculties.set(major.faculty.id, facultyGroup)
    groupsMap.set(major.academic_area.id, areaGroup)
  })

  const nodesById: Record<string, ExploreNodeMeta> = {}
  let firstMajorNodeId: string | null = null

  const groups: HierarchicalNode[] = [...groupsMap.values()]
    .sort((left, right) => left.areaName.localeCompare(right.areaName))
    .map((areaGroup) => {
      const areaNodeId = nodeId('area', areaGroup.areaId)
      nodesById[areaNodeId] = {
        id: areaNodeId,
        sourceId: areaGroup.areaId,
        kind: 'area',
        label: areaGroup.areaName,
        areaLabel: areaGroup.areaName,
        facultyLabel: null,
        majorLabel: null,
        majorId: null,
      }

      const facultyChildren: HierarchicalNode[] = [...areaGroup.faculties.entries()]
        .sort((left, right) => left[1].facultyName.localeCompare(right[1].facultyName))
        .map(([facultyId, facultyGroup]) => {
          const facultyNodeId = nodeId('faculty', facultyId)
          nodesById[facultyNodeId] = {
            id: facultyNodeId,
            sourceId: facultyId,
            kind: 'faculty',
            label: facultyGroup.facultyName,
            areaLabel: areaGroup.areaName,
            facultyLabel: facultyGroup.facultyName,
            majorLabel: null,
            majorId: null,
          }

          const majorChildren: HierarchicalNode[] = [...facultyGroup.majors]
            .sort(byLabel)
            .map((major) => {
              const majorNodeId = nodeId('major', major.id)
              if (firstMajorNodeId === null) {
                firstMajorNodeId = majorNodeId
              }

              nodesById[majorNodeId] = {
                id: majorNodeId,
                sourceId: major.id,
                kind: 'major',
                label: major.name,
                areaLabel: areaGroup.areaName,
                facultyLabel: facultyGroup.facultyName,
                majorLabel: major.name,
                majorId: major.id,
              }

              return {
                id: majorNodeId,
                label: major.name,
              }
            })

          return {
            id: facultyNodeId,
            label: facultyGroup.facultyName,
            children: majorChildren,
          }
        })

      return {
        id: areaNodeId,
        label: areaGroup.areaName,
        children: facultyChildren,
      }
    })

  return {
    groups,
    nodesById,
    firstMajorNodeId,
  }
}

export function reconcileSelectedNode(
  selectedNodeId: string | null,
  hierarchy: ExploreHierarchyData
): string | null {
  if (selectedNodeId && hierarchy.nodesById[selectedNodeId]) {
    return selectedNodeId
  }
  return hierarchy.firstMajorNodeId
}

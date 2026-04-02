import { describe, expect, it } from 'vitest'

import type { ExploreMajor } from '../api/use-explore-data'
import { buildExploreHierarchy, reconcileSelectedNode } from './explore-hierarchy'

const majors: ExploreMajor[] = [
  {
    id: 10,
    name: 'Medicine',
    slug: 'medicine',
    is_active: true,
    faculty: { id: 2, name: 'Health Faculty', slug: 'health-faculty' },
    academic_area: { id: 1, name: 'Health Sciences', slug: 'health-sciences' },
  },
  {
    id: 20,
    name: 'Software Engineering',
    slug: 'software-engineering',
    is_active: true,
    faculty: { id: 4, name: 'Engineering Faculty', slug: 'engineering-faculty' },
    academic_area: { id: 3, name: 'Engineering', slug: 'engineering' },
  },
  {
    id: 21,
    name: 'Computer Science',
    slug: 'computer-science',
    is_active: true,
    faculty: { id: 4, name: 'Engineering Faculty', slug: 'engineering-faculty' },
    academic_area: { id: 3, name: 'Engineering', slug: 'engineering' },
  },
]

describe('explore hierarchy model', () => {
  it('groups majors into area -> faculty -> major nodes', () => {
    const hierarchy = buildExploreHierarchy(majors)

    expect(hierarchy.groups.map((item) => item.label)).toEqual(['Engineering', 'Health Sciences'])
    expect(hierarchy.groups[0]?.children?.map((item) => item.label)).toEqual(['Engineering Faculty'])
    expect(hierarchy.groups[0]?.children?.[0]?.children?.map((item) => item.label)).toEqual([
      'Computer Science',
      'Software Engineering',
    ])
  })

  it('stores node metadata and first major fallback', () => {
    const hierarchy = buildExploreHierarchy(majors)

    expect(hierarchy.firstMajorNodeId).toBe('major-21')
    expect(hierarchy.nodesById['major-21']).toMatchObject({
      kind: 'major',
      majorId: 21,
      areaLabel: 'Engineering',
      facultyLabel: 'Engineering Faculty',
    })
  })

  it('keeps valid selection and falls back to first major when stale', () => {
    const hierarchy = buildExploreHierarchy(majors)

    expect(reconcileSelectedNode('major-20', hierarchy)).toBe('major-20')
    expect(reconcileSelectedNode('major-999', hierarchy)).toBe('major-21')
    expect(reconcileSelectedNode(null, hierarchy)).toBe('major-21')
  })
})

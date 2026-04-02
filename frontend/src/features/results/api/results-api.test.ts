import { describe, expect, it } from 'vitest'

import { buildResultsRequestParams } from './results-api'

describe('results api request params', () => {
  it('builds required process and pagination params', () => {
    expect(
      buildResultsRequestParams({
        processId: 9,
        academicAreaId: null,
        majorId: null,
        candidateName: '',
        page: 2,
      })
    ).toEqual({
      process_id: 9,
      page: 2,
      page_size: 20,
      sort_by: 'score',
      sort_order: 'desc',
    })
  })

  it('includes optional scope and candidate name filters', () => {
    expect(
      buildResultsRequestParams({
        processId: 4,
        academicAreaId: 3,
        majorId: 101,
        candidateName: '  ana maria ',
        page: 1,
      })
    ).toMatchObject({
      process_id: 4,
      academic_area_id: 3,
      major_id: 101,
      candidate_name: 'ana maria',
      page: 1,
    })
  })
})

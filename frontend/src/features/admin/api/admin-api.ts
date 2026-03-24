import { httpClient } from '../../../lib/api'

export type AdminArea = {
  id: number
  name: string
  slug: string
  updated_at: string
}

export type AdminFaculty = {
  id: number
  name: string
  slug: string
  academic_area_id: number
  updated_at: string
}

export type AdminMajor = {
  id: number
  name: string
  slug: string
  faculty_id: number
  is_active: boolean
  updated_at: string
}

export type AdminProcess = {
  id: number
  year: number
  cycle: string
  label: string
  is_published: boolean
  updated_at: string
}

export type BatchStatus = {
  batch_id: number
  total_items: number
  queued_items: number
  processing_items: number
  completed_items: number
  failed_items: number
  cancelled_items: number
}

export type BatchItem = {
  item_id: number
  status: string
  process_id: number
  filename: string
  source_file_id: number
  major_id: number
  total_rows: number
  imported_rows: number
  failed_rows: number
  failure_reason: string | null
  updated_at: string
}

export async function listAdminAreas() {
  const response = await httpClient.get<AdminArea[]>('/admin/areas')
  return response.data
}

export async function listAdminProcesses() {
  const response = await httpClient.get<AdminProcess[]>('/admin/processes')
  return response.data
}

export async function createAdminProcess(payload: {
  year: number
  cycle: string
  is_published: boolean
}) {
  const response = await httpClient.post<AdminProcess>('/admin/processes', payload)
  return response.data
}

export async function updateAdminProcess(
  processId: number,
  payload: {
    year: number
    cycle: string
    is_published: boolean
    version_token: string
  }
) {
  const response = await httpClient.put<AdminProcess>(`/admin/processes/${processId}`, payload)
  return response.data
}

export async function createAdminArea(payload: { name: string; slug: string }) {
  const response = await httpClient.post<AdminArea>('/admin/areas', payload)
  return response.data
}

export async function updateAdminArea(areaId: number, payload: { name: string; slug: string; version_token: string }) {
  const response = await httpClient.put<AdminArea>(`/admin/areas/${areaId}`, payload)
  return response.data
}

export async function listAdminFaculties() {
  const response = await httpClient.get<AdminFaculty[]>('/admin/faculties')
  return response.data
}

export async function createAdminFaculty(payload: { name: string; slug: string; academic_area_id: number }) {
  const response = await httpClient.post<AdminFaculty>('/admin/faculties', payload)
  return response.data
}

export async function updateAdminFaculty(
  facultyId: number,
  payload: { name: string; slug: string; academic_area_id: number; version_token: string }
) {
  const response = await httpClient.put<AdminFaculty>(`/admin/faculties/${facultyId}`, payload)
  return response.data
}

export async function listAdminMajors() {
  const response = await httpClient.get<AdminMajor[]>('/admin/majors')
  return response.data
}

export async function createAdminMajor(payload: {
  name: string
  slug: string
  faculty_id: number
  is_active: boolean
}) {
  const response = await httpClient.post<AdminMajor>('/admin/majors', payload)
  return response.data
}

export async function updateAdminMajor(
  majorId: number,
  payload: { name: string; slug: string; faculty_id: number; is_active: boolean; version_token: string }
) {
  const response = await httpClient.put<AdminMajor>(`/admin/majors/${majorId}`, payload)
  return response.data
}

export async function createResultsBatch(payload: {
  files: File[]
  defaultProcessId: number
  processOverrides: Record<string, number>
}) {
  const formData = new FormData()
  for (const file of payload.files) {
    formData.append('files', file)
  }
  formData.append('process_id', String(payload.defaultProcessId))
  if (Object.keys(payload.processOverrides).length > 0) {
    formData.append('process_overrides', JSON.stringify(payload.processOverrides))
  }

  const response = await httpClient.post<{ batch_id: number }>('/imports/results/batches', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export async function getBatchStatus(batchId: number) {
  const response = await httpClient.get<BatchStatus>(`/imports/results/batches/${batchId}`)
  return response.data
}

export async function listBatchItems(batchId: number) {
  const response = await httpClient.get<{ batch_id: number; items: BatchItem[] }>(`/imports/results/batches/${batchId}/items`)
  return response.data.items
}

export async function retryBatchItems(batchId: number) {
  const response = await httpClient.post<BatchStatus>(`/imports/results/batches/${batchId}/retry`)
  return response.data
}

export async function cancelBatchItems(batchId: number) {
  const response = await httpClient.post<BatchStatus>(`/imports/results/batches/${batchId}/cancel`)
  return response.data
}

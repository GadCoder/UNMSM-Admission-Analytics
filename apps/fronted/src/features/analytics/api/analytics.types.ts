export type AdmissionProcess = {
  id: number;
  year: number;
  sequence: string;
  name: string;
};

export type AcademicArea = { id: number; code: string; name: string };
export type Faculty = { id: number; code: string; name: string; academic_area_id: number };
export type Modality = { id: number; name: string };
export type MajorCatalogItem = { id: number; code: string; name: string; faculty_id: number };

export type MajorOverview = {
  major_id: number;
  major_code: string;
  major_name: string;
  total_results: number;
  admitted_count: number;
  absent_count: number;
  average_score: string | null;
  is_new: boolean;
};

export type ProcessMetrics = {
  process: AdmissionProcess;
  total_results: number;
  admitted_count: number;
  absent_count: number;
  average_score: string | null;
  highest_score: string | null;
  minimum_admitted_score?: number | null;
  admitted_score_modality_count?: number;
  admitted_score_modality?: string | null;
};

export type ProcessOverview = ProcessMetrics & { majors: MajorOverview[] };

export type ComparativeOverview = { processes: ProcessOverview[] };

export type MajorDetailProcess = ProcessMetrics;

export type ProcessHistoryItem = ProcessMetrics;
export type ProcessHistory = { processes: ProcessHistoryItem[] };

export type MajorDetail = {
  major: {
    id: number;
    code: string;
    name: string;
    faculty: string;
    academic_area: string;
    is_new: boolean;
  };
  selected_processes: MajorDetailProcess[];
  history: MajorDetailProcess[];
};

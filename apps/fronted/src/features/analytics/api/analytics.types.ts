export type AdmissionProcess = {
  id: number;
  year: number;
  sequence: string;
  name: string;
};

export type MajorOverview = {
  major_id: number;
  major_code: string;
  major_name: string;
  total_results: number;
  admitted_count: number;
  absent_count: number;
  average_score: string | null;
};

export type ProcessOverview = {
  process: AdmissionProcess;
  total_results: number;
  admitted_count: number;
  absent_count: number;
  average_score: string | null;
  highest_score: string | null;
  majors: MajorOverview[];
};

export type ComparativeOverview = {
  processes: ProcessOverview[];
};

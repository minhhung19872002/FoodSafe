export const POISONING_CASE_STATUS = {
  Draft: 1,
  Reported: 2,
  Verified: 3,
} as const;
export type PoisoningCaseStatus =
  (typeof POISONING_CASE_STATUS)[keyof typeof POISONING_CASE_STATUS];

export const POISONING_CASE_STATUS_CONFIG: Record<
  PoisoningCaseStatus,
  { color: string; label: string }
> = {
  [POISONING_CASE_STATUS.Draft]: { color: "default", label: "Nháp" },
  [POISONING_CASE_STATUS.Reported]: { color: "blue", label: "Đã báo cáo" },
  [POISONING_CASE_STATUS.Verified]: { color: "green", label: "Đã xác minh" },
};

export const POISONING_INCIDENT_STATUS = {
  Draft: 1,
  Reported: 2,
  Verified: 3,
  Concluded: 4,
} as const;
export type PoisoningIncidentStatus =
  (typeof POISONING_INCIDENT_STATUS)[keyof typeof POISONING_INCIDENT_STATUS];

export const POISONING_INCIDENT_STATUS_CONFIG: Record<
  PoisoningIncidentStatus,
  { color: string; label: string }
> = {
  [POISONING_INCIDENT_STATUS.Draft]: { color: "default", label: "Nháp" },
  [POISONING_INCIDENT_STATUS.Reported]: { color: "blue", label: "Đã báo cáo" },
  [POISONING_INCIDENT_STATUS.Verified]: {
    color: "green",
    label: "Đã xác minh",
  },
  [POISONING_INCIDENT_STATUS.Concluded]: {
    color: "purple",
    label: "Đã kết luận",
  },
};

export const CAUSE_ASSESSMENT = {
  Confirmed: 1,
  Probable: 2,
  Suspected: 3,
  Unknown: 4,
} as const;
export type CauseAssessment =
  (typeof CAUSE_ASSESSMENT)[keyof typeof CAUSE_ASSESSMENT];

export const CAUSE_ASSESSMENT_CONFIG: Record<
  CauseAssessment,
  { label: string }
> = {
  [CAUSE_ASSESSMENT.Confirmed]: { label: "Xác định" },
  [CAUSE_ASSESSMENT.Probable]: { label: "Có thể" },
  [CAUSE_ASSESSMENT.Suspected]: { label: "Nghi ngờ" },
  [CAUSE_ASSESSMENT.Unknown]: { label: "Chưa rõ" },
};

export const TREATMENT_RESULT = {
  Recovered: 1,
  Hospitalized: 2,
  Deceased: 3,
} as const;
export type TreatmentResult =
  (typeof TREATMENT_RESULT)[keyof typeof TREATMENT_RESULT];

export const TREATMENT_RESULT_CONFIG: Record<
  TreatmentResult,
  { color: string; label: string }
> = {
  [TREATMENT_RESULT.Recovered]: { color: "green", label: "Bình phục" },
  [TREATMENT_RESULT.Hospitalized]: { color: "orange", label: "Đang điều trị" },
  [TREATMENT_RESULT.Deceased]: { color: "red", label: "Tử vong" },
};

export const VICTIM_GENDER = {
  Male: 1,
  Female: 2,
  Other: 3,
} as const;
export type VictimGender = (typeof VICTIM_GENDER)[keyof typeof VICTIM_GENDER];

export const VICTIM_GENDER_CONFIG: Record<VictimGender, { label: string }> = {
  [VICTIM_GENDER.Male]: { label: "Nam" },
  [VICTIM_GENDER.Female]: { label: "Nữ" },
  [VICTIM_GENDER.Other]: { label: "Khác" },
};

export const ERROR_REPORT_STATUS = {
  Pending: 1,
  Acknowledged: 2,
  Corrected: 3,
} as const;
export type ErrorReportStatus =
  (typeof ERROR_REPORT_STATUS)[keyof typeof ERROR_REPORT_STATUS];

export const ERROR_REPORT_STATUS_CONFIG: Record<
  ErrorReportStatus,
  { color: string; label: string }
> = {
  [ERROR_REPORT_STATUS.Pending]: { color: "orange", label: "Chờ xử lý" },
  [ERROR_REPORT_STATUS.Acknowledged]: { color: "blue", label: "Đã tiếp nhận" },
  [ERROR_REPORT_STATUS.Corrected]: { color: "green", label: "Đã sửa" },
};

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export interface FoodPoisoningCase {
  id: string;
  organizationId: string;
  incidentId?: string;
  caseCode: string;
  reportDate: string;
  occurrenceDate?: string;

  locationDescription?: string;
  locationCommuneId?: string;
  locationDistrictId?: string;
  locationProvinceId?: string;
  locationLatitude?: number;
  locationLongitude?: number;

  victimName?: string;
  victimAge?: number;
  victimGender?: VictimGender;
  victimPhone?: string;
  victimAddress?: string;

  suspectedFood?: string;
  foodSource?: string;
  foodPreparationDate?: string;
  symptoms?: string;
  onsetTime?: string;

  medicalFacility?: string;
  treatmentStartDate?: string;
  treatmentResult?: TreatmentResult;

  reporterName?: string;
  reporterPhone?: string;
  reporterOrganization?: string;
  reporterRelation?: string;

  status: PoisoningCaseStatus;
  reportedById?: string;
  reportedAt?: string;
  verifiedById?: string;
  verifiedAt?: string;
  notes?: string;
  creationTime: string;
}

export interface CreateUpdateCaseInput {
  reportDate: string;
  occurrenceDate?: string;
  incidentId?: string;
  notes?: string;

  locationDescription: string;
  locationCommuneId?: string;
  locationDistrictId?: string;
  locationProvinceId?: string;
  locationLatitude?: number;
  locationLongitude?: number;

  victimName: string;
  victimAge?: number;
  victimGender?: VictimGender;
  victimPhone?: string;
  victimAddress?: string;

  suspectedFood?: string;
  foodSource?: string;
  foodPreparationDate?: string;
  symptoms?: string;
  onsetTime?: string;

  medicalFacility?: string;
  treatmentStartDate?: string;
  treatmentResult?: TreatmentResult;

  reporterName?: string;
  reporterPhone?: string;
  reporterOrganization?: string;
  reporterRelation?: string;
}

export interface CaseFilter {
  filter?: string;
  status?: PoisoningCaseStatus;
  reportDateFrom?: string;
  reportDateTo?: string;
  incidentId?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface FoodPoisoningIncident {
  id: string;
  organizationId: string;
  incidentCode: string;
  occurrenceDate?: string;
  endDate?: string;

  locationDescription?: string;
  locationCommuneId?: string;
  locationDistrictId?: string;
  locationProvinceId?: string;
  locationLatitude?: number;
  locationLongitude?: number;

  exposedCount: number;
  affectedCount: number;
  hospitalizedCount: number;
  deathCount: number;

  suspectedFood?: string;
  foodSource?: string;
  foodServiceType?: string;

  causeAssessmentValue?: CauseAssessment;
  causativeAgent?: string;
  pathogen?: string;

  investigationTeam?: string;
  controlMeasures?: string;
  preventionMeasures?: string;
  conclusion?: string;

  status: PoisoningIncidentStatus;
  reportedById?: string;
  reportedAt?: string;
  verifiedById?: string;
  verifiedAt?: string;
  concludedById?: string;
  concludedAt?: string;
  notes?: string;
  creationTime: string;
  caseCount: number;
}

export interface CreateUpdateIncidentInput {
  occurrenceDate: string;
  endDate?: string;
  notes?: string;

  locationDescription: string;
  locationCommuneId?: string;
  locationDistrictId?: string;
  locationProvinceId?: string;
  locationLatitude?: number;
  locationLongitude?: number;

  exposedCount: number;
  affectedCount: number;
  hospitalizedCount: number;
  deathCount: number;

  suspectedFood?: string;
  foodSource?: string;
  foodServiceType?: string;

  causeAssessmentValue?: CauseAssessment;
  causativeAgent?: string;
  pathogen?: string;

  investigationTeam?: string;
  controlMeasures?: string;
  preventionMeasures?: string;
}

export interface IncidentFilter {
  filter?: string;
  status?: PoisoningIncidentStatus;
  occurrenceDateFrom?: string;
  occurrenceDateTo?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface ConcludeIncidentInput {
  conclusion: string;
}

export interface PoisoningErrorReport {
  id: string;
  fromOrganizationId: string;
  errorDescription: string;
  correctionRequest: string;
  status: ErrorReportStatus;
  response?: string;
  respondedAt?: string;
  respondedById?: string;
  creationTime: string;
}

export interface CreateErrorReportInput {
  errorDescription: string;
  correctionRequest: string;
}

export interface RespondErrorReportInput {
  response: string;
}

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

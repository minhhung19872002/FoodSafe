export const TESTING_OUTCOME = {
  Pass: 1,
  Fail: 2,
  Conditional: 3,
} as const;
export type TestingOutcome =
  (typeof TESTING_OUTCOME)[keyof typeof TESTING_OUTCOME];

export const TESTING_OUTCOME_CONFIG: Record<
  TestingOutcome,
  { color: string; label: string }
> = {
  [TESTING_OUTCOME.Pass]: { color: "green", label: "Đạt" },
  [TESTING_OUTCOME.Fail]: { color: "red", label: "Không đạt" },
  [TESTING_OUTCOME.Conditional]: { color: "orange", label: "Có điều kiện" },
};

export interface PagedResult<T> {
  totalCount: number;
  items: T[];
}

export interface TestingResult {
  id: string;
  organizationId: string;
  sampleCode: string;
  sampleName: string;
  description: string | null;
  testingCenterId: string;
  testingCenterName: string | null;
  testingServiceId: string | null;
  testingServiceName: string | null;
  businessId: string | null;
  businessName: string | null;
  productId: string | null;
  productName: string | null;
  sampleDate: string;
  submissionDate: string | null;
  resultDate: string | null;
  outcome: TestingOutcome;
  failedCriteria: string | null;
  certificateNumber: string | null;
  inspectionResultId: string | null;
  isPublic: boolean;
  creationTime: string;
}

export interface CreateUpdateTestingResultInput {
  sampleCode: string;
  sampleName: string;
  description?: string;
  testingCenterId: string;
  testingServiceId?: string;
  businessId?: string;
  productId?: string;
  sampleDate: string;
  submissionDate?: string;
  resultDate?: string;
  outcome: TestingOutcome;
  failedCriteria?: string;
  certificateNumber?: string;
  inspectionResultId?: string;
  isPublic: boolean;
}

export interface TestingResultFilter {
  filter?: string;
  businessId?: string;
  testingCenterId?: string;
  outcome?: TestingOutcome;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

export interface CategoryCount {
  name: string;
  count: number;
}

export interface MonthlyCount {
  year: number;
  month: number;
  label: string;
  count: number;
}

export interface StatisticsDto {
  businessByStatus: CategoryCount[];
  businessByType: CategoryCount[];
  licenseByCategory: CategoryCount[];
  licenseByStatus: CategoryCount[];
  inspectionsByMonth: MonthlyCount[];
  violationsByMonth: MonthlyCount[];
  poisoningCasesByMonth: MonthlyCount[];
  inspectionOutcome: CategoryCount[];
}

export interface StatisticsFilter {
  year?: number;
  organizationId?: string;
}

export interface ExcelImportError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ExcelImportPreview {
  confirmationToken?: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  errors: ExcelImportError[];
}

export interface ExcelImportResult {
  importedCount: number;
}

export interface FileDownload {
  blob: Blob;
  fileName: string;
}

export interface lineContent {
  lineNumber: number;
  fileInputNameLine: string;
}

export interface PaginatedResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  items: lineContent[];
}

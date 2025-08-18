export interface lineContent {
  lineNumber: number;
  content: string;
}

export interface PaginatedResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  items: lineContent[];
}

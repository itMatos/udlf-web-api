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

export interface DirectoryItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
}

export interface DirectoryListing {
  currentPath: string;
  parentPath?: string;
  items: DirectoryItem[];
  totalItems: number;
}

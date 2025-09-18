export type FilenamesByClass = Record<string, string[]>;

export interface InputFileDetail {
  [inputFileName: string]: {
    class: string;
    lineIndexInInputFile: number;
  }
}

export interface InputFileIndex {
  [filename: string]: number;
}

/**
 * Represents the full filename of an entry.
 * Is the key used in the FileIndexMap.
 * @example "apple-1.gif"
 */
export type InputFilename = string;

/**
 * Represents the numeric index extracted from a list file.
 * Is the value used in the FileIndexMap.
 * @example 1
 */
export type FileIndexNumber = number;

/**
 * Associates the name of an input file (`InputFilename`)
 * with its corresponding index (`FileIndexNumber`).
 * Is used to map file names to their numeric indexes.
 */
export type FileNameToLineNumberMap = Map<InputFilename, FileIndexNumber>;

export type LineNumberToFileNameMap = Map<FileIndexNumber, InputFilename>;
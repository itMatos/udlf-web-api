import { FilenamesByClass, FileNameToLineNumberMap, InputFileDetail, LineNumberToFileNameMap } from "../types/file";

export class FileUtils {

  /**
   * Group the input filenames list by class.
   * @param contentClassList - Array of strings in the format "input-filename:class"
   * @returns An object where the keys are the class names and the values ​​are arrays of associated file names.
   */
  public static groupInputFilenamesByClass(contentClassList: string[]): FilenamesByClass {
    return contentClassList.reduce((acc: FilenamesByClass, line: string) => {
      const [filename, classname] = line.split(":");

      if (!filename || !classname) {
        return acc;
      }

      if (!acc[classname]) {
        acc[classname] = [];
      }
      
      acc[classname].push(filename);
      
      return acc;
    }, {});
  }

  public static mapInputFilenamesToLineNumber(contentFileList: string[]): FileNameToLineNumberMap {
    const fileIndexMap: FileNameToLineNumberMap = new Map();

    contentFileList.forEach((line: string, index: number) => {
      const filename = line.trim();
      if (filename) {
        fileIndexMap.set(filename, index + 1);
      }
    });

    return fileIndexMap;
  }

  public static mapInputLineNumbersFilenames(contentFileList: string[]): LineNumberToFileNameMap {
    const lineFileMap: LineNumberToFileNameMap = new Map();

    contentFileList.forEach((line: string, index: number) => {
      const lineNumber = index + 1;
      lineFileMap.set(lineNumber, line.trim());
    });

    return lineFileMap;
  }

  /**
 * Build the file details object by combining the class and index information.
 * @param groupedByClasses - An object mapping class names to arrays of file names.
 * @param fileIndexMap - A Map that associates file names with their line indices.
 * @returns An object containing the details of each input file.
 */
public static buildFileDetails(
  groupedByClasses: FilenamesByClass,
  fileIndexMap: FileNameToLineNumberMap
): InputFileDetail {
  const inputFileDetails: InputFileDetail = {};

  for (const [className, filenames] of Object.entries(groupedByClasses)) {
    for (const filename of filenames) {
      const lineIndexInInputFile = fileIndexMap.get(filename);

      if (lineIndexInInputFile !== undefined) {
        inputFileDetails[filename] = {
          class: className,
          lineIndexInInputFile: lineIndexInInputFile,
        };
      }
    }
  }

  return inputFileDetails;
}
}

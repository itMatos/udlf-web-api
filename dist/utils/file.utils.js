"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtils = void 0;
class FileUtils {
    /**
     * Group the input filenames list by class.
     * @param contentClassList - Array of strings in the format "input-filename:class"
     * @returns An object where the keys are the class names and the values ​​are arrays of associated file names.
     */
    static groupInputFilenamesByClass(contentClassList) {
        return contentClassList.reduce((acc, line) => {
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
    static mapInputFilenamesToLineNumber(contentFileList) {
        const fileIndexMap = new Map();
        contentFileList.forEach((line, index) => {
            const filename = line.trim();
            if (filename) {
                fileIndexMap.set(filename, index + 1);
            }
        });
        return fileIndexMap;
    }
    static mapInputLineNumbersFilenames(contentFileList) {
        const lineFileMap = new Map();
        contentFileList.forEach((line, index) => {
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
    static buildFileDetails(groupedByClasses, fileIndexMap) {
        const inputFileDetails = {};
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
exports.FileUtils = FileUtils;

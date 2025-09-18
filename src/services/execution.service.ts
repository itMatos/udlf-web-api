import { exec } from "child_process";
import { readSpecificLine } from "../utils/helpers";
import { paths } from "../config/paths";
import fs from "fs";
import { lineContent, PaginatedResponse } from "../types/interfaces";
import { FileUtils } from "../utils/file.utils";
import { FilenamesByClass, InputFileDetail } from "../types/file";

export class ExecutionService {
  public async execute(configFilePath: string): Promise<{ stdout: string; stderr: string }> {
    const executablePath = "/Users/italomatos/Documents/IC/udlf-api/src/udlf/bin/udlf";
    const outputDir = "/Users/italomatos/Documents/IC/udlf-api/outputs";

    return new Promise((resolve, reject) => {
      exec(`${executablePath} ${configFilePath}`, { cwd: outputDir }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          reject({ error: "Failed to execute command", details: error.message });
          return;
        }

        console.log(`Command output: ${stdout}`);
        console.error(`Command error output: ${stderr}`);

        resolve({ stdout, stderr });
      });
    });
  }

  public async getFileNameByIndex(index: number): Promise<string> {
    await fs.promises.access(paths.datasetList, fs.constants.F_OK);
    const lineNumberToAccess = index + 1;
    const lineContent = await readSpecificLine(paths.datasetList, lineNumberToAccess);
    if (lineContent === null) {
      throw new Error(`Index ${index} not found in the list file.`);
    }
    return lineContent;
  }

  public async getListFilesByPage(pageIndex: number, pageSize: number): Promise<PaginatedResponse> {
    await fs.promises.access(paths.datasetList, fs.constants.F_OK);
    const fileContent = await fs.promises.readFile(paths.datasetList, "utf-8");
    const allFiles = fileContent.split("\n").filter(Boolean);
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;

    const items = allFiles.slice(start, end).map((fileInputNameLine, index) => ({
      lineNumber: start + index + 1,
      fileInputNameLine,
    }));

    return {
      totalItems: allFiles.length,
      totalPages: Math.ceil(allFiles.length / pageSize),
      currentPage: pageIndex,
      pageSize,
      items,
    };
  }

  public async getAllInputNames(): Promise<string[]> {
    await fs.promises.access(paths.datasetList, fs.constants.F_OK);
    const fileContent = await fs.promises.readFile(paths.datasetList, "utf-8");
    return fileContent.split("\n").filter(Boolean);
  }

  public async allFilenamesByClasses(): Promise<FilenamesByClass> {
    await fs.promises.access(paths.classList, fs.constants.F_OK);
    const contentClassList = await fs.promises.readFile(paths.classList, "utf-8");
    const allNames = contentClassList.split("\n").filter(Boolean);

    const groupedByClasses = FileUtils.groupInputFilenamesByClass(allNames);
    return groupedByClasses;
  }

  public async inputFileDetailsByName(): Promise<InputFileDetail> {
    await fs.promises.access(paths.classList, fs.constants.F_OK);
    const contentListFile = await fs.promises.readFile(paths.datasetList, "utf-8");
    const contentClassList = await fs.promises.readFile(paths.classList, "utf-8");
    const allInputNames = contentListFile.split("\n").filter(Boolean);
    const allNames = contentClassList.split("\n").filter(Boolean);

    const fileIndexMap = FileUtils.mapInputFilenamesToLineNumber(allInputNames);
    const groupedByClasses = FileUtils.groupInputFilenamesByClass(allNames);

    const inputFileDetails: InputFileDetail = FileUtils.buildFileDetails(groupedByClasses, fileIndexMap);
    
    return inputFileDetails;
  }

  public async getInputNameByIndexList(indexList: number[]): Promise<lineContent[]> {
    await fs.promises.access(paths.datasetList, fs.constants.F_OK);
    const fileContent = await fs.promises.readFile(paths.datasetList, "utf-8");
    const allFiles = fileContent.split("\n").filter(Boolean);

    const result: lineContent[] = [];

    for (const index of indexList) {
      const lineNumberToAccess = index + 1;
      if (lineNumberToAccess < 1 || lineNumberToAccess > allFiles.length) {
        throw new Error(`Index ${index} is out of bounds.`);
      }
      const fileInputNameLine = allFiles[lineNumberToAccess - 1];
      result.push({ lineNumber: lineNumberToAccess, fileInputNameLine });
    }

    return result;
  }

  public async getInputFileDetailsByLineNumbers(lineNumbers: number[]): Promise<InputFileDetail> {
    await fs.promises.access(paths.classList, fs.constants.F_OK);
    await fs.promises.access(paths.datasetList, fs.constants.F_OK);
    const contentListFile = await fs.promises.readFile(paths.datasetList, "utf-8");
    const contentClassList = await fs.promises.readFile(paths.classList, "utf-8");

    // [apple-1.gif, apple-2.gif, ...]
    const allInputNames = contentListFile.split("\n").filter(Boolean);
    const allNamesByClasses = contentClassList.split("\n").filter(Boolean);

    const fileIndexMap = FileUtils.mapInputFilenamesToLineNumber(allInputNames);
    const lineFileMap = FileUtils.mapInputLineNumbersFilenames(allInputNames);

    const groupedByClasses = FileUtils.groupInputFilenamesByClass(allNamesByClasses);

    const fullInputFileDetails: InputFileDetail = FileUtils.buildFileDetails(groupedByClasses, fileIndexMap);

    const filtered: InputFileDetail = {};
    for (const lineNumber of lineNumbers) {
      const filename = lineFileMap.get(lineNumber);
      if (filename && fullInputFileDetails[filename]) {
        filtered[filename] = fullInputFileDetails[filename];
      } else {
        console.warn(`No details found for line number ${lineNumber}`);
      }
    }

    return filtered;
  }
}

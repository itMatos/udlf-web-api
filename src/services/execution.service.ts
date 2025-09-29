import { spawn } from "child_process";
import { readSpecificLine } from "../utils/helpers";
import { paths } from "../config/paths";
import fs from "fs";
import { lineContent, PaginatedResponse } from "../types/interfaces";
import { FileUtils } from "../utils/file.utils";
import { FilenamesByClass, InputFileDetail } from "../types/file";
import { ConfigParser, ConfigPaths } from "../utils/config-parser";

const executablePathDocker = "/app/udlf/bin/udlf" as const;
const outputDirDocker = "/app/outputs" as const;

export class ExecutionService {
  private configPaths: ConfigPaths | null = null;

  /**
   * Load dynamic paths from config file
   */
  public async loadConfigPaths(configFilePath: string): Promise<ConfigPaths> {
    // Always load fresh paths for the specific config file
    // This ensures we don't use cached paths from previous executions
    this.configPaths = await ConfigParser.getDynamicPaths(configFilePath);
    return this.configPaths;
  }

  public async execute(configFilePath: string): Promise<{ stdout: string; stderr: string }> {
    const executablePath = executablePathDocker;
    const outputDir = outputDirDocker;

    return new Promise((resolve, reject) => {
      const child = spawn(executablePath, [configFilePath], {
        cwd: outputDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      // Captura stdout
      child.stdout?.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`Command output: ${output}`);
      });

      // Captura stderr
      child.stderr?.on("data", (data) => {
        const error = data.toString();
        stderr += error;
        console.error(`Command error output: ${error}`);
      });

      // Evento de finalização
      child.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject({
            error: "Command failed",
            details: `Process exited with code ${code}`,
            stdout,
            stderr,
          });
        }
      });

      // Evento de erro
      child.on("error", (error) => {
        console.error(`Error executing command: ${error.message}`);
        reject({
          error: "Failed to execute command",
          details: error.message,
          stdout,
          stderr,
        });
      });
    });
  }

  public async getFileNameByIndex(index: number, configFilePath: string): Promise<string> {
    const dynamicPaths = await this.loadConfigPaths(configFilePath);
    const datasetListPath = dynamicPaths.datasetList;

    await fs.promises.access(datasetListPath, fs.constants.F_OK);
    const lineNumberToAccess = index + 1;
    const lineContent = await readSpecificLine(datasetListPath, lineNumberToAccess);
    if (lineContent === null) {
      throw new Error(`Index ${index} not found in the list file.`);
    }
    return lineContent;
  }

  public async getListFilesByPage(pageIndex: number, pageSize: number, configFilePath: string): Promise<PaginatedResponse> {
    const dynamicPaths = await this.loadConfigPaths(configFilePath);
    const datasetListPath = dynamicPaths.datasetList;
    console.log("dynamicPaths:", dynamicPaths);
    console.log(`Using dataset list path: ${datasetListPath}`);
    console.log(`Requested pageIndex: ${pageIndex}, pageSize: ${pageSize}`);

    await fs.promises.access(datasetListPath, fs.constants.F_OK);
    const fileContent = await fs.promises.readFile(datasetListPath, "utf-8");
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

  public async getAllInputNames(configFilePath?: string): Promise<string[]> {
    const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
    const datasetListPath = dynamicPaths?.datasetList || paths.datasetList;

    await fs.promises.access(datasetListPath, fs.constants.F_OK);
    const fileContent = await fs.promises.readFile(datasetListPath, "utf-8");
    return fileContent.split("\n").filter(Boolean);
  }

  public async allFilenamesByClasses(configFilePath?: string): Promise<FilenamesByClass> {
    const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
    const classListPath = dynamicPaths?.classList || paths.classList;

    await fs.promises.access(classListPath, fs.constants.F_OK);
    const contentClassList = await fs.promises.readFile(classListPath, "utf-8");
    const allNames = contentClassList.split("\n").filter(Boolean);

    const groupedByClasses = FileUtils.groupInputFilenamesByClass(allNames);
    return groupedByClasses;
  }

  public async inputFileDetailsByName(configFilePath?: string): Promise<InputFileDetail> {
    const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
    const datasetListPath = dynamicPaths?.datasetList || paths.datasetList;
    const classListPath = dynamicPaths?.classList || paths.classList;

    await fs.promises.access(classListPath, fs.constants.F_OK);
    const contentListFile = await fs.promises.readFile(datasetListPath, "utf-8");
    const contentClassList = await fs.promises.readFile(classListPath, "utf-8");
    const allInputNames = contentListFile.split("\n").filter(Boolean);
    const allNames = contentClassList.split("\n").filter(Boolean);

    const fileIndexMap = FileUtils.mapInputFilenamesToLineNumber(allInputNames);
    const groupedByClasses = FileUtils.groupInputFilenamesByClass(allNames);

    const inputFileDetails: InputFileDetail = FileUtils.buildFileDetails(groupedByClasses, fileIndexMap);

    return inputFileDetails;
  }

  public async getInputNameByIndexList(indexList: number[], configFilePath?: string): Promise<lineContent[]> {
    const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
    const datasetListPath = dynamicPaths?.datasetList || paths.datasetList;

    await fs.promises.access(datasetListPath, fs.constants.F_OK);
    const fileContent = await fs.promises.readFile(datasetListPath, "utf-8");
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

  public async getInputFileDetailsByLineNumbers(lineNumbers: number[], configFilePath?: string): Promise<InputFileDetail> {
    const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
    const datasetListPath = dynamicPaths?.datasetList || paths.datasetList;
    const classListPath = dynamicPaths?.classList || paths.classList;

    await fs.promises.access(classListPath, fs.constants.F_OK);
    await fs.promises.access(datasetListPath, fs.constants.F_OK);
    const contentListFile = await fs.promises.readFile(datasetListPath, "utf-8");
    const contentClassList = await fs.promises.readFile(classListPath, "utf-8");

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

  public async getLineNumberByImageName(imageName: string, configFilePath?: string): Promise<{ imageName: string; lineNumber: number }> {
    const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
    const datasetListPath = dynamicPaths?.datasetList || paths.datasetList;

    await fs.promises.access(datasetListPath, fs.constants.F_OK);
    const fileContent = await fs.promises.readFile(datasetListPath, "utf-8");
    const allFiles = fileContent.split("\n").filter(Boolean);

    for (let i = 0; i < allFiles.length; i++) {
      if (allFiles[i].trim() === imageName.trim()) {
        return { imageName, lineNumber: i + 1 };
      }
    }

    throw new Error(`Image name ${imageName} not found in file.`);
  }
}

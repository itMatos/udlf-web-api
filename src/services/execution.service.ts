import { exec } from "child_process";
import { readSpecificLine } from "../utils/helpers";
import { paths } from "../config/paths";
import fs from "fs";
import { PaginatedResponse } from "../types/interfaces";

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

    const items = allFiles.slice(start, end).map((content, index) => ({
      lineNumber: start + index + 1,
      content,
    }));

    return {
      totalItems: allFiles.length,
      totalPages: Math.ceil(allFiles.length / pageSize),
      currentPage: pageIndex,
      pageSize,
      items,
    };
  }
}

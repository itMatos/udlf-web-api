"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionService = void 0;
const child_process_1 = require("child_process");
const helpers_1 = require("../utils/helpers");
const paths_1 = require("../config/paths");
const fs_1 = __importDefault(require("fs"));
const file_utils_1 = require("../utils/file.utils");
const config_parser_1 = require("../utils/config-parser");
const executablePathDocker = "/app/udlf/bin/udlf";
const outputDirDocker = "/app/outputs";
class ExecutionService {
    constructor() {
        this.configPaths = null;
    }
    /**
     * Load dynamic paths from config file
     */
    async loadConfigPaths(configFilePath) {
        // Always load fresh paths for the specific config file
        // This ensures we don't use cached paths from previous executions
        this.configPaths = await config_parser_1.ConfigParser.getDynamicPaths(configFilePath);
        return this.configPaths;
    }
    async execute(configFilePath) {
        const executablePath = executablePathDocker;
        const outputDir = outputDirDocker;
        return new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(executablePath, [configFilePath], {
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
                }
                else {
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
    async getFileNameByIndex(index, configFilePath) {
        const dynamicPaths = await this.loadConfigPaths(configFilePath);
        const datasetListPath = dynamicPaths.datasetList;
        await fs_1.default.promises.access(datasetListPath, fs_1.default.constants.F_OK);
        const lineNumberToAccess = index + 1;
        const lineContent = await (0, helpers_1.readSpecificLine)(datasetListPath, lineNumberToAccess);
        if (lineContent === null) {
            throw new Error(`Index ${index} not found in the list file.`);
        }
        return lineContent;
    }
    async getListFilesByPage(pageIndex, pageSize, configFilePath) {
        const dynamicPaths = await this.loadConfigPaths(configFilePath);
        const datasetListPath = dynamicPaths.datasetList;
        console.log("dynamicPaths:", dynamicPaths);
        console.log(`Using dataset list path: ${datasetListPath}`);
        console.log(`Requested pageIndex: ${pageIndex}, pageSize: ${pageSize}`);
        await fs_1.default.promises.access(datasetListPath, fs_1.default.constants.F_OK);
        const fileContent = await fs_1.default.promises.readFile(datasetListPath, "utf-8");
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
    async getAllInputNames(configFilePath) {
        const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
        const datasetListPath = dynamicPaths?.datasetList || paths_1.paths.datasetList;
        await fs_1.default.promises.access(datasetListPath, fs_1.default.constants.F_OK);
        const fileContent = await fs_1.default.promises.readFile(datasetListPath, "utf-8");
        return fileContent.split("\n").filter(Boolean);
    }
    async allFilenamesByClasses(configFilePath) {
        const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
        const classListPath = dynamicPaths?.classList || paths_1.paths.classList;
        await fs_1.default.promises.access(classListPath, fs_1.default.constants.F_OK);
        const contentClassList = await fs_1.default.promises.readFile(classListPath, "utf-8");
        const allNames = contentClassList.split("\n").filter(Boolean);
        const groupedByClasses = file_utils_1.FileUtils.groupInputFilenamesByClass(allNames);
        return groupedByClasses;
    }
    async inputFileDetailsByName(configFilePath) {
        const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
        const datasetListPath = dynamicPaths?.datasetList || paths_1.paths.datasetList;
        const classListPath = dynamicPaths?.classList || paths_1.paths.classList;
        await fs_1.default.promises.access(classListPath, fs_1.default.constants.F_OK);
        const contentListFile = await fs_1.default.promises.readFile(datasetListPath, "utf-8");
        const contentClassList = await fs_1.default.promises.readFile(classListPath, "utf-8");
        const allInputNames = contentListFile.split("\n").filter(Boolean);
        const allNames = contentClassList.split("\n").filter(Boolean);
        const fileIndexMap = file_utils_1.FileUtils.mapInputFilenamesToLineNumber(allInputNames);
        const groupedByClasses = file_utils_1.FileUtils.groupInputFilenamesByClass(allNames);
        const inputFileDetails = file_utils_1.FileUtils.buildFileDetails(groupedByClasses, fileIndexMap);
        return inputFileDetails;
    }
    async getInputNameByIndexList(indexList, configFilePath) {
        const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
        const datasetListPath = dynamicPaths?.datasetList || paths_1.paths.datasetList;
        await fs_1.default.promises.access(datasetListPath, fs_1.default.constants.F_OK);
        const fileContent = await fs_1.default.promises.readFile(datasetListPath, "utf-8");
        const allFiles = fileContent.split("\n").filter(Boolean);
        const result = [];
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
    async getInputFileDetailsByLineNumbers(lineNumbers, configFilePath) {
        const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
        const datasetListPath = dynamicPaths?.datasetList || paths_1.paths.datasetList;
        const classListPath = dynamicPaths?.classList || paths_1.paths.classList;
        await fs_1.default.promises.access(classListPath, fs_1.default.constants.F_OK);
        await fs_1.default.promises.access(datasetListPath, fs_1.default.constants.F_OK);
        const contentListFile = await fs_1.default.promises.readFile(datasetListPath, "utf-8");
        const contentClassList = await fs_1.default.promises.readFile(classListPath, "utf-8");
        // [apple-1.gif, apple-2.gif, ...]
        const allInputNames = contentListFile.split("\n").filter(Boolean);
        const allNamesByClasses = contentClassList.split("\n").filter(Boolean);
        const fileIndexMap = file_utils_1.FileUtils.mapInputFilenamesToLineNumber(allInputNames);
        const lineFileMap = file_utils_1.FileUtils.mapInputLineNumbersFilenames(allInputNames);
        const groupedByClasses = file_utils_1.FileUtils.groupInputFilenamesByClass(allNamesByClasses);
        const fullInputFileDetails = file_utils_1.FileUtils.buildFileDetails(groupedByClasses, fileIndexMap);
        const filtered = {};
        for (const lineNumber of lineNumbers) {
            const filename = lineFileMap.get(lineNumber);
            if (filename && fullInputFileDetails[filename]) {
                filtered[filename] = fullInputFileDetails[filename];
            }
            else {
                console.warn(`No details found for line number ${lineNumber}`);
            }
        }
        return filtered;
    }
    async getLineNumberByImageName(imageName, configFilePath) {
        const dynamicPaths = configFilePath ? await this.loadConfigPaths(configFilePath) : null;
        const datasetListPath = dynamicPaths?.datasetList || paths_1.paths.datasetList;
        await fs_1.default.promises.access(datasetListPath, fs_1.default.constants.F_OK);
        const fileContent = await fs_1.default.promises.readFile(datasetListPath, "utf-8");
        const allFiles = fileContent.split("\n").filter(Boolean);
        for (let i = 0; i < allFiles.length; i++) {
            if (allFiles[i].trim() === imageName.trim()) {
                return { imageName, lineNumber: i + 1 };
            }
        }
        throw new Error(`Image name ${imageName} not found in file.`);
    }
}
exports.ExecutionService = ExecutionService;

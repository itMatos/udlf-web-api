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
const executablePathDocker = "/app/udlf/bin/udlf";
const outputDirDocker = "/app/outputs";
class ExecutionService {
    async execute(configFilePath) {
        const executablePath = executablePathDocker;
        const outputDir = outputDirDocker;
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`${executablePath} ${configFilePath}`, { cwd: outputDir }, (error, stdout, stderr) => {
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
    async getFileNameByIndex(index) {
        await fs_1.default.promises.access(paths_1.paths.datasetList, fs_1.default.constants.F_OK);
        const lineNumberToAccess = index + 1;
        const lineContent = await (0, helpers_1.readSpecificLine)(paths_1.paths.datasetList, lineNumberToAccess);
        if (lineContent === null) {
            throw new Error(`Index ${index} not found in the list file.`);
        }
        return lineContent;
    }
    async getListFilesByPage(pageIndex, pageSize) {
        await fs_1.default.promises.access(paths_1.paths.datasetList, fs_1.default.constants.F_OK);
        const fileContent = await fs_1.default.promises.readFile(paths_1.paths.datasetList, "utf-8");
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
    async getAllInputNames() {
        await fs_1.default.promises.access(paths_1.paths.datasetList, fs_1.default.constants.F_OK);
        const fileContent = await fs_1.default.promises.readFile(paths_1.paths.datasetList, "utf-8");
        return fileContent.split("\n").filter(Boolean);
    }
    async allFilenamesByClasses() {
        await fs_1.default.promises.access(paths_1.paths.classList, fs_1.default.constants.F_OK);
        const contentClassList = await fs_1.default.promises.readFile(paths_1.paths.classList, "utf-8");
        const allNames = contentClassList.split("\n").filter(Boolean);
        const groupedByClasses = file_utils_1.FileUtils.groupInputFilenamesByClass(allNames);
        return groupedByClasses;
    }
    async inputFileDetailsByName() {
        await fs_1.default.promises.access(paths_1.paths.classList, fs_1.default.constants.F_OK);
        const contentListFile = await fs_1.default.promises.readFile(paths_1.paths.datasetList, "utf-8");
        const contentClassList = await fs_1.default.promises.readFile(paths_1.paths.classList, "utf-8");
        const allInputNames = contentListFile.split("\n").filter(Boolean);
        const allNames = contentClassList.split("\n").filter(Boolean);
        const fileIndexMap = file_utils_1.FileUtils.mapInputFilenamesToLineNumber(allInputNames);
        const groupedByClasses = file_utils_1.FileUtils.groupInputFilenamesByClass(allNames);
        const inputFileDetails = file_utils_1.FileUtils.buildFileDetails(groupedByClasses, fileIndexMap);
        return inputFileDetails;
    }
    async getInputNameByIndexList(indexList) {
        await fs_1.default.promises.access(paths_1.paths.datasetList, fs_1.default.constants.F_OK);
        const fileContent = await fs_1.default.promises.readFile(paths_1.paths.datasetList, "utf-8");
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
    async getInputFileDetailsByLineNumbers(lineNumbers) {
        await fs_1.default.promises.access(paths_1.paths.classList, fs_1.default.constants.F_OK);
        await fs_1.default.promises.access(paths_1.paths.datasetList, fs_1.default.constants.F_OK);
        const contentListFile = await fs_1.default.promises.readFile(paths_1.paths.datasetList, "utf-8");
        const contentClassList = await fs_1.default.promises.readFile(paths_1.paths.classList, "utf-8");
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
}
exports.ExecutionService = ExecutionService;

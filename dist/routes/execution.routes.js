"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const execution_service_1 = require("../services/execution.service");
const execution_controller_1 = require("../controllers/execution.controller");
const dynamic_paths_service_1 = require("../services/dynamic-paths.service");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const helpers_1 = require("../utils/helpers");
const router = (0, express_1.Router)();
const executionService = new execution_service_1.ExecutionService();
const executionController = new execution_controller_1.ExecutionController(executionService);
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, "uploads/");
    },
    filename: (_req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage });
const uploadsDirDocker = "/app/uploads";
router.get("/", (_req, res) => {
    res.json({
        message: "UDLF Server is running",
        timestamp: new Date().toISOString(),
        status: "OK",
    });
});
router.get("/download-output/:filename", (req, res) => {
    const { filename } = req.params;
    const outputdir = "/Users/italomatos/Documents/IC/udlf-api/outputs";
    const filePath = path_1.default.join(outputdir, filename);
    fs_1.default.access(filePath, fs_1.default.constants.F_OK, (err) => {
        if (err) {
            console.error(`File not found: ${filePath}`);
            res.status(404).json({ error: "Output file not found" });
            return;
        }
        if (!res.headersSent) {
            res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            res.setHeader("Content-Type", "application/octet-stream");
        }
        res.download(filePath, (downloadErr) => {
            if (downloadErr) {
                console.error(`Error downloading file: ${downloadErr}`);
                res.status(500).json({ error: "Error downloading output file" });
            }
            else {
                console.log(`File downloaded successfully: ${filename}`);
            }
        });
    });
});
router.post("/upload-file", upload.single("config_file"), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    console.log(`File uploaded: ${req.file.originalname}`);
    res.json({
        message: "File uploaded successfully",
        filename: req.file.filename,
        originalname: req.file.originalname,
    });
});
router.get("/execute/:filename", (req, res) => {
    const filename = req.params.filename;
    if (!filename) {
        res.status(400).json({ error: "File name is required" });
        return;
    }
    executionController.execute(filename, res);
});
router.get("/output-file/:filename", (req, res) => {
    const { filename } = req.params;
    const outputdir = "/Users/italomatos/Documents/IC/udlf-api/outputs";
    const filePath = path_1.default.join(outputdir, filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Error sending file ${filename}:`, err);
            if (!res.headersSent) {
                res.status(404).json({ error: "File not found" });
            }
        }
    });
});
router.get("/file-input-name-by-index", async (req, res) => {
    const { indexList, configFile } = req.query;
    const indexes = String(indexList).split(",").map(Number);
    try {
        const configFilePath = configFile ? path_1.default.join(uploadsDirDocker, configFile) : undefined;
        const result = await executionService.getInputNameByIndexList(indexes, configFilePath);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(`Error processing request for file indexes ${indexes}:`, error);
        res.status(500).json({ error: "Internal server error while trying to read the file." });
    }
});
router.get("/file-input-details-by-line-numbers", async (req, res) => {
    const { lineNumbers, configFile } = req.query;
    const indexes = String(lineNumbers).split(",").map(Number);
    try {
        const configFilePath = configFile ? path_1.default.join(uploadsDirDocker, configFile) : undefined;
        const result = await executionService.getInputFileDetailsByLineNumbers(indexes, configFilePath);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(`Error processing request for file line numbers ${indexes}:`, error);
        res.status(500).json({ error: "Internal server error while trying to read the file." });
    }
});
router.get("/teste/get-line-by-image-name/:imageName", async (req, res) => {
    const { imageName } = req.params;
    const { configFile } = req.query;
    try {
        const executionService = new execution_service_1.ExecutionService();
        const configFilePath = configFile ? path_1.default.join(uploadsDirDocker, configFile) : undefined;
        const result = await executionService.getLineNumberByImageName(imageName, configFilePath);
        res.status(200).json(result);
    }
    catch (error) {
        if (error.message && error.message.includes("not found")) {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error(`Error processing request for image name ${imageName}:`, error);
        res.status(500).json({ error: "Internal server error while trying to read the file." });
    }
});
router.get("/image-file/:imageName", (req, res) => {
    const { imageName } = req.params;
    console.log("Requested image:", imageName);
    const { configFile } = req.query;
    const configFilePath = configFile ? path_1.default.join(uploadsDirDocker, configFile) : undefined;
    console.log("Config file path:", configFilePath);
    if (!configFilePath) {
        res.status(400).json({ error: "Config file is required for this endpoint" });
        return;
    }
    dynamic_paths_service_1.DynamicPathsService.getPathsForConfig(configFilePath)
        .then((dynamicPaths) => {
        const imagePath = path_1.default.join(dynamicPaths.datasetImages, imageName);
        // Verifica se o arquivo existe
        return fs_1.default.promises.access(imagePath, fs_1.default.constants.F_OK).then(() => {
            // Envia o arquivo de imagem
            res.sendFile(imagePath, (err) => {
                if (err) {
                    console.error(`Error sending image file: ${err}`);
                    res.status(500).json({ error: "Error sending image file" });
                }
            });
        });
    })
        .catch((err) => {
        console.error(`File not found: ${err}`);
        res.status(404).json({ error: "Image file not found" });
    });
});
router.get("/outputs/:filename/line/:line", async (req, res) => {
    const { filename, line } = req.params;
    const outputdir = "/app/outputs";
    console.log(`Request to read line ${line} from file ${filename} in directory ${outputdir}`);
    const filePath = path_1.default.join(outputdir, filename);
    const lineNumber = parseInt(line, 10);
    // 1. Validação do número da linha
    if (isNaN(lineNumber) || lineNumber < 1) {
        res.status(400).json({ error: "Invalid line number. Must be a positive integer." });
        return;
    }
    try {
        // 2. Verificar se o arquivo existe e é acessível
        await fs_1.default.promises.access(filePath, fs_1.default.constants.F_OK); // Usando promises para await fs.access
        // 3. Chamar a função para ler a linha específica
        const lineContent = await (0, helpers_1.readSpecificLine)(filePath, lineNumber);
        if (lineContent !== null) {
            // Verifique se a linha foi encontrada (não é null)
            res.status(200).json({ line: lineNumber, lineContent: lineContent });
        }
        else {
            // Se a linha não foi encontrada (lineNumber > total de linhas)
            res.status(404).json({ error: `Line number ${lineNumber} not found in file ${filename}.` });
        }
    }
    catch (error) {
        // Tratar erros de arquivo não encontrado ou inacessível
        if (error.code === "ENOENT") {
            // "Error No Entry" - arquivo não encontrado
            res.status(404).json({ error: "File not found." });
            return;
        }
        console.error(`Error processing request for file ${filename}, line ${lineNumber}:`, error);
        res.status(500).json({ error: "Internal server error while trying to read the file." });
    }
});
router.get("/paginated-file-list/:filename/page/:pageIndex", async (req, res) => {
    const { filename, pageIndex } = req.params;
    const { pageSize, configFile } = req.query;
    const pageIndexNumber = parseInt(pageIndex, 10);
    const pageSizeNumber = parseInt(pageSize, 10) || 10;
    try {
        // Use dynamic paths if configFile is provided, otherwise use defaults
        const configFilePath = path_1.default.join(uploadsDirDocker, configFile);
        const files = await executionService.getListFilesByPage(pageIndexNumber, pageSizeNumber, configFilePath);
        res.status(200).json(files);
    }
    catch (error) {
        console.error(`Error fetching files for ${filename}, page ${pageIndexNumber}:`, error);
        res.status(500).json({ error: "Internal server error while trying to fetch files." });
    }
});
router.get("/get-all-input-file-names", async (req, res) => {
    const { configFile } = req.query;
    try {
        const configFilePath = configFile ? path_1.default.join(uploadsDirDocker, configFile) : undefined;
        const files = await executionService.getAllInputNames(configFilePath);
        res.status(200).json(files);
    }
    catch (error) {
        console.error("Error fetching all input file names:", error);
        res.status(500).json({ error: "Internal server error while trying to fetch all input file names." });
    }
});
// New route specifically for config-based file lists
router.get("/paginated-file-list-by-config/:configFileName/page/:pageIndex", async (req, res) => {
    const { configFileName, pageIndex } = req.params;
    const { pageSize } = req.query;
    const pageIndexNumber = parseInt(pageIndex, 10);
    const pageSizeNumber = parseInt(pageSize, 10) || 10;
    const configFilePath = path_1.default.join(uploadsDirDocker, configFileName);
    try {
        const files = await executionService.getListFilesByPage(pageIndexNumber, pageSizeNumber, configFilePath);
        res.status(200).json(files);
    }
    catch (error) {
        console.error(`Error fetching files for config ${configFileName}, page ${pageIndexNumber}:`, error);
        res.status(500).json({ error: "Internal server error while trying to fetch files." });
    }
});
// TODO: o parâmetro deve ser o nome do arquivo config
// /get-grouped-class-names/:configFileName
router.get("/grouped-input-class-names", async (req, res) => {
    const { configFile } = req.query;
    try {
        const configFilePath = configFile ? path_1.default.join(uploadsDirDocker, configFile) : undefined;
        const classNames = await executionService.allFilenamesByClasses(configFilePath);
        res.status(200).json(classNames);
    }
    catch (error) {
        console.error("Error fetching all class names:", error);
        res.status(500).json({ error: "Internal server error while trying to fetch all class names." });
    }
});
router.get("/input-file-details-by-name", async (req, res) => {
    const { configFile } = req.query;
    try {
        const configFilePath = configFile ? path_1.default.join(uploadsDirDocker, configFile) : undefined;
        const inputFileDetails = await executionService.inputFileDetailsByName(configFilePath);
        res.status(200).json(inputFileDetails);
    }
    catch (error) {
        console.error("Error fetching input file details:", error);
        res.status(500).json({ error: "Internal server error while trying to fetch input file details." });
    }
});
// New route that uses dynamic paths based on config file
router.get("/dynamic-paths/:configFileName", async (req, res) => {
    const { configFileName } = req.params;
    const configFilePath = path_1.default.join(uploadsDirDocker, configFileName);
    try {
        const dynamicPaths = await dynamic_paths_service_1.DynamicPathsService.getPathsForConfig(configFilePath);
        res.status(200).json({
            success: true,
            data: dynamicPaths,
        });
    }
    catch (error) {
        console.error("Error fetching dynamic paths:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error while trying to fetch dynamic paths.",
        });
    }
});
// Updated route that uses dynamic paths for specific config
router.get("/grouped-input-class-names/:configFileName", async (req, res) => {
    const { configFileName } = req.params;
    const configFilePath = path_1.default.join(uploadsDirDocker, configFileName);
    try {
        const classNames = await executionService.allFilenamesByClasses(configFilePath);
        res.status(200).json(classNames);
    }
    catch (error) {
        console.error("Error fetching class names for config:", error);
        res.status(500).json({ error: "Internal server error while trying to fetch class names." });
    }
});
// Route to clear cache for a specific config file
router.post("/clear-cache", async (req, res) => {
    const { configFileName } = req.body;
    try {
        if (configFileName) {
            const configFilePath = path_1.default.join(uploadsDirDocker, configFileName);
            dynamic_paths_service_1.DynamicPathsService.clearCache(configFilePath);
            res.status(200).json({
                message: `Cache cleared for config file: ${configFileName}`,
                configFilePath,
            });
        }
        else {
            dynamic_paths_service_1.DynamicPathsService.clearCache();
            res.status(200).json({
                message: "All cache cleared",
            });
        }
    }
    catch (error) {
        console.error("Error clearing cache:", error);
        res.status(500).json({ error: "Internal server error while clearing cache." });
    }
});
// Route to count lines in a file
router.get("/count-file-lines", async (req, res) => {
    const { filePath } = req.query;
    if (!filePath || typeof filePath !== "string") {
        res.status(400).json({ error: "filePath query parameter is required" });
        return;
    }
    try {
        // Check if file exists
        await fs_1.default.promises.access(filePath, fs_1.default.constants.F_OK);
        // Count lines
        const fileStream = fs_1.default.createReadStream(filePath);
        const rl = readline_1.default.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
        let lineCount = 0;
        for await (const line of rl) {
            if (line.trim() !== "") {
                lineCount++;
            }
        }
        res.status(200).json({
            success: true,
            lineCount,
            filePath,
        });
    }
    catch (error) {
        console.error("Error counting file lines:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error while counting file lines.",
        });
    }
});
// Get log file content route
router.get("/get-log-content/:filename", (req, res) => {
    const { filename } = req.params;
    // Try multiple possible output directories
    const outputdirs = [
        "/Users/italomatos/Documents/IC/udlf-web-front-and-api/udlf-web-api/outputs", // Current project
        "/Users/italomatos/Documents/IC/udlf-api/outputs", // Legacy path
        "/app/outputs", // Docker path
    ];
    const tryReadFile = (dirIndex) => {
        if (dirIndex >= outputdirs.length) {
            console.error(`Log file not found in any directory: ${filename}`);
            res.status(404).json({ error: "Log file not found" });
            return;
        }
        const outputdir = outputdirs[dirIndex];
        const filePath = path_1.default.join(outputdir, filename);
        fs_1.default.access(filePath, fs_1.default.constants.F_OK, (err) => {
            if (err) {
                console.log(`Log file not found in ${filePath}, trying next directory...`);
                tryReadFile(dirIndex + 1);
                return;
            }
            console.log(`Log file found at: ${filePath}`);
            fs_1.default.readFile(filePath, "utf8", (readErr, data) => {
                if (readErr) {
                    console.error(`Error reading log file: ${readErr}`);
                    res.status(500).json({ error: "Error reading log file" });
                    return;
                }
                res.json(data);
            });
        });
    };
    tryReadFile(0);
});
exports.default = router;

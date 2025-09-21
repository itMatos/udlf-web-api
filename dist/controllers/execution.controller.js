"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionController = void 0;
const path_1 = __importDefault(require("path"));
const uploadsDirDocker = "/app/uploads";
class ExecutionController {
    constructor(executionService) {
        this.executionService = executionService;
        this.UPLOADS_DIR = uploadsDirDocker;
    }
    async execute(filename, res) {
        if (!filename) {
            res.status(400).json({ error: "File name is required" });
            return;
        }
        const configFilePath = path_1.default.join(this.UPLOADS_DIR, filename);
        try {
            console.log("Executing command in path...", configFilePath);
            const result = await this.executionService.execute(configFilePath);
            res.json({
                message: "Command executed successfully",
                output: result.stdout,
                error: result.stderr,
            });
        }
        catch (err) {
            console.error(`Error executing command: ${err.message}`);
            res.status(500).json({ error: "Failed to execute command" });
        }
    }
}
exports.ExecutionController = ExecutionController;

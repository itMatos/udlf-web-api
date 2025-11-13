"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.Config = {
    port: process.env.PORT || 8080,
    executablePath: process.env.EXECUTABLE_PATH || "path/to/executable",
    // Google Cloud Storage Configuration
    gcs: {
        bucketName: process.env.GCS_BUCKET_NAME || "",
        projectId: process.env.GCS_PROJECT_ID || "udlf-api-project-1759206589",
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || "./udlf-api-project-1759206589-c33dd21ada4f.json",
    }
};

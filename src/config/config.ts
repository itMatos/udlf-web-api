import dotenv from "dotenv";

dotenv.config();

export const Config = {
  port: process.env.PORT || 8080,
  executablePath: process.env.EXECUTABLE_PATH || "path/to/executable",
  
  // Google Cloud Storage Configuration
  gcs: {
    bucketName: process.env.GCS_BUCKET_NAME || "",
    projectId: process.env.GCS_PROJECT_ID || "udlf-api-project-1759206589",
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || "./udlf-api-project-1759206589-c33dd21ada4f.json",
  }
};

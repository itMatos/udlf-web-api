import dotenv from "dotenv";

dotenv.config();

export const Config = {
  port: process.env.PORT || 8080,
  executablePath: process.env.EXECUTABLE_PATH || "path/to/executable",
};

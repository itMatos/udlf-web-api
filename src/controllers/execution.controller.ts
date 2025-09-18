import { Request, Response } from "express";
import { ExecutionService } from "../services/execution.service";
import path from "path";

const uploadsDirDocker = "/app/uploads" as const;

export class ExecutionController {
  private executionService: ExecutionService;
  private UPLOADS_DIR: string;

  constructor(executionService: ExecutionService) {
    this.executionService = executionService;
    this.UPLOADS_DIR = uploadsDirDocker;
  }

  async execute(filename: string, res: Response): Promise<void> {
    if (!filename) {
      res.status(400).json({ error: "File name is required" });
      return;
    }

    const configFilePath = path.join(this.UPLOADS_DIR, filename);

    try {
      console.log("Executing command in path...", configFilePath);
      const result = await this.executionService.execute(configFilePath);

      res.json({
        message: "Command executed successfully",
        output: result.stdout,
        error: result.stderr,
      });
    } catch (err: any) {
      console.error(`Error executing command: ${err.message}`);
      res.status(500).json({ error: "Failed to execute command" });
    }
  }
}

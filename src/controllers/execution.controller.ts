import { Request, Response } from "express";
import { ExecutionService } from "../services/execution.service";
import path from "path";

export class ExecutionController {
  private executionService: ExecutionService;

  constructor(executionService: ExecutionService) {
    this.executionService = executionService;
  }

  async execute(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    console.log(`File uploaded: ${req.file.originalname}`);

    const configFilePath = path.join(process.cwd(), "uploads", req.file.filename);

    try {
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

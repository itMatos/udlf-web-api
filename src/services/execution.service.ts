import { exec } from "child_process";

export class ExecutionService {
  async execute(configFilePath: string): Promise<{ stdout: string; stderr: string }> {
    const executablePath = "/Users/italomatos/Documents/IC/udlf-api/src/udlf/bin/udlf";

    return new Promise((resolve, reject) => {
      exec(`${executablePath} ${configFilePath}`, (error, stdout, stderr) => {
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
}

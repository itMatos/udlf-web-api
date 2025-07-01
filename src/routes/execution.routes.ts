import { Router, Request, Response } from "express";
import { ExecutionService } from "../services/execution.service";
import { ExecutionController } from "../controllers/execution.controller";
import multer from "multer";
import path from "path";
import fs from "fs";
import readline from "readline";

const router = Router();
const executionService = new ExecutionService();
const executionController = new ExecutionController(executionService);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

router.get("/", (_req, res) => {
  res.json({
    message: "UDLF Server is running",
    timestamp: new Date().toISOString(),
    status: "OK",
  });
});

router.post("/execute", upload.single("config_file"), (req, res) => {
  executionController.execute(req, res);
});

router.get("/output-file/:filename", (req, res) => {
  const { filename } = req.params;
  const outputdir = "/Users/italomatos/Documents/IC/udlf-api/outputs";

  const filePath = path.join(outputdir, filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Error sending file ${filename}:`, err);

      if (!res.headersSent) {
        res.status(404).json({ error: "File not found" });
      }
    }
  });
});

router.get("/file-name-by-index/:fileindex", async (req, res) => {
  const { fileindex } = req.params;
  const lineNumberToAccess = Number(fileindex) + 1;

  const listFilePath = "/Users/italomatos/Documents/IC/UDLF/Datasets/mpeg7/lists_mpeg7.txt";

  if (isNaN(lineNumberToAccess) || lineNumberToAccess < 1) {
    res.status(400).json({ error: "Invalid line number. Must be a positive integer." });
    return;
  }

  try {
    await fs.promises.access(listFilePath, fs.constants.F_OK);
    const lineContent = await readSpecificLine(listFilePath, lineNumberToAccess);
    if (lineContent !== null) {
      // Verifique se a linha foi encontrada (não é null)
      res.status(200).json({ line: lineNumberToAccess, lineContent: lineContent });
    } else {
      // Se a linha não foi encontrada (lineNumber > total de linhas)
      res.status(404).json({ error: `Line number ${lineNumberToAccess} not found in file ${listFilePath}.` });
    }
  } catch (error: any) {
    // Tratar erros de arquivo não encontrado ou inacessível
    if (error.code === "ENOENT") {
      // "Error No Entry" - arquivo não encontrado
      res.status(404).json({ error: "File not found." });
      return;
    }
    console.error(`Error processing request for file index ${fileindex}:`, error);
    res.status(500).json({ error: "Internal server error while trying to read the file." });
  }
});

router.get("/image-file/:imageName", (req: Request, res: Response) => {
  const { imageName } = req.params;
  const imagePath = path.join("/Users/italomatos/Documents/IC/UDLF/Datasets/mpeg7/original/", imageName);

  // Verifica se o arquivo existe
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${imagePath}`);
      return res.status(404).json({ error: "Image file not found" });
    }

    // Envia o arquivo de imagem
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error(`Error sending image file: ${err}`);
        res.status(500).json({ error: "Error sending image file" });
      }
    });
  });
});

router.get("/outputs/:filename/line/:line", async (req: Request, res: Response) => {
  const { filename, line } = req.params;
  const outputdir = "/Users/italomatos/Documents/IC/udlf-api/outputs";
  const filePath = path.join(outputdir, filename);
  const lineNumber = parseInt(line, 10);

  // 1. Validação do número da linha
  if (isNaN(lineNumber) || lineNumber < 1) {
    res.status(400).json({ error: "Invalid line number. Must be a positive integer." });
    return;
  }

  try {
    // 2. Verificar se o arquivo existe e é acessível
    await fs.promises.access(filePath, fs.constants.F_OK); // Usando promises para await fs.access

    // 3. Chamar a função para ler a linha específica
    const lineContent = await readSpecificLine(filePath, lineNumber);

    if (lineContent !== null) {
      // Verifique se a linha foi encontrada (não é null)
      res.status(200).json({ line: lineNumber, lineContent: lineContent });
    } else {
      // Se a linha não foi encontrada (lineNumber > total de linhas)
      res.status(404).json({ error: `Line number ${lineNumber} not found in file ${filename}.` });
    }
  } catch (error: any) {
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

async function readSpecificLine(filePath: string, lineNumber: number) {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentLine = 0;
  for await (const line of rl) {
    currentLine++;
    if (currentLine === lineNumber) {
      rl.close();
      fileStream.destroy();
      return line;
    }
    // Se a linha for muito grande ou se quiser parar de ler após um certo ponto
    // if (currentLine > lineNumber) {
    //   rl.close();
    //   fileStream.destroy();
    //   return null;
    // }
  }
  return null;
}

export default router;

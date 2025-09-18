import { Router, Request, Response } from "express";
import { ExecutionService } from "../services/execution.service";
import { ExecutionController } from "../controllers/execution.controller";
import multer from "multer";
import path from "path";
import fs from "fs";
import readline from "readline";
import { readSpecificLine } from "../utils/helpers";

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

router.get("/download-output/:filename", (req, res) => {
  const { filename } = req.params;
  const outputdir = "/Users/italomatos/Documents/IC/udlf-api/outputs";

  const filePath = path.join(outputdir, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`File not found: ${filePath}`);
      return res.status(404).json({ error: "Output file not found" });
    }
    if (!res.headersSent) {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/octet-stream");
    }

    res.download(filePath, (downloadErr) => {
      if (downloadErr) {
        console.error(`Error downloading file: ${downloadErr}`);
        res.status(500).json({ error: "Error downloading output file" });
      } else {
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

router.get("/file-input-name-by-index", async (req, res) => {
  const { indexList } = req.query;
  const indexes = String(indexList).split(",").map(Number);

  try {
    const result = await executionService.getInputNameByIndexList(indexes);
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`Error processing request for file indexes ${indexes}:`, error);
    res.status(500).json({ error: "Internal server error while trying to read the file." });
  }
});

router.get("/file-input-details-by-line-numbers", async (req, res) => {
  const { lineNumbers } = req.query;
  const indexes = String(lineNumbers).split(",").map(Number);

  try {
    const result = await executionService.getInputFileDetailsByLineNumbers(indexes);
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`Error processing request for file line numbers ${indexes}:`, error);
    res.status(500).json({ error: "Internal server error while trying to read the file." });
  }
});

router.get("/teste/get-line-by-image-name/:imageName", async (req, res) => {
  const { imageName } = req.params;
  const listFilePath = "/Users/italomatos/Documents/IC/UDLF/Datasets/mpeg7/lists_mpeg7.txt";

  try {
    await fs.promises.access(listFilePath, fs.constants.F_OK);

    const fileStream = fs.createReadStream(listFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineNumber = 0;
    let foundLineNumber: number | null = null;

    for await (const line of rl) {
      lineNumber++;
      if (line.trim() === imageName) {
        foundLineNumber = lineNumber;
        break;
      }
    }

    if (foundLineNumber !== null) {
      res.status(200).json({ imageName: imageName, lineNumber: foundLineNumber });
    } else {
      res.status(404).json({ error: `Image name ${imageName} not found in file.` });
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      res.status(404).json({ error: "File not found." });
      return;
    }
    console.error(`Error processing request for image name ${imageName}:`, error);
    res.status(500).json({ error: "Internal server error while trying to read the file." });
  }
});

router.get("/image-file/:imageName", (req: Request, res: Response) => {
  const { imageName } = req.params;
  console.log("Requested image:", imageName);
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
  console.log(`Request to read line ${line} from file ${filename} in directory ${outputdir}`);
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

router.get("/paginated-file-list/:filename/page/:pageIndex", async (req: Request, res: Response) => {
  const { filename, pageIndex } = req.params;
  const { pageSize } = req.query;

  const pageIndexNumber = parseInt(pageIndex as string, 10);
  const pageSizeNumber = parseInt(pageSize as string, 10) || 10;

  try {
    const files = await executionService.getListFilesByPage(pageIndexNumber, pageSizeNumber);
    res.status(200).json(files);
  } catch (error) {
    console.error(`Error fetching files for ${filename}, page ${pageIndexNumber}:`, error);
    res.status(500).json({ error: "Internal server error while trying to fetch files." });
  }
});

router.get("/get-all-input-file-names", async (_req, res) => {
  try {
    const files = await executionService.getAllInputNames();
    res.status(200).json(files);
  } catch (error) {
    console.error("Error fetching all input file names:", error);
    res.status(500).json({ error: "Internal server error while trying to fetch all input file names." });
  }
});

// TODO: o parâmetro deve ser o nome do arquivo config
// /get-grouped-class-names/:configFileName
router.get("/grouped-input-class-names", async (req, res) => {
  // const { configFileName } = req.params;
  try {
    const classNames = await executionService.allFilenamesByClasses();
    res.status(200).json(classNames);
  } catch (error) {
    console.error("Error fetching all class names:", error);
    res.status(500).json({ error: "Internal server error while trying to fetch all class names." });
  }
});

router.get("/input-file-details-by-name", async (req, res) => {
  // const { inputFileNames } = req.query;
  try {
    const inputFileDetails = await executionService.inputFileDetailsByName();
    res.status(200).json(inputFileDetails);
  } catch (error) {
    console.error("Error fetching input file details:", error);
    res.status(500).json({ error: "Internal server error while trying to fetch input file details." });
  }
});

export default router;

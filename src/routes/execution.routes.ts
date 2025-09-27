import { Router, Request, Response } from "express";
import { ExecutionService } from "../services/execution.service";
import { ExecutionController } from "../controllers/execution.controller";
import { DynamicPathsService } from "../services/dynamic-paths.service";
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
const uploadsDirDocker = "/app/uploads" as const;

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

router.get("/file-input-name-by-index", async (req: Request, res: Response) => {
  const { indexList, configFile } = req.query;
  const indexes = String(indexList).split(",").map(Number);

  try {
    const configFilePath = configFile ? path.join(uploadsDirDocker, configFile as string) : undefined;
    const result = await executionService.getInputNameByIndexList(indexes, configFilePath);
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`Error processing request for file indexes ${indexes}:`, error);
    res.status(500).json({ error: "Internal server error while trying to read the file." });
  }
});

router.get("/file-input-details-by-line-numbers", async (req: Request, res: Response) => {
  const { lineNumbers, configFile } = req.query;
  const indexes = String(lineNumbers).split(",").map(Number);

  try {
    const configFilePath = configFile ? path.join(uploadsDirDocker, configFile as string) : undefined;
    const result = await executionService.getInputFileDetailsByLineNumbers(indexes, configFilePath);
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`Error processing request for file line numbers ${indexes}:`, error);
    res.status(500).json({ error: "Internal server error while trying to read the file." });
  }
});

router.get("/teste/get-line-by-image-name/:imageName", async (req: Request, res: Response) => {
  const { imageName } = req.params;
  const { configFile } = req.query;

  try {
    const executionService = new ExecutionService();
    const configFilePath = configFile ? path.join(uploadsDirDocker, configFile as string) : undefined;
    const result = await executionService.getLineNumberByImageName(imageName, configFilePath);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message && error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error(`Error processing request for image name ${imageName}:`, error);
    res.status(500).json({ error: "Internal server error while trying to read the file." });
  }
});

router.get("/image-file/:imageName", (req: Request, res: Response) => {
  const { imageName } = req.params;
  console.log("Requested image:", imageName);
  const { configFile } = req.query;
  const configFilePath = configFile ? path.join(uploadsDirDocker, configFile as string) : undefined;
  console.log("Config file path:", configFilePath);
  
  if (!configFilePath) {
    res.status(400).json({ error: "Config file is required for this endpoint" });
    return;
  }
  
  DynamicPathsService.getPathsForConfig(configFilePath)
    .then((dynamicPaths) => {
      const imagePath = path.join(dynamicPaths.datasetImages, imageName);
      
      // Verifica se o arquivo existe
      return fs.promises.access(imagePath, fs.constants.F_OK)
        .then(() => {
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

router.get("/outputs/:filename/line/:line", async (req: Request, res: Response) => {
  const { filename, line } = req.params;
  const outputdir = "/app/outputs";
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
  const { pageSize, configFile } = req.query;

  const pageIndexNumber = parseInt(pageIndex as string, 10);
  const pageSizeNumber = parseInt(pageSize as string, 10) || 10;

  try {
    // Use dynamic paths if configFile is provided, otherwise use defaults
    const configFilePath = configFile ? path.join(uploadsDirDocker, configFile as string) : undefined;
    const files = await executionService.getListFilesByPage(pageIndexNumber, pageSizeNumber, configFilePath);
    res.status(200).json(files);
  } catch (error) {
    console.error(`Error fetching files for ${filename}, page ${pageIndexNumber}:`, error);
    res.status(500).json({ error: "Internal server error while trying to fetch files." });
  }
});

router.get("/get-all-input-file-names", async (req: Request, res: Response) => {
  const { configFile } = req.query;
  
  try {
    const configFilePath = configFile ? path.join(uploadsDirDocker, configFile as string) : undefined;
    const files = await executionService.getAllInputNames(configFilePath);
    res.status(200).json(files);
  } catch (error) {
    console.error("Error fetching all input file names:", error);
    res.status(500).json({ error: "Internal server error while trying to fetch all input file names." });
  }
});

// New route specifically for config-based file lists
router.get("/paginated-file-list-by-config/:configFileName/page/:pageIndex", async (req: Request, res: Response) => {
  const { configFileName, pageIndex } = req.params;
  const { pageSize } = req.query;

  const pageIndexNumber = parseInt(pageIndex as string, 10);
  const pageSizeNumber = parseInt(pageSize as string, 10) || 10;
  const configFilePath = path.join(uploadsDirDocker, configFileName);

  try {
    const files = await executionService.getListFilesByPage(pageIndexNumber, pageSizeNumber, configFilePath);
    res.status(200).json(files);
  } catch (error) {
    console.error(`Error fetching files for config ${configFileName}, page ${pageIndexNumber}:`, error);
    res.status(500).json({ error: "Internal server error while trying to fetch files." });
  }
});

// TODO: o parâmetro deve ser o nome do arquivo config
// /get-grouped-class-names/:configFileName
router.get("/grouped-input-class-names", async (req: Request, res: Response) => {
  const { configFile } = req.query;
  
  try {
    const configFilePath = configFile ? path.join(uploadsDirDocker, configFile as string) : undefined;
    const classNames = await executionService.allFilenamesByClasses(configFilePath);
    res.status(200).json(classNames);
  } catch (error) {
    console.error("Error fetching all class names:", error);
    res.status(500).json({ error: "Internal server error while trying to fetch all class names." });
  }
});

router.get("/input-file-details-by-name", async (req: Request, res: Response) => {
  const { configFile } = req.query;
  
  try {
    const configFilePath = configFile ? path.join(uploadsDirDocker, configFile as string) : undefined;
    const inputFileDetails = await executionService.inputFileDetailsByName(configFilePath);
    res.status(200).json(inputFileDetails);
  } catch (error) {
    console.error("Error fetching input file details:", error);
    res.status(500).json({ error: "Internal server error while trying to fetch input file details." });
  }
});

// New route that uses dynamic paths based on config file
router.get("/dynamic-paths/:configFileName", async (req: Request, res: Response) => {
  const { configFileName } = req.params;
  const configFilePath = path.join(uploadsDirDocker, configFileName);
  
  try {
    const dynamicPaths = await DynamicPathsService.getPathsForConfig(configFilePath);
    res.status(200).json({
      success: true,
      data: dynamicPaths
    });
  } catch (error) {
    console.error("Error fetching dynamic paths:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error while trying to fetch dynamic paths." 
    });
  }
});

// Updated route that uses dynamic paths for specific config
router.get("/grouped-input-class-names/:configFileName", async (req: Request, res: Response) => {
  const { configFileName } = req.params;
  const configFilePath = path.join(uploadsDirDocker, configFileName);
  
  try {
    const classNames = await executionService.allFilenamesByClasses(configFilePath);
    res.status(200).json(classNames);
  } catch (error) {
    console.error("Error fetching class names for config:", error);
    res.status(500).json({ error: "Internal server error while trying to fetch class names." });
  }
});

// Route to count lines in a file
router.get("/count-file-lines", async (req: Request, res: Response) => {
  const { filePath } = req.query;
  
  if (!filePath || typeof filePath !== 'string') {
    res.status(400).json({ error: "filePath query parameter is required" });
    return;
  }
  
  try {
    // Check if file exists
    await fs.promises.access(filePath, fs.constants.F_OK);
    
    // Count lines
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    
    let lineCount = 0;
    for await (const line of rl) {
      if (line.trim() !== '') {
        lineCount++;
      }
    }
    
    res.status(200).json({ 
      success: true, 
      lineCount,
      filePath 
    });
  } catch (error) {
    console.error("Error counting file lines:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error while counting file lines." 
    });
  }
});

export default router;

import { Router } from "express";
import { ExecutionService } from "../services/execution.service";
import { ExecutionController } from "../controllers/execution.controller";
import multer from "multer";

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

export default router;

import { Router } from "express";
import { DirectoryService } from "../services/directory.service";
import { DirectoryController } from "../controllers/directory.controller";
import { DemoDirectoryService } from "../services/demo-directory.service";

const router = Router();
const directoryService = new DirectoryService();
const demoDirectoryService = new DemoDirectoryService();
const directoryController = new DirectoryController(directoryService, demoDirectoryService);

/**
 * @route GET /api/directory/list
 * @description Lista o conteúdo de um diretório
 * @query path - Caminho do diretório (opcional, padrão: /app)
 * @example GET /api/directory/list?path=/app/Datasets/mpeg7
 */
router.get("/list", (req, res) => {
  directoryController.listDirectory(req, res);
});

/**
 * @route GET /api/directory/info/:path(*)
 * @description Obtém informações sobre um arquivo ou diretório específico
 * @param path - Caminho do arquivo/diretório
 * @example GET /api/directory/info/app/Datasets/mpeg7/original
 */
router.get("/info/:path", (req, res) => {
  directoryController.getItemInfo(req, res);
});

/**
 * @route GET /api/directory/search
 * @description Busca por arquivos em um diretório
 * @query path - Caminho base para busca (opcional, padrão: /app)
 * @query fileName - Nome do arquivo a buscar (suporta wildcards como *.txt, *.jpg)
 * @query maxDepth - Profundidade máxima da busca (opcional, padrão: 3)
 * @example GET /api/directory/search?path=/app/Datasets&fileName=*.jpg&maxDepth=2
 */
router.get("/search", (req, res) => {
  directoryController.searchFiles(req, res);
});

/**
 * @route GET /api/directory/available-paths
 * @description Obtém lista dos diretórios disponíveis para navegação
 * @example GET /api/directory/available-paths
 */
router.get("/available-paths", (req, res) => {
  directoryController.getAvailablePaths(req, res);
});

export default router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoDirectoryService = void 0;
const gcs_service_1 = require("./gcs.service");
class DemoDirectoryService {
    constructor() {
        this.rootPath = "";
        this.gcsService = new gcs_service_1.GCSService();
    }
    async listDemoDirectory(directoryPath) {
        try {
            // Normaliza o caminho
            const normalizedPath = directoryPath ? directoryPath.replace(/^\/+/, "") : "";
            // Lista arquivos e diretórios do GCS
            const { files, directories } = await this.gcsService.listFiles(normalizedPath);
            // Converte para o formato DirectoryItem
            const items = [];
            // Adiciona diretórios
            for (const dir of directories) {
                items.push({
                    name: dir.split("/").filter(Boolean).pop() || dir,
                    path: dir,
                    type: "directory",
                    size: 0,
                });
            }
            // Adiciona arquivos
            for (const file of files) {
                const fileName = file.name.split("/").pop() || file.name;
                items.push({
                    name: fileName,
                    path: file.name,
                    type: "file",
                    size: file.size,
                    lastModified: file.updated,
                });
            }
            // Determina o caminho pai
            let parentPath = undefined;
            if (normalizedPath) {
                const pathParts = normalizedPath.split("/").filter(Boolean);
                if (pathParts.length > 1) {
                    pathParts.pop();
                    parentPath = pathParts.join("/");
                }
                else {
                    parentPath = "";
                }
            }
            return {
                currentPath: normalizedPath || this.rootPath,
                parentPath: parentPath,
                items: items,
                totalItems: items.length,
            };
        }
        catch (error) {
            console.error("Erro ao listar diretório do GCS:", error);
            throw new Error(`Falha ao listar diretório: ${error}`);
        }
    }
    /**
     * Obtém URL assinada para download de arquivo
     */
    async getFileDownloadUrl(filePath) {
        return await this.gcsService.getSignedUrl(filePath);
    }
    /**
     * Verifica se um arquivo existe
     */
    async fileExists(filePath) {
        return await this.gcsService.fileExists(filePath);
    }
}
exports.DemoDirectoryService = DemoDirectoryService;

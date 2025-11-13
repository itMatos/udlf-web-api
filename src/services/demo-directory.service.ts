import { DirectoryListing, DirectoryItem } from "../types/interfaces";
import { GCSService } from "./gcs.service";

export class DemoDirectoryService {
  private readonly rootPath: string;
  private gcsService: GCSService;

  constructor() {
    this.rootPath = "";
    this.gcsService = new GCSService();
  }

  public async listDemoDirectory(directoryPath?: string): Promise<DirectoryListing> {
    try {
      // Normaliza o caminho
      const normalizedPath = directoryPath ? directoryPath.replace(/^\/+/, "") : "";
      
      // Lista arquivos e diretórios do GCS
      const { files, directories } = await this.gcsService.listFiles(normalizedPath);

      // Converte para o formato DirectoryItem
      const items: DirectoryItem[] = [];

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
      let parentPath: string | undefined = undefined;
      if (normalizedPath) {
        const pathParts = normalizedPath.split("/").filter(Boolean);
        if (pathParts.length > 1) {
          pathParts.pop();
          parentPath = pathParts.join("/");
        } else {
          parentPath = "";
        }
      }

      return {
        currentPath: normalizedPath || this.rootPath,
        parentPath: parentPath,
        items: items,
        totalItems: items.length,
      };
    } catch (error) {
      console.error("Erro ao listar diretório do GCS:", error);
      throw new Error(`Falha ao listar diretório: ${error}`);
    }
  }

  /**
   * Obtém URL assinada para download de arquivo
   */
  public async getFileDownloadUrl(filePath: string): Promise<string> {
    return await this.gcsService.getSignedUrl(filePath);
  }

  /**
   * Verifica se um arquivo existe
   */
  public async fileExists(filePath: string): Promise<boolean> {
    return await this.gcsService.fileExists(filePath);
  }
}
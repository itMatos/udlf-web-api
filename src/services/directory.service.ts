import fs from "fs";
import path from "path";
import { DirectoryItem, DirectoryListing } from "../types/interfaces";

export class DirectoryService {
  private readonly allowedPaths: string[];
  private readonly rootPath: string;

  constructor() {
    // Detectar se está rodando no Docker ou localmente
    const isDocker = this.isRunningInDocker();
    
    if (isDocker) {
      // Configuração para Docker
      this.rootPath = "/app";
      this.allowedPaths = [
        "/app/Datasets",
        // "/app/outputs",
        // "/app/uploads",
      ];
    } else {
      // Configuração para ambiente local
      this.rootPath = process.cwd();
      this.allowedPaths = [
        path.join(process.cwd(), "Datasets"),
        path.join(process.cwd(), "outputs"),
        path.join(process.cwd(), "uploads"),
      ];
    }
  }

  /**
   * Detecta se a aplicação está rodando dentro de um container Docker
   */
  private isRunningInDocker(): boolean {
    try {
      // Verifica se o arquivo /.dockerenv existe (indicador comum do Docker)
      return fs.existsSync('/.dockerenv');
    } catch {
      return false;
    }
  }

  /**
   * Lista o conteúdo de um diretório
   * @param directoryPath - Caminho do diretório a ser listado
   * @returns Lista de itens no diretório
   */
  public async listDirectory(directoryPath?: string): Promise<DirectoryListing> {
    try {
      // Usar o caminho raiz se nenhum caminho for fornecido
      const targetPath = directoryPath || this.rootPath;
      
      // Normalizar o caminho
      const normalizedPath = path.normalize(targetPath);
      
      // Verificar se o caminho está dentro dos permitidos
      if (!this.isPathAllowed(normalizedPath)) {
        throw new Error("Access denied: Path not allowed");
      }

      // Verificar se o diretório existe
      await fs.promises.access(normalizedPath, fs.constants.F_OK);
      
      const stats = await fs.promises.stat(normalizedPath);
      if (!stats.isDirectory()) {
        throw new Error("Path is not a directory");
      }

      // Ler o conteúdo do diretório
      const items = await fs.promises.readdir(normalizedPath);
      
      const directoryItems: DirectoryItem[] = [];
      
      for (const item of items) {
        try {
          const itemPath = path.join(normalizedPath, item);
          const itemStats = await fs.promises.stat(itemPath);
          
          // Verificar se o item está dentro dos caminhos permitidos
          if (this.isPathAllowed(itemPath)) {
            directoryItems.push({
              name: item,
              path: itemPath,
              type: itemStats.isDirectory() ? 'directory' : 'file',
              size: itemStats.isFile() ? itemStats.size : undefined,
              lastModified: itemStats.mtime
            });
          }
        } catch (error) {
          // Ignorar itens que não podem ser acessados
          console.warn(`Cannot access item ${item}:`, error);
        }
      }

      // Ordenar: diretórios primeiro, depois arquivos, ambos em ordem alfabética
      directoryItems.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      // Calcular caminho pai
      const parentPath = normalizedPath !== this.rootPath ? path.dirname(normalizedPath) : undefined;

      return {
        currentPath: normalizedPath,
        parentPath,
        items: directoryItems,
        totalItems: directoryItems.length
      };

    } catch (error) {
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifica se um caminho está dentro dos diretórios permitidos
   * @param targetPath - Caminho a ser verificado
   * @returns true se o caminho é permitido
   */
  private isPathAllowed(targetPath: string): boolean {
    const normalizedTarget = path.normalize(targetPath);
    
    // Permitir acesso ao diretório raiz
    if (normalizedTarget === this.rootPath) {
      return true;
    }

    // Verificar se o caminho está dentro de algum dos diretórios permitidos
    return this.allowedPaths.some(allowedPath => {
      const normalizedAllowed = path.normalize(allowedPath);
      return normalizedTarget.startsWith(normalizedAllowed + path.sep) || 
             normalizedTarget === normalizedAllowed;
    });
  }

  /**
   * Obtém informações sobre um arquivo ou diretório específico
   * @param itemPath - Caminho do item
   * @returns Informações do item
   */
  public async getItemInfo(itemPath: string): Promise<DirectoryItem> {
    try {
      const normalizedPath = path.normalize(itemPath);
      
      if (!this.isPathAllowed(normalizedPath)) {
        throw new Error("Access denied: Path not allowed");
      }

      const stats = await fs.promises.stat(normalizedPath);
      
      return {
        name: path.basename(normalizedPath),
        path: normalizedPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.isFile() ? stats.size : undefined,
        lastModified: stats.mtime
      };

    } catch (error) {
      throw new Error(`Failed to get item info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Busca por arquivos em um diretório e subdiretórios
   * @param searchPath - Caminho base para busca
   * @param fileName - Nome do arquivo a buscar (suporta wildcards)
   * @param maxDepth - Profundidade máxima da busca (padrão: 3)
   * @returns Lista de arquivos encontrados
   */
  public async searchFiles(searchPath: string | undefined, fileName: string, maxDepth: number = 3): Promise<DirectoryItem[]> {
    try {
      // Usar o caminho raiz se nenhum caminho for fornecido
      const targetPath = searchPath || this.rootPath;
      const normalizedPath = path.normalize(targetPath);
      
      if (!this.isPathAllowed(normalizedPath)) {
        throw new Error("Access denied: Path not allowed");
      }

      const results: DirectoryItem[] = [];
      await this.searchFilesRecursive(normalizedPath, fileName, maxDepth, 0, results);
      
      return results;

    } catch (error) {
      throw new Error(`Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Busca recursiva por arquivos
   */
  private async searchFilesRecursive(
    currentPath: string, 
    fileName: string, 
    maxDepth: number, 
    currentDepth: number, 
    results: DirectoryItem[]
  ): Promise<void> {
    if (currentDepth >= maxDepth) {
      return;
    }

    try {
      const items = await fs.promises.readdir(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        
        if (!this.isPathAllowed(itemPath)) {
          continue;
        }

        try {
          const stats = await fs.promises.stat(itemPath);
          
          if (stats.isFile() && this.matchesPattern(item, fileName)) {
            results.push({
              name: item,
              path: itemPath,
              type: 'file',
              size: stats.size,
              lastModified: stats.mtime
            });
          } else if (stats.isDirectory()) {
            await this.searchFilesRecursive(itemPath, fileName, maxDepth, currentDepth + 1, results);
          }
        } catch (error) {
          // Ignorar itens que não podem ser acessados
          console.warn(`Cannot access item ${item}:`, error);
        }
      }
    } catch (error) {
      console.warn(`Cannot read directory ${currentPath}:`, error);
    }
  }

  /**
   * Verifica se um nome de arquivo corresponde ao padrão de busca
   */
  private matchesPattern(fileName: string, pattern: string): boolean {
    // Implementação simples de wildcard matching
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(fileName);
  }
}

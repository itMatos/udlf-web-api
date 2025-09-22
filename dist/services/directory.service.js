"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectoryService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class DirectoryService {
    constructor() {
        // Detectar se está rodando no Docker ou localmente
        const isDocker = this.isRunningInDocker();
        if (isDocker) {
            // Configuração para Docker
            this.rootPath = "/app";
            this.allowedPaths = [
                "/app",
                "/app/Datasets",
                "/app/outputs",
                "/app/uploads",
            ];
        }
        else {
            // Configuração para ambiente local
            this.rootPath = process.cwd();
            this.allowedPaths = [
                path_1.default.join(process.cwd(), "Datasets"),
                path_1.default.join(process.cwd(), "outputs"),
                path_1.default.join(process.cwd(), "uploads"),
            ];
        }
    }
    /**
     * Detecta se a aplicação está rodando dentro de um container Docker
     */
    isRunningInDocker() {
        try {
            // Verifica se o arquivo /.dockerenv existe (indicador comum do Docker)
            return fs_1.default.existsSync('/.dockerenv');
        }
        catch {
            return false;
        }
    }
    /**
     * Lista o conteúdo de um diretório
     * @param directoryPath - Caminho do diretório a ser listado
     * @returns Lista de itens no diretório
     */
    async listDirectory(directoryPath) {
        try {
            // Usar o caminho raiz se nenhum caminho for fornecido
            const targetPath = directoryPath || this.rootPath;
            // Normalizar o caminho
            const normalizedPath = path_1.default.normalize(targetPath);
            // Verificar se o caminho está dentro dos permitidos
            if (!this.isPathAllowed(normalizedPath)) {
                throw new Error("Access denied: Path not allowed");
            }
            // Verificar se o diretório existe
            await fs_1.default.promises.access(normalizedPath, fs_1.default.constants.F_OK);
            const stats = await fs_1.default.promises.stat(normalizedPath);
            if (!stats.isDirectory()) {
                throw new Error("Path is not a directory");
            }
            // Ler o conteúdo do diretório
            const items = await fs_1.default.promises.readdir(normalizedPath);
            const directoryItems = [];
            for (const item of items) {
                try {
                    const itemPath = path_1.default.join(normalizedPath, item);
                    const itemStats = await fs_1.default.promises.stat(itemPath);
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
                }
                catch (error) {
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
            const parentPath = normalizedPath !== this.rootPath ? path_1.default.dirname(normalizedPath) : undefined;
            return {
                currentPath: normalizedPath,
                parentPath,
                items: directoryItems,
                totalItems: directoryItems.length
            };
        }
        catch (error) {
            throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Verifica se um caminho está dentro dos diretórios permitidos
     * @param targetPath - Caminho a ser verificado
     * @returns true se o caminho é permitido
     */
    isPathAllowed(targetPath) {
        const normalizedTarget = path_1.default.normalize(targetPath);
        // Permitir acesso ao diretório raiz
        if (normalizedTarget === this.rootPath) {
            return true;
        }
        // Verificar se o caminho está dentro de algum dos diretórios permitidos
        return this.allowedPaths.some(allowedPath => {
            const normalizedAllowed = path_1.default.normalize(allowedPath);
            return normalizedTarget.startsWith(normalizedAllowed + path_1.default.sep) ||
                normalizedTarget === normalizedAllowed;
        });
    }
    /**
     * Obtém informações sobre um arquivo ou diretório específico
     * @param itemPath - Caminho do item
     * @returns Informações do item
     */
    async getItemInfo(itemPath) {
        try {
            const normalizedPath = path_1.default.normalize(itemPath);
            if (!this.isPathAllowed(normalizedPath)) {
                throw new Error("Access denied: Path not allowed");
            }
            const stats = await fs_1.default.promises.stat(normalizedPath);
            return {
                name: path_1.default.basename(normalizedPath),
                path: normalizedPath,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.isFile() ? stats.size : undefined,
                lastModified: stats.mtime
            };
        }
        catch (error) {
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
    async searchFiles(searchPath, fileName, maxDepth = 3) {
        try {
            // Usar o caminho raiz se nenhum caminho for fornecido
            const targetPath = searchPath || this.rootPath;
            const normalizedPath = path_1.default.normalize(targetPath);
            if (!this.isPathAllowed(normalizedPath)) {
                throw new Error("Access denied: Path not allowed");
            }
            const results = [];
            await this.searchFilesRecursive(normalizedPath, fileName, maxDepth, 0, results);
            return results;
        }
        catch (error) {
            throw new Error(`Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Busca recursiva por arquivos
     */
    async searchFilesRecursive(currentPath, fileName, maxDepth, currentDepth, results) {
        if (currentDepth >= maxDepth) {
            return;
        }
        try {
            const items = await fs_1.default.promises.readdir(currentPath);
            for (const item of items) {
                const itemPath = path_1.default.join(currentPath, item);
                if (!this.isPathAllowed(itemPath)) {
                    continue;
                }
                try {
                    const stats = await fs_1.default.promises.stat(itemPath);
                    if (stats.isFile() && this.matchesPattern(item, fileName)) {
                        results.push({
                            name: item,
                            path: itemPath,
                            type: 'file',
                            size: stats.size,
                            lastModified: stats.mtime
                        });
                    }
                    else if (stats.isDirectory()) {
                        await this.searchFilesRecursive(itemPath, fileName, maxDepth, currentDepth + 1, results);
                    }
                }
                catch (error) {
                    // Ignorar itens que não podem ser acessados
                    console.warn(`Cannot access item ${item}:`, error);
                }
            }
        }
        catch (error) {
            console.warn(`Cannot read directory ${currentPath}:`, error);
        }
    }
    /**
     * Verifica se um nome de arquivo corresponde ao padrão de busca
     */
    matchesPattern(fileName, pattern) {
        // Implementação simples de wildcard matching
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(fileName);
    }
}
exports.DirectoryService = DirectoryService;

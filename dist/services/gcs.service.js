"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GCSService = void 0;
const storage_1 = require("@google-cloud/storage");
const config_1 = require("../config/config");
/**
 * Serviço para interagir com o Google Cloud Storage
 */
class GCSService {
    constructor() {
        // Inicializa o cliente do Google Cloud Storage
        this.storage = new storage_1.Storage({
            projectId: config_1.Config.gcs.projectId,
            keyFilename: config_1.Config.gcs.keyFilename,
        });
        // Define o bucket padrão
        this.bucket = this.storage.bucket(config_1.Config.gcs.bucketName);
    }
    /**
     * Lista arquivos e diretórios no bucket
     * @param prefix - Prefixo (caminho) para filtrar arquivos
     * @param delimiter - Delimitador para simular estrutura de diretórios (padrão: '/')
     */
    async listFiles(prefix, delimiter = "/") {
        try {
            const options = {
                delimiter: delimiter,
            };
            if (prefix) {
                options.prefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
            }
            const [files, , apiResponse] = await this.bucket.getFiles(options);
            // Extrair diretórios (prefixes)
            const directories = apiResponse.prefixes || [];
            // Mapear arquivos com informações relevantes
            const fileList = files.map((file) => ({
                name: file.name,
                size: parseInt(String(file.metadata.size || "0")),
                updated: new Date(file.metadata.updated || Date.now()),
            }));
            return {
                files: fileList,
                directories: directories,
            };
        }
        catch (error) {
            console.error("Erro ao listar arquivos do GCS:", error);
            throw new Error(`Falha ao listar arquivos: ${error}`);
        }
    }
    /**
     * Faz download de um arquivo do bucket
     * @param fileName - Nome do arquivo no bucket
     * @param destinationPath - Caminho local para salvar o arquivo
     */
    async downloadFile(fileName, destinationPath) {
        try {
            await this.bucket.file(fileName).download({
                destination: destinationPath,
            });
            console.log(`Arquivo ${fileName} baixado para ${destinationPath}`);
        }
        catch (error) {
            console.error("Erro ao baixar arquivo do GCS:", error);
            throw new Error(`Falha ao baixar arquivo: ${error}`);
        }
    }
    /**
     * Faz upload de um arquivo para o bucket
     * @param localFilePath - Caminho do arquivo local
     * @param destinationFileName - Nome do arquivo no bucket
     */
    async uploadFile(localFilePath, destinationFileName) {
        try {
            await this.bucket.upload(localFilePath, {
                destination: destinationFileName,
            });
            console.log(`Arquivo ${localFilePath} enviado para ${destinationFileName}`);
        }
        catch (error) {
            console.error("Erro ao enviar arquivo para GCS:", error);
            throw new Error(`Falha ao enviar arquivo: ${error}`);
        }
    }
    /**
     * Obtém uma URL assinada temporária para download de arquivo
     * @param fileName - Nome do arquivo no bucket
     * @param expirationMinutes - Tempo de expiração em minutos (padrão: 15)
     */
    async getSignedUrl(fileName, expirationMinutes = 15) {
        try {
            const file = this.bucket.file(fileName);
            const [url] = await file.getSignedUrl({
                version: "v4",
                action: "read",
                expires: Date.now() + expirationMinutes * 60 * 1000,
            });
            return url;
        }
        catch (error) {
            console.error("Erro ao gerar URL assinada:", error);
            throw new Error(`Falha ao gerar URL assinada: ${error}`);
        }
    }
    /**
     * Verifica se um arquivo existe no bucket
     * @param fileName - Nome do arquivo no bucket
     */
    async fileExists(fileName) {
        try {
            const file = this.bucket.file(fileName);
            const [exists] = await file.exists();
            return exists;
        }
        catch (error) {
            console.error("Erro ao verificar existência do arquivo:", error);
            return false;
        }
    }
    /**
     * Deleta um arquivo do bucket
     * @param fileName - Nome do arquivo no bucket
     */
    async deleteFile(fileName) {
        try {
            await this.bucket.file(fileName).delete();
            console.log(`Arquivo ${fileName} deletado do bucket`);
        }
        catch (error) {
            console.error("Erro ao deletar arquivo do GCS:", error);
            throw new Error(`Falha ao deletar arquivo: ${error}`);
        }
    }
    /**
     * Obtém metadados de um arquivo
     * @param fileName - Nome do arquivo no bucket
     */
    async getFileMetadata(fileName) {
        try {
            const file = this.bucket.file(fileName);
            const [metadata] = await file.getMetadata();
            return metadata;
        }
        catch (error) {
            console.error("Erro ao obter metadados do arquivo:", error);
            throw new Error(`Falha ao obter metadados: ${error}`);
        }
    }
    /**
     * Cria um stream de leitura para um arquivo
     * @param fileName - Nome do arquivo no bucket
     */
    createReadStream(fileName) {
        return this.bucket.file(fileName).createReadStream();
    }
    /**
     * Cria um stream de escrita para um arquivo
     * @param fileName - Nome do arquivo no bucket
     */
    createWriteStream(fileName) {
        return this.bucket.file(fileName).createWriteStream();
    }
}
exports.GCSService = GCSService;

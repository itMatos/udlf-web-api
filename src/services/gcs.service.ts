import { Storage, Bucket, File, StorageOptions } from "@google-cloud/storage";
import { Config } from "../config/config";

/**
 * Serviço para interagir com o Google Cloud Storage
 */
export class GCSService {
  private storage: Storage;
  private bucket: Bucket;

  constructor() {
    // Check if running in Cloud Run (uses service account automatically)
    const isCloudRun = !!process.env.K_SERVICE;
    
    console.log(`Initializing GCSService - Cloud Run: ${isCloudRun}, Bucket: ${Config.gcs.bucketName}`);
    
    // Inicializa o cliente do Google Cloud Storage
    if (isCloudRun) {
      // Cloud Run: use automatic service account authentication
      this.storage = new Storage({
        projectId: Config.gcs.projectId,
      });
      console.log('✓ GCSService initialized with Cloud Run service account');
    } else {
      // Local/Docker: use key file
      const storageOptions: StorageOptions = {
        projectId: Config.gcs.projectId,
      };
      
      // Only add keyFilename if it's defined
      if (Config.gcs.keyFilename) {
        storageOptions.keyFilename = Config.gcs.keyFilename;
      }
      
      this.storage = new Storage(storageOptions);
      console.log(`✓ GCSService initialized with key file: ${Config.gcs.keyFilename || 'default credentials'}`);
    }

    // Define o bucket padrão
    this.bucket = this.storage.bucket(Config.gcs.bucketName);
    console.log(`✓ GCSService connected to bucket: ${Config.gcs.bucketName}`);
  }

  /**
   * Lista arquivos e diretórios no bucket
   * @param prefix - Prefixo (caminho) para filtrar arquivos
   * @param delimiter - Delimitador para simular estrutura de diretórios (padrão: '/')
   */
  async listFiles(prefix?: string, delimiter: string = "/"): Promise<{
    files: Array<{ name: string; size: number; updated: Date }>;
    directories: string[];
  }> {
    try {
      const options: any = {
        delimiter: delimiter,
      };

      if (prefix) {
        options.prefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
      }

      const [files, , apiResponse] = await this.bucket.getFiles(options);

      // Extrair diretórios (prefixes)
      const directories = (apiResponse as any).prefixes || [];

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
    } catch (error) {
      console.error("Erro ao listar arquivos do GCS:", error);
      throw new Error(`Falha ao listar arquivos: ${error}`);
    }
  }

  /**
   * Faz download de um arquivo do bucket
   * @param fileName - Nome do arquivo no bucket
   * @param destinationPath - Caminho local para salvar o arquivo
   */
  async downloadFile(fileName: string, destinationPath: string): Promise<void> {
    try {
      await this.bucket.file(fileName).download({
        destination: destinationPath,
      });
      console.log(`Arquivo ${fileName} baixado para ${destinationPath}`);
    } catch (error) {
      console.error("Erro ao baixar arquivo do GCS:", error);
      throw new Error(`Falha ao baixar arquivo: ${error}`);
    }
  }

  /**
   * Faz upload de um arquivo para o bucket
   * @param localFilePath - Caminho do arquivo local
   * @param destinationFileName - Nome do arquivo no bucket
   */
  async uploadFile(
    localFilePath: string,
    destinationFileName: string
  ): Promise<void> {
    try {
      await this.bucket.upload(localFilePath, {
        destination: destinationFileName,
      });
      console.log(`Arquivo ${localFilePath} enviado para ${destinationFileName}`);
    } catch (error) {
      console.error("Erro ao enviar arquivo para GCS:", error);
      throw new Error(`Falha ao enviar arquivo: ${error}`);
    }
  }

  /**
   * Obtém uma URL assinada temporária para download de arquivo
   * @param fileName - Nome do arquivo no bucket
   * @param expirationMinutes - Tempo de expiração em minutos (padrão: 15)
   */
  async getSignedUrl(
    fileName: string,
    expirationMinutes: number = 15
  ): Promise<string> {
    try {
      const file = this.bucket.file(fileName);
      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + expirationMinutes * 60 * 1000,
      });
      return url;
    } catch (error) {
      console.error("Erro ao gerar URL assinada:", error);
      throw new Error(`Falha ao gerar URL assinada: ${error}`);
    }
  }

  /**
   * Verifica se um arquivo existe no bucket
   * @param fileName - Nome do arquivo no bucket
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const file = this.bucket.file(fileName);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error("Erro ao verificar existência do arquivo:", error);
      return false;
    }
  }

  /**
   * Deleta um arquivo do bucket
   * @param fileName - Nome do arquivo no bucket
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.bucket.file(fileName).delete();
      console.log(`Arquivo ${fileName} deletado do bucket`);
    } catch (error) {
      console.error("Erro ao deletar arquivo do GCS:", error);
      throw new Error(`Falha ao deletar arquivo: ${error}`);
    }
  }

  /**
   * Obtém metadados de um arquivo
   * @param fileName - Nome do arquivo no bucket
   */
  async getFileMetadata(fileName: string): Promise<any> {
    try {
      const file = this.bucket.file(fileName);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error("Erro ao obter metadados do arquivo:", error);
      throw new Error(`Falha ao obter metadados: ${error}`);
    }
  }

  /**
   * Cria um stream de leitura para um arquivo
   * @param fileName - Nome do arquivo no bucket
   */
  createReadStream(fileName: string): NodeJS.ReadableStream {
    return this.bucket.file(fileName).createReadStream();
  }

  /**
   * Cria um stream de escrita para um arquivo
   * @param fileName - Nome do arquivo no bucket
   */
  createWriteStream(fileName: string): NodeJS.WritableStream {
    return this.bucket.file(fileName).createWriteStream();
  }
}


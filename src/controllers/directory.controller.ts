import { Request, Response } from "express";
import fs from "fs";
import { DirectoryService } from "../services/directory.service";
import { DemoDirectoryService } from "../services/demo-directory.service";

export class DirectoryController {
  private directoryService: DirectoryService;
  private demoDirectoryService: DemoDirectoryService;
  
  constructor(directoryService: DirectoryService, demoDirectoryService: DemoDirectoryService) {
    this.directoryService = directoryService;
    this.demoDirectoryService = demoDirectoryService;
  }

  /**
   * Lista o conteúdo de um diretório
   */
  public async listDirectory(req: Request, res: Response): Promise<void> {
    try {
      const { path: directoryPath } = req.query;
      const apiMode = process.env.API_MODE?.toLowerCase();
      const pathParam = typeof directoryPath === 'string' ? directoryPath : undefined;
      
      if (apiMode === 'demo') {
        const result = await this.demoDirectoryService.listDemoDirectory(pathParam);
        res.status(200).json({
          success: true,
          data: result
        });
        return;
      }
      else {
        const result = await this.directoryService.listDirectory(pathParam);
        res.status(200).json({
          success: true,
          data: result
          });
        return;
      }
    } catch (error) {
      console.error('Error listing directory:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Obtém informações sobre um arquivo ou diretório específico
   */
  public async getItemInfo(req: Request, res: Response): Promise<void> {
    try {
      const { path: itemPath } = req.params;
      
      if (!itemPath) {
        res.status(400).json({
          success: false,
          error: 'Path parameter is required'
        });
        return;
      }

      // Garantir que o path comece com /
      const normalizedPath = itemPath.startsWith('/') ? itemPath : `/${itemPath}`;
      const result = await this.directoryService.getItemInfo(normalizedPath);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting item info:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Busca por arquivos em um diretório
   */
  public async searchFiles(req: Request, res: Response): Promise<void> {
    try {
      const { path: searchPath, fileName, maxDepth } = req.query;
      
      if (!fileName || typeof fileName !== 'string') {
        res.status(400).json({
          success: false,
          error: 'fileName parameter is required'
        });
        return;
      }

      const pathParam = typeof searchPath === 'string' ? searchPath : undefined;
      const depthParam = maxDepth ? parseInt(String(maxDepth), 10) : 3;
      
      const result = await this.directoryService.searchFiles(pathParam, fileName, depthParam);
      
      res.status(200).json({
        success: true,
        data: {
          searchPath: pathParam,
          fileName,
          maxDepth: depthParam,
          results: result,
          totalFound: result.length
        }
      });
    } catch (error) {
      console.error('Error searching files:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Obtém os diretórios permitidos para navegação
   */
  public getAvailablePaths(req: Request, res: Response): void {
    try {
      // Detectar se está rodando no Docker ou localmente
      const isDocker = this.isRunningInDocker();
      const rootPath = isDocker ? "/app" : process.cwd();
      
      const availablePaths = [
        {
          name: "Datasets",
          path: `${rootPath}/Datasets`,
          description: "Conjuntos de dados disponíveis"
        },
        {
          name: "Outputs",
          path: `${rootPath}/outputs`,
          description: "Arquivos de saída das execuções"
        },
        {
          name: "Uploads",
          path: `${rootPath}/uploads`,
          description: "Arquivos enviados pelos usuários"
        },
        {
          name: "UDLF",
          path: `${rootPath}/udlf`,
          description: "Binários e configurações do UDLF"
        }
      ];

      res.status(200).json({
        success: true,
        data: {
          rootPath,
          availablePaths
        }
      });
    } catch (error) {
      console.error('Error getting available paths:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
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
}

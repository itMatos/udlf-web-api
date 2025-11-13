# UDLF Web API

API Node.js/TypeScript para execução do UDLF (Unsupervised Distance Learning Framework) com suporte a Google Cloud Storage.

## 🚀 Quick Start

### Teste Local

```bash
# Iniciar Docker Desktop
open -a Docker

# Testar localmente (modo demo)
./test-local.sh
```

A API estará disponível em `http://localhost:8080`

### Deploy para Cloud Run

```bash
# Deploy automatizado com GCSFuse
./deploy-cloudrun.sh

# Ou build manual
./build-cloudrun.sh
# (seguir instruções exibidas)
```

## 🏗️ Arquitetura

- **Modo Demo**: Usa Google Cloud Storage para datasets
- **API REST**: Endpoints para execução do UDLF e navegação de diretórios
- **Docker**: Containerizado para deploy em Cloud Run

## 📋 Configuração

### Desenvolvimento Local

- `Dockerfile.dev` - Desenvolvimento com hot-reload
- `docker-compose.yml` - Orquestração local
- `API_MODE=demo` - Modo de operação

### Produção (Cloud Run)

- `Dockerfile` - Build otimizado
- `API_MODE=demo` - Configurado no deploy
- GCS credenciais via service account

## 🔧 Comandos

```bash
# Desenvolvimento
npm run dev          # Iniciar com hot-reload
npm run build        # Compilar TypeScript
npm start            # Iniciar produção

# Docker
./test-local.sh      # Teste local
./build-cloudrun.sh  # Build para Cloud Run
docker-compose logs  # Ver logs
docker-compose down  # Parar containers
```

## 📚 Documentação

- `GCSFUSE.md` - Montagem do bucket GCS com GCSFuse (Cloud Run)
- `ARQUITETURA_GCS.md` - Arquitetura do GCS
- `DIRECTORY_API.md` - API de diretórios

## 🌐 Endpoints

```bash
GET  /                              # Health check
POST /execute                       # Executar UDLF
GET  /api/directory/list            # Listar diretório
GET  /api/directory/info/:path      # Info de arquivo/diretório
```

## ⚙️ Tecnologias

- Node.js 20
- TypeScript
- Express.js
- Google Cloud Storage
- Docker & Cloud Run


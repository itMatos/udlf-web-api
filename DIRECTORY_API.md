# API de Navegação de Diretórios

Esta API permite navegar pelos diretórios do container Docker de forma segura, expondo uma interface similar a um explorador de arquivos.

## Endpoints Disponíveis

### 1. Listar Conteúdo de Diretório

**GET** `/api/directory/list`

Lista o conteúdo de um diretório específico.

**Query Parameters:**
- `path` (opcional): Caminho do diretório a ser listado. Padrão: `/app`

**Exemplo:**
```bash
GET /api/directory/list?path=/app/Datasets/mpeg7
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "currentPath": "/app/Datasets/mpeg7",
    "parentPath": "/app/Datasets",
    "items": [
      {
        "name": "original",
        "path": "/app/Datasets/mpeg7/original",
        "type": "directory",
        "lastModified": "2024-01-15T10:30:00.000Z"
      },
      {
        "name": "classes_mpeg7.txt",
        "path": "/app/Datasets/mpeg7/classes_mpeg7.txt",
        "type": "file",
        "size": 1024,
        "lastModified": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totalItems": 2
  }
}
```

### 2. Informações de Arquivo/Diretório

**GET** `/api/directory/info/*`

Obtém informações detalhadas sobre um arquivo ou diretório específico.

**Path Parameters:**
- `path`: Caminho do arquivo/diretório (usando wildcard `*`)

**Exemplo:**
```bash
GET /api/directory/info/app/Datasets/mpeg7/original/apple-1.gif
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "name": "apple-1.gif",
    "path": "/app/Datasets/mpeg7/original/apple-1.gif",
    "type": "file",
    "size": 15432,
    "lastModified": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Buscar Arquivos

**GET** `/api/directory/search`

Busca por arquivos em um diretório e subdiretórios.

**Query Parameters:**
- `path` (opcional): Caminho base para busca. Padrão: `/app`
- `fileName` (obrigatório): Nome do arquivo a buscar (suporta wildcards)
- `maxDepth` (opcional): Profundidade máxima da busca. Padrão: 3

**Exemplos:**
```bash
# Buscar todos os arquivos .jpg no diretório Datasets
GET /api/directory/search?path=/app/Datasets&fileName=*.jpg&maxDepth=2

# Buscar arquivos que contenham "apple" no nome
GET /api/directory/search?fileName=*apple*

# Buscar arquivos .txt em qualquer lugar
GET /api/directory/search?fileName=*.txt
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "searchPath": "/app/Datasets",
    "fileName": "*.jpg",
    "maxDepth": 2,
    "results": [
      {
        "name": "apple-1.jpg",
        "path": "/app/Datasets/mpeg7/original/apple-1.jpg",
        "type": "file",
        "size": 15432,
        "lastModified": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totalFound": 1
  }
}
```

### 4. Diretórios Disponíveis

**GET** `/api/directory/available-paths`

Lista os diretórios disponíveis para navegação.

**Exemplo:**
```bash
GET /api/directory/available-paths
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "rootPath": "/app",
    "availablePaths": [
      {
        "name": "Datasets",
        "path": "/app/Datasets",
        "description": "Conjuntos de dados disponíveis"
      },
      {
        "name": "Outputs",
        "path": "/app/outputs",
        "description": "Arquivos de saída das execuções"
      },
      {
        "name": "Uploads",
        "path": "/app/uploads",
        "description": "Arquivos enviados pelos usuários"
      },
      {
        "name": "UDLF",
        "path": "/app/udlf",
        "description": "Binários e configurações do UDLF"
      }
    ]
  }
}
```

## Segurança

A API implementa as seguintes medidas de segurança:

1. **Caminhos Permitidos**: Apenas diretórios específicos são acessíveis:
   - `/app/Datasets`
   - `/app/outputs`
   - `/app/uploads`
   - `/app/udlf`

2. **Validação de Caminhos**: Todos os caminhos são normalizados e validados antes do acesso.

3. **Tratamento de Erros**: Erros de acesso são tratados graciosamente sem expor informações sensíveis.

## Como Usar no Frontend

### Exemplo de Navegação Básica

```javascript
// Listar diretório raiz
const response = await fetch('/api/directory/list');
const data = await response.json();

// Navegar para um subdiretório
const response = await fetch('/api/directory/list?path=/app/Datasets/mpeg7');
const data = await response.json();

// Buscar arquivos específicos
const response = await fetch('/api/directory/search?fileName=*.jpg&path=/app/Datasets');
const data = await response.json();
```

### Interface de Navegação

Você pode criar uma interface similar a um explorador de arquivos:

1. Use `/available-paths` para mostrar os diretórios principais
2. Use `/list` para navegar pelos diretórios
3. Use `/search` para buscar arquivos específicos
4. Use `/info/*` para obter detalhes de arquivos

### Exemplo de Componente React

```jsx
const DirectoryExplorer = () => {
  const [currentPath, setCurrentPath] = useState('/app');
  const [items, setItems] = useState([]);

  const loadDirectory = async (path) => {
    const response = await fetch(`/api/directory/list?path=${encodeURIComponent(path)}`);
    const data = await response.json();
    if (data.success) {
      setItems(data.data.items);
      setCurrentPath(data.data.currentPath);
    }
  };

  return (
    <div>
      <h3>Diretório: {currentPath}</h3>
      <ul>
        {items.map(item => (
          <li key={item.path}>
            {item.type === 'directory' ? '📁' : '📄'} {item.name}
            {item.type === 'directory' && (
              <button onClick={() => loadDirectory(item.path)}>
                Abrir
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## Códigos de Erro

- `400`: Parâmetros inválidos ou ausentes
- `404`: Arquivo ou diretório não encontrado
- `500`: Erro interno do servidor
- `403`: Acesso negado (caminho não permitido)

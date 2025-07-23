# 📚 API Endpoints para Tools de Documentación y Exploración

Esta API estática JSON replica las **17 tools de documentación y exploración** del n8n-MCP, proporcionando acceso a toda la información de los 525+ nodos de n8n a través de **archivos JSON estáticos optimizados para GitHub Pages**.

## 🌐 Base URL
```
https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/
```

## ✨ **Características para GitHub Pages**

- ✅ **100% Estático** - Todos los endpoints son archivos JSON
- ✅ **Sin Servidor** - Funciona directamente desde GitHub Pages
- ✅ **Cache-Friendly** - Los archivos se cachean automáticamente
- ✅ **CORS Habilitado** - Accesible desde cualquier origen
- ✅ **Paths Absolutos** - URLs completas en las respuestas
- ✅ **Manifest API** - Estructura documentada en `/api/api-manifest.json`

---

## 📊 **TOOL 1: get_database_statistics**
**Endpoint:** `/api/database-statistics.json`

Estadísticas generales del ecosistema n8n.

**Estructura de respuesta:**
```json
{
  "total_nodes": 526,
  "ai_tools": 263,
  "triggers": 108,
  "webhooks": 79,
  "packages": 2,
  "categories": 5,
  "versioned_nodes": 450,
  "documented_nodes": 458,
  "documentation_coverage": 87,
  "generated_at": "2025-07-22T...",
  "api_version": "1.0.0"
}
```

---

## 🔍 **TOOL 2: search_nodes**
**Endpoint:** `/api/search-index.json`

Índice optimizado para búsqueda de nodos con keywords.

**Estructura de respuesta:**
```json
[
  {
    "node_type": "nodes-base.slack",
    "display_name": "Slack",
    "description": "Send messages and manage Slack workspaces",
    "category": "output",
    "package_name": "n8n-nodes-base",
    "is_ai_tool": true,
    "is_trigger": false,
    "is_webhook": false,
    "keywords": ["slack", "message", "communication", "output", "chat"]
  }
]
```

**Uso:**
```javascript
// Buscar nodos que contengan "slack"
const response = await fetch('/api/search-index.json');
const nodes = await response.json();
const slackNodes = nodes.filter(node => 
  node.keywords.some(keyword => keyword.includes('slack'))
);
```

---

## 📋 **TOOL 3: list_nodes**
**Endpoints múltiples para filtros:**

### Por Categoría:
- `/api/list-nodes/category-trigger.json` - Nodos trigger
- `/api/list-nodes/category-transform.json` - Nodos de transformación
- `/api/list-nodes/category-output.json` - Nodos de salida
- `/api/list-nodes/category-input.json` - Nodos de entrada

### Por Paquete:
- `/api/list-nodes/package-n8n-nodes-base.json` - Nodos core
- `/api/list-nodes/package-_n8n_n8n-nodes-langchain.json` - Nodos AI/LangChain

### Solo AI Tools:
- `/api/list-nodes/ai-tools-only.json` - Solo los 263 nodos AI

**Estructura de respuesta:**
```json
[
  {
    "node_type": "nodes-base.webhook",
    "display_name": "Webhook",
    "description": "Receive HTTP requests",
    "category": "trigger",
    "package_name": "n8n-nodes-base",
    "is_ai_tool": false,
    "is_trigger": true,
    "is_webhook": true,
    "development_style": "declarative"
  }
]
```

---

## 🔧 **TOOL 4: get_node_info**
**Endpoint:** `/api/nodes-detailed/{node_type}.json`

Información técnica completa del nodo (100KB+).

**Ejemplo:** `/api/nodes-detailed/nodes-base_httpRequest.json`

**Estructura de respuesta:**
```json
{
  "node_type": "nodes-base.httpRequest",
  "display_name": "HTTP Request",
  "description": "Makes HTTP requests",
  "category": "output",
  "package_name": "n8n-nodes-base",
  "version": "4.2",
  "is_ai_tool": false,
  "properties_schema": { /* Schema JSON completo */ },
  "operations": [ /* Operaciones disponibles */ ],
  "credentials_required": [ /* Credenciales */ ],
  "documentation": "Full documentation text...",
  "generated_at": "2025-07-22T..."
}
```

---

## ⚡ **TOOL 5: get_node_essentials**
**Endpoint:** `/api/nodes-essentials/{node_type}.json`

Solo las propiedades esenciales del nodo (<5KB).

**Ejemplo:** `/api/nodes-essentials/nodes-base_slack.json`

**Estructura de respuesta:**
```json
{
  "node_type": "nodes-base.slack",
  "display_name": "Slack",
  "description": "Send messages to Slack",
  "category": "output",
  "package_name": "n8n-nodes-base",
  "version": "2.1",
  "is_ai_tool": true,
  "essential_properties": [
    {
      "name": "channel",
      "type": "string",
      "description": "Channel to send message to",
      "required": true
    },
    {
      "name": "text",
      "type": "string", 
      "description": "Message text",
      "required": true
    }
  ],
  "common_operations": [
    {
      "name": "postMessage",
      "description": "Send a message to a channel",
      "action": "postMessage"
    }
  ],
  "generated_at": "2025-07-22T..."
}
```

---

## 📖 **TOOL 6: get_node_documentation**
**Endpoint:** Incluido en `/api/nodes-detailed/{node_type}.json`

La documentación legible está en el campo `documentation` de cada nodo detallado.

---

## 🔎 **TOOL 7: search_node_properties**
**Endpoint:** `/api/properties-index.json`

Índice de todas las propiedades de todos los nodos.

**Estructura de respuesta:**
```json
{
  "nodes-base.httpRequest": [
    {
      "path": "url",
      "type": "string",
      "description": "The URL to make the request to"
    },
    {
      "path": "authentication.type",
      "type": "string", 
      "description": "Authentication method"
    }
  ],
  "nodes-base.slack": [
    {
      "path": "channel",
      "type": "string",
      "description": "Slack channel"
    }
  ]
}
```

**Uso:**
```javascript
// Buscar propiedades de autenticación en HTTP Request
const response = await fetch('/api/properties-index.json');
const index = await response.json();
const httpProps = index['nodes-base.httpRequest'];
const authProps = httpProps.filter(prop => 
  prop.path.includes('auth') || prop.description.includes('auth')
);
```

---

## 🛠️ **TOOL 8: get_node_for_task**
**Endpoint:** `/api/tasks-config.json`

Configuraciones preconfiguradas para tareas comunes.

**Estructura de respuesta:**
```json
{
  "available_tasks": {
    "HTTP/API": ["get_api_data", "post_json_request", "call_api_with_auth"],
    "Webhooks": ["receive_webhook", "webhook_with_response"],
    "Database": ["query_postgres", "insert_postgres_data"],
    "AI/LangChain": ["chat_with_ai", "ai_agent_workflow"],
    "Data Processing": ["transform_data", "filter_data"],
    "Communication": ["send_slack_message", "send_email"]
  },
  "task_configurations": {
    "get_api_data": {
      "node_type": "nodes-base.httpRequest",
      "configuration": {
        "method": "GET",
        "url": "{{ $json.api_url }}",
        "options": {}
      }
    },
    "send_slack_message": {
      "node_type": "nodes-base.slack",
      "configuration": {
        "operation": "postMessage",
        "channel": "{{ $json.channel }}",
        "text": "{{ $json.message }}"
      }
    }
  },
  "generated_at": "2025-07-22T..."
}
```

---

## 📝 **TOOL 9: list_tasks**
**Endpoint:** `/api/tasks-config.json` (mismo que arriba)

Lista todas las tareas disponibles organizadas por categoría.

---

## 🤖 **TOOL 10: list_ai_tools**
**Endpoint:** `/api/ai-tools-detailed.json`

Lista detallada de los 263 nodos que pueden usarse como herramientas AI.

**Estructura de respuesta:**
```json
[
  {
    "node_type": "nodes-base.slack",
    "display_name": "Slack",
    "description": "Send messages to Slack",
    "category": "output",
    "package_name": "n8n-nodes-base",
    "ai_tool_capabilities": {
      "usable_as_tool": true,
      "common_use_cases": ["Send notifications", "Create channels", "Manage users"],
      "connection_requirements": "Connect to AI Agent tool port",
      "configuration_notes": "Requires authentication credentials"
    }
  }
]
```

---

## 🔧 **TOOL 11: get_node_as_tool_info**
**Endpoint:** `/api/ai-tools-detailed.json`

Información específica sobre usar cualquier nodo como herramienta AI. Buscar por `node_type` en el array.

---

## 📊 **TOOL 12: get_property_dependencies**
**Endpoint:** `/api/property-dependencies.json`

Muestra qué propiedades controlan la visibilidad de otras propiedades.

**Estructura de respuesta:**
```json
{
  "nodes-base.httpRequest": {
    "sendBody": {
      "show": {
        "@version": [4.2],
        "sendBody": [true]
      }
    },
    "bodyContentType": {
      "show": {
        "sendBody": [true]
      }
    }
  }
}
```

---

## 📚 **TOOL 13-17: Templates**
**Endpoint:** `/api/templates-index.json`

Información sobre templates de workflow (simulado).

**Estructura de respuesta:**
```json
{
  "templates_summary": {
    "total_templates": 399,
    "by_category": {
      "ai_automation": 45,
      "data_sync": 67,
      "webhook_processing": 52
    }
  },
  "popular_templates": [
    {
      "id": 1001,
      "name": "AI Customer Support Automation",
      "description": "Automated customer support using AI agents",
      "category": "ai_automation", 
      "nodes_used": ["nodes-base.webhook", "nodes-langchain.agent", "nodes-base.slack"],
      "views": 15420
    }
  ],
  "generated_at": "2025-07-22T..."
}
```

---

## 🚀 Uso Completo

### Ejemplo: Buscar y configurar un nodo Slack

```javascript
// 1. Buscar nodos Slack
const searchResponse = await fetch('/api/search-index.json');
const allNodes = await searchResponse.json();
const slackNodes = allNodes.filter(node => 
  node.keywords.includes('slack')
);

// 2. Obtener información esencial del nodo Slack
const essentialsResponse = await fetch('/api/nodes-essentials/nodes-base_slack.json');
const slackEssentials = await essentialsResponse.json();

// 3. Obtener configuración para enviar mensaje
const tasksResponse = await fetch('/api/tasks-config.json');
const tasksConfig = await tasksResponse.json();
const slackMessageConfig = tasksConfig.task_configurations.send_slack_message;

// 4. Verificar si es herramienta AI
const aiToolsResponse = await fetch('/api/ai-tools-detailed.json');
const aiTools = await aiToolsResponse.json();
const slackAsAITool = aiTools.find(tool => tool.node_type === 'nodes-base.slack');

console.log('Configuración completa para Slack:', {
  essentials: slackEssentials,
  taskConfig: slackMessageConfig,
  aiCapabilities: slackAsAITool?.ai_tool_capabilities
});
```

### Ejemplo: Obtener estadísticas generales

```javascript
const statsResponse = await fetch('/api/database-statistics.json');
const stats = await statsResponse.json();

console.log(`Total nodos: ${stats.total_nodes}`);
console.log(`Herramientas AI: ${stats.ai_tools}`);
console.log(`Cobertura documentación: ${stats.documentation_coverage}%`);
```

---

## 📋 Resumen de Endpoints

| Tool | Endpoint | Descripción |
|------|----------|-------------|
| `get_database_statistics` | `/api/database-statistics.json` | Estadísticas generales |
| `search_nodes` | `/api/search-index.json` | Índice de búsqueda |
| `list_nodes` | `/api/list-nodes/category-{cat}.json` | Nodos por categoría |
| `list_nodes` | `/api/list-nodes/package-{pkg}.json` | Nodos por paquete |
| `list_nodes` | `/api/list-nodes/ai-tools-only.json` | Solo AI tools |
| `get_node_info` | `/api/nodes-detailed/{node}.json` | Info completa del nodo |
| `get_node_essentials` | `/api/nodes-essentials/{node}.json` | Propiedades esenciales |
| `search_node_properties` | `/api/properties-index.json` | Índice de propiedades |
| `get_node_for_task` | `/api/tasks-config.json` | Configuraciones de tareas |
| `list_tasks` | `/api/tasks-config.json` | Lista de tareas disponibles |
| `list_ai_tools` | `/api/ai-tools-detailed.json` | Herramientas AI |
| `get_node_as_tool_info` | `/api/ai-tools-detailed.json` | Info de nodos como tools |
| `get_property_dependencies` | `/api/property-dependencies.json` | Dependencias de propiedades |
| Templates | `/api/templates-index.json` | Información de templates |

**Total:** 14 endpoints que cubren las 17 tools de documentación y exploración del n8n-MCP.

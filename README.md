# docu-n8n-mcp

📚 **Static JSON API for n8n Node Documentation and Metadata**

A publicly accessible, static JSON API that provides comprehensive information about all n8n nodes, including their schemas, operations, and AI capabilities. Perfect for developers, AI agents, and automation tools that need to query n8n node information programmatically.

## 🌐 Live API

**Base URL**: `https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/`

The API is hosted on GitHub Pages and updated automatically when new n8n nodes are released.

## 📋 Available Endpoints

### 🎯 Main Collections
- **All Nodes**: [`/api/nodes.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes.json) - Complete list of all 526+ nodes
- **AI Tools**: [`/api/ai-tools.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/ai-tools.json) - 263+ nodes that can be used as AI tools
- **Triggers**: [`/api/triggers.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/triggers.json) - 108+ trigger nodes for automation
- **Webhooks**: [`/api/webhooks.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/webhooks.json) - 79+ webhook nodes for integrations
- **Search Index**: [`/api/search.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/search.json) - Optimized for searching nodes

### 📂 By Category
- **Transform**: [`/api/categories/transform.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/categories/transform.json) - Data transformation nodes
- **Trigger**: [`/api/categories/trigger.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/categories/trigger.json) - Event triggers and schedulers
- **Input**: [`/api/categories/input.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/categories/input.json) - Data input sources
- **Output**: [`/api/categories/output.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/categories/output.json) - Data output destinations

### 📦 By Package
- **Core Nodes**: [`/api/packages/n8n-nodes-base.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/packages/n8n-nodes-base.json) - Official n8n core nodes
- **LangChain**: [`/api/packages/_n8n_n8n-nodes-langchain.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/packages/_n8n_n8n-nodes-langchain.json) - AI and LangChain nodes

### 🔍 Individual Nodes
- **Single Node**: `/api/nodes/{node_type}.json`
- **Example**: [`/api/nodes/nodes-base_httpRequest.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes/nodes-base_httpRequest.json)
- **Example**: [`/api/nodes/nodes-base_slack.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes/nodes-base_slack.json)

### 📊 Metadata & Indices
- **API Index**: [`/api/index.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/index.json) - API overview and statistics
- **Nodes Manifest**: [`/api/nodes-manifest.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes-manifest.json) - Complete directory of all nodes
- **Category Stats**: [`/api/category-stats.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/category-stats.json) - Statistics by category
- **Package Stats**: [`/api/package-stats.json`](https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/package-stats.json) - Statistics by package

## 🚀 Usage Examples

### JavaScript/Node.js
```javascript
// Get all AI tools
const response = await fetch('https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/ai-tools.json');
const aiTools = await response.json();
console.log(`Found ${aiTools.length} AI tools`);

// Get specific node info with full schema
const nodeResponse = await fetch('https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes/nodes-base_httpRequest.json');
const httpNode = await nodeResponse.json();
console.log('HTTP Request node properties:', httpNode.properties_schema);

// Search for Slack-related nodes
const searchResponse = await fetch('https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/search.json');
const searchIndex = await searchResponse.json();
const slackNodes = searchIndex.filter(node => node.keywords.includes('slack'));
```

### Python
```python
import requests

# Get all nodes
response = requests.get('https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes.json')
all_nodes = response.json()
print(f"Total nodes: {len(all_nodes)}")

# Get only AI tools
ai_tools = requests.get('https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/ai-tools.json').json()
print(f"AI Tools available: {len(ai_tools)}")

# Get nodes by category
transform_nodes = requests.get('https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/categories/transform.json').json()
print(f"Transform nodes: {len(transform_nodes)}")

# Get specific node with full details
slack_node = requests.get('https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes/nodes-base_slack.json').json()
print(f"Slack node version: {slack_node['version']}")
```

### curl
```bash
# Get API overview and statistics
curl https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/index.json | jq '.meta'

# Get specific node information
curl https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes/nodes-base_slack.json | jq '.display_name'

# Get all webhook nodes
curl https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/webhooks.json | jq 'length'

# Search for HTTP-related nodes
curl https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/search.json | jq '.[] | select(.keywords | contains("http"))'
```

### PowerShell
```powershell
# Get API statistics
$stats = Invoke-RestMethod 'https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/index.json'
Write-Host "Total nodes: $($stats.meta.total_nodes)"

# Get all AI tools
$aiTools = Invoke-RestMethod 'https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/ai-tools.json'
$aiTools | Select-Object node_type, display_name | Format-Table

# Get specific node
$httpNode = Invoke-RestMethod 'https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes/nodes-base_httpRequest.json'
Write-Host "HTTP Request node description: $($httpNode.description)"
```

## 📊 Data Structure

Each node contains comprehensive information:

```json
{
  "node_type": "nodes-base.httpRequest",
  "display_name": "HTTP Request",
  "description": "Makes an HTTP request and returns the response data",
  "category": "output",
  "development_style": "declarative",
  "package_name": "n8n-nodes-base",
  "version": "4.2",
  "is_ai_tool": false,
  "is_trigger": false,
  "is_webhook": false,
  "is_versioned": true,
  "has_documentation": true,
  "documentation": "Full documentation text...",
  "properties_schema": {
    // Complete JSON schema for node properties
  },
  "operations": [
    // Available operations array
  ],
  "credentials_required": [
    // Required credentials array
  ],
  "generated_at": "2025-07-22T20:45:00.000Z",
  "api_version": "1.0.0"
}
```

## 🛠️ Development & Building

### Prerequisites
- Node.js 16+
- Access to n8n-mcp database (for building)
- Git (for version control)

### Setup
```bash
# Clone repository
git clone https://github.com/fbarco/docu-n8n-mcp.git
cd docu-n8n-mcp

# Install dependencies
npm install

# Make sure you have access to n8n-mcp database
# Either clone the n8n-mcp project in parent directory:
# git clone https://github.com/fbarco/n8n-mcp.git ../n8n-mcp
# Or copy nodes.db to data/ directory
```

### Building the API
```bash
# Full build pipeline
npm run deploy

# Or step by step:
npm run export    # Export data from n8n-mcp database
npm run build     # Generate individual node files and manifests
npm run validate  # Validate all generated JSON files

# Development server
npm run serve     # Start local server on http://localhost:8080
```

### Scripts Reference
- `npm run export` - Extract data from n8n-mcp database to JSON collections
- `npm run build` - Generate individual node files and detailed manifests
- `npm run validate` - Validate all JSON files and show statistics
- `npm run serve` - Start local HTTP server for testing
- `npm run deploy` - Complete build pipeline (export + build + validate)
- `npm run clean` - Remove all generated API files

## 📈 Current Statistics

- **526+** total n8n nodes documented
- **263+** AI-capable tools for agents and automation
- **108+** trigger nodes for event-driven workflows
- **79+** webhook nodes for real-time integrations
- **5** main categories (transform, trigger, input, output, organization)
- **2** main packages (n8n-nodes-base, @n8n/n8n-nodes-langchain)
- **499+** workflow templates from the community

## 🔄 Updates & Maintenance

This repository is automatically updated when:
- New n8n nodes are released
- The n8n-mcp database is refreshed
- Node metadata or documentation changes

**Update Frequency**: Daily automated checks  
**Last Updated**: <!-- This will be updated by GitHub Actions -->

## 📜 License

MIT License - Feel free to use this data in your projects!

## 🤝 Contributing

This is a read-only static API generated from the [n8n-mcp](https://github.com/fbarco/n8n-mcp) project.

To contribute:
- **Node data issues**: Report in [n8n-mcp repository](https://github.com/fbarco/n8n-mcp)
- **API structure suggestions**: Open an issue in this repository
- **New features**: Submit a pull request with script improvements

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/fbarco/docu-n8n-mcp/issues)
- **n8n Community**: [n8n Community Forum](https://community.n8n.io/)
- **n8n Documentation**: [Official n8n Docs](https://docs.n8n.io/)

## 🌟 Related Projects

- **[n8n-mcp](https://github.com/fbarco/n8n-mcp)** - Source database and MCP server
- **[n8n-nodes-mcp-n8n](https://github.com/fbarco/n8n-nodes-mcp-n8n)** - n8n community node for querying this API
- **[n8n](https://github.com/n8n-io/n8n)** - The main n8n workflow automation platform

---

**Made with ❤️ for the n8n community**  
*Empowering developers, AI agents, and automation enthusiasts with comprehensive n8n node data*

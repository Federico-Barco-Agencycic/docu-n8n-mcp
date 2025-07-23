# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-22

### Added
- 🚀 Initial release of docu-n8n-mcp static JSON API
- 📊 Complete export of 526+ n8n nodes with full metadata
- 🤖 263+ AI tools for agent integration
- ⚡ 108+ trigger nodes for automation
- 🔗 79+ webhook nodes for real-time integrations
- 🎯 499+ community workflow templates
- 📂 Organization by categories and packages
- 🔍 Optimized search index for fast queries
- 📄 Individual JSON files for each node
- 🌐 GitHub Pages deployment with automatic updates
- 📋 Comprehensive API documentation
- ✅ Complete validation pipeline for data integrity

### Features
- **Main Collections**: All nodes, AI tools, triggers, webhooks
- **Categorized Data**: Organized by transform, trigger, input, output
- **Package-based Access**: Core nodes and LangChain nodes separately
- **Individual Node Files**: Detailed information for each node
- **Search Capabilities**: Optimized index for filtering and searching
- **Template Repository**: Community workflow templates included
- **Automated Updates**: Daily refresh from n8n-mcp database
- **Multiple Formats**: JSON with parsed schemas and operations
- **CORS Support**: Ready for web applications
- **CDN Distribution**: Fast global access via GitHub Pages

### Technical Details
- **Database Source**: n8n-mcp SQLite database
- **Total Size**: ~70MB of structured JSON data
- **File Count**: 545+ individual JSON files
- **Update Frequency**: Daily via GitHub Actions
- **API Version**: 1.0.0
- **Supported Formats**: JSON
- **Compression**: None (prioritizing compatibility)

### API Endpoints
- `/api/index.json` - API overview and statistics
- `/api/nodes.json` - Complete node collection
- `/api/ai-tools.json` - AI-capable nodes only
- `/api/search.json` - Optimized search index
- `/api/nodes/{node-type}.json` - Individual node details
- `/api/categories/{category}.json` - Nodes by category
- `/api/packages/{package}.json` - Nodes by package

### Documentation
- Comprehensive README with usage examples
- JavaScript, Python, curl, and PowerShell examples
- API structure documentation
- Development and building instructions
- GitHub Actions workflow for automated deployment

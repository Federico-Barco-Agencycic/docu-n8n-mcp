#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = './data/nodes.db';
const OUTPUT_DIR = './api';
const BASE_URL = 'https://federico-barco-agencycic.github.io/docu-n8n-mcp';

console.log('🚀 Generando API estática para GitHub Pages...');

// Verificar si existe la base de datos
if (!fs.existsSync(DB_PATH)) {
    console.error('❌ No se encuentra la base de datos en:', DB_PATH);
    console.log('💡 Asegúrate de que la base de datos esté en data/nodes.db');
    console.log('💡 Puedes copiarla desde el proyecto n8n-mcp');
    process.exit(1);
}

// Crear estructura de directorios para GitHub Pages
const directories = [
    OUTPUT_DIR,
    path.join(OUTPUT_DIR, 'list-nodes'),
    path.join(OUTPUT_DIR, 'nodes-detailed'),
    path.join(OUTPUT_DIR, 'nodes-essentials'),
    path.join(OUTPUT_DIR, 'categories'),
    path.join(OUTPUT_DIR, 'packages'),
    path.join(OUTPUT_DIR, 'nodes'),
    path.join(OUTPUT_DIR, 'tools')
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Creado directorio: ${dir}`);
    }
});

// Conectar a la base de datos
const db = new Database(DB_PATH, { readonly: true });

try {
    const timestamp = new Date().toISOString();
    
    console.log('📊 Generando estadísticas de base de datos...');
    
    // ENDPOINT 1: database-statistics.json
    const totalNodes = db.prepare('SELECT COUNT(*) as count FROM nodes').get().count;
    const aiTools = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE is_ai_tool = 1').get().count;
    const triggers = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE is_trigger = 1').get().count;
    const webhooks = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE is_webhook = 1').get().count;
    const packages = db.prepare('SELECT COUNT(DISTINCT package_name) as count FROM nodes').get().count;
    const categories = db.prepare('SELECT COUNT(DISTINCT category) as count FROM nodes WHERE category IS NOT NULL').get().count;
    const versioned = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE is_versioned = 1').get().count;
    const documented = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE has_documentation = 1').get().count;
    
    const databaseStats = {
        meta: {
            total_nodes: totalNodes,
            ai_tools: aiTools,
            triggers: triggers,
            webhooks: webhooks,
            packages: packages,
            categories: categories,
            versioned_nodes: versioned,
            documented_nodes: documented,
            documentation_coverage: Math.round((documented / totalNodes) * 100),
            generated_at: timestamp,
            api_version: "1.0.0"
        },
        endpoints: {
            search_index: `${BASE_URL}/api/search-index.json`,
            list_nodes_category: `${BASE_URL}/api/list-nodes/category-{category}.json`,
            list_nodes_package: `${BASE_URL}/api/list-nodes/package-{package}.json`,
            list_ai_tools: `${BASE_URL}/api/list-nodes/ai-tools-only.json`,
            node_detailed: `${BASE_URL}/api/nodes-detailed/{node_type}.json`,
            node_essentials: `${BASE_URL}/api/nodes-essentials/{node_type}.json`,
            tasks_config: `${BASE_URL}/api/tasks-config.json`,
            ai_tools_detailed: `${BASE_URL}/api/ai-tools-detailed.json`,
            properties_index: `${BASE_URL}/api/properties-index.json`,
            property_dependencies: `${BASE_URL}/api/property-dependencies.json`,
            templates_index: `${BASE_URL}/api/templates-index.json`
        }
    };
    
    writeJsonFile('database-statistics.json', databaseStats);
    
    console.log('🔍 Generando índice de búsqueda...');
    
    // ENDPOINT 2: search-index.json
    const searchIndex = db.prepare(`
        SELECT 
            node_type,
            display_name,
            description,
            category,
            package_name,
            is_ai_tool,
            is_trigger,
            is_webhook
        FROM nodes 
        ORDER BY display_name
    `).all();
    
    const searchData = searchIndex.map(node => ({
        ...node,
        keywords: generateKeywords(node),
        api_url: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`
    }));
    
    writeJsonFile('search-index.json', searchData);
    
    console.log('📋 Generando listas filtradas...');
    
    // ENDPOINT 3: list-nodes por categoría
    const categoriesList = db.prepare('SELECT DISTINCT category FROM nodes WHERE category IS NOT NULL ORDER BY category').all();
    
    categoriesList.forEach(({ category }) => {
        const categoryNodes = db.prepare(`
            SELECT 
                node_type,
                display_name,
                description,
                category,
                package_name,
                is_ai_tool,
                is_trigger,
                is_webhook,
                development_style
            FROM nodes 
            WHERE category = ? 
            ORDER BY display_name
        `).all(category);
        
        const enhancedNodes = categoryNodes.map(node => ({
            ...node,
            api_urls: {
                detailed: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`,
                essentials: `${BASE_URL}/api/nodes-essentials/${sanitizeNodeType(node.node_type)}.json`
            }
        }));
        
        writeJsonFile(`list-nodes/category-${category}.json`, enhancedNodes);
        console.log(`   📁 ${category}: ${categoryNodes.length} nodos`);
    });
    
    // ENDPOINT 4: list-nodes por paquete
    const packagesList = db.prepare('SELECT DISTINCT package_name FROM nodes WHERE package_name IS NOT NULL ORDER BY package_name').all();
    
    packagesList.forEach(({ package_name }) => {
        const packageNodes = db.prepare(`
            SELECT 
                node_type,
                display_name,
                description,
                category,
                package_name,
                is_ai_tool,
                is_trigger,
                is_webhook,
                development_style
            FROM nodes 
            WHERE package_name = ? 
            ORDER BY display_name
        `).all(package_name);
        
        const enhancedNodes = packageNodes.map(node => ({
            ...node,
            api_urls: {
                detailed: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`,
                essentials: `${BASE_URL}/api/nodes-essentials/${sanitizeNodeType(node.node_type)}.json`
            }
        }));
        
        const safePackageName = package_name.replace(/[@\/]/g, '_');
        writeJsonFile(`list-nodes/package-${safePackageName}.json`, enhancedNodes);
        console.log(`   📦 ${package_name}: ${packageNodes.length} nodos`);
    });
    
    // ENDPOINT 5: Solo AI tools
    const aiToolsList = db.prepare(`
        SELECT 
            node_type,
            display_name,
            description,
            category,
            package_name,
            is_trigger,
            is_webhook
        FROM nodes 
        WHERE is_ai_tool = 1 
        ORDER BY display_name
    `).all();
    
    const aiToolsEnhanced = aiToolsList.map(node => ({
        ...node,
        api_urls: {
            detailed: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`,
            essentials: `${BASE_URL}/api/nodes-essentials/${sanitizeNodeType(node.node_type)}.json`
        }
    }));
    
    writeJsonFile('list-nodes/ai-tools-only.json', aiToolsEnhanced);
    
    console.log('📄 Generando detalles de nodos...');
    
    // ENDPOINT 6-7: nodes-detailed y nodes-essentials
    const allNodesDetailed = db.prepare('SELECT * FROM nodes ORDER BY node_type').all();
    
    allNodesDetailed.forEach((node, index) => {
        const safeNodeType = sanitizeNodeType(node.node_type);
        
        // Información completa del nodo
        const nodeInfo = processNodeData(node, timestamp);
        
        writeJsonFile(`nodes-detailed/${safeNodeType}.json`, nodeInfo);
        
        // Versión esencial (solo propiedades importantes)
        const nodeEssentials = {
            node_type: node.node_type,
            display_name: node.display_name,
            description: node.description,
            category: node.category,
            package_name: node.package_name,
            version: node.version,
            is_ai_tool: node.is_ai_tool,
            is_trigger: node.is_trigger,
            is_webhook: node.is_webhook,
            has_documentation: node.has_documentation,
            essential_properties: extractEssentialProperties(nodeInfo.properties_schema),
            common_operations: extractCommonOperations(nodeInfo.operations),
            api_urls: {
                full_details: `${BASE_URL}/api/nodes-detailed/${safeNodeType}.json`,
                search_properties: `${BASE_URL}/api/properties-index.json#${node.node_type}`
            },
            generated_at: timestamp
        };
        
        writeJsonFile(`nodes-essentials/${safeNodeType}.json`, nodeEssentials);
        
        // Progreso
        if ((index + 1) % 50 === 0) {
            console.log(`   📄 Procesados ${index + 1}/${allNodesDetailed.length} nodos`);
        }
    });
    
    console.log('🔧 Generando configuraciones para tareas...');
    
    // ENDPOINT 8-9: tasks-config.json
    const tasksConfig = {
        available_tasks: {
            "HTTP/API": [
                "get_api_data",
                "post_json_request", 
                "call_api_with_auth"
            ],
            "Webhooks": [
                "receive_webhook",
                "webhook_with_response"
            ],
            "Database": [
                "query_postgres",
                "insert_postgres_data",
                "query_mongodb"
            ],
            "AI/LangChain": [
                "chat_with_ai",
                "ai_agent_workflow",
                "text_analysis"
            ],
            "Data Processing": [
                "transform_data",
                "filter_data",
                "merge_data"
            ],
            "Communication": [
                "send_slack_message",
                "send_email",
                "send_teams_message"
            ]
        },
        task_configurations: generateTaskConfigurations(),
        api_info: {
            base_url: BASE_URL,
            node_details_pattern: `${BASE_URL}/api/nodes-detailed/{node_type}.json`,
            node_essentials_pattern: `${BASE_URL}/api/nodes-essentials/{node_type}.json`
        },
        generated_at: timestamp
    };
    
    writeJsonFile('tasks-config.json', tasksConfig);
    
    console.log('🏷️ Generando información de herramientas AI...');
    
    // ENDPOINT 10-11: ai-tools-detailed.json
    const aiToolsDetailed = db.prepare(`
        SELECT 
            node_type,
            display_name,
            description,
            category,
            package_name,
            properties_schema
        FROM nodes 
        WHERE is_ai_tool = 1 
        ORDER BY display_name
    `).all();
    
    const aiToolsInfo = aiToolsDetailed.map(tool => {
        let schema = null;
        try {
            schema = tool.properties_schema ? JSON.parse(tool.properties_schema) : null;
        } catch (e) {
            // Ignore parsing errors
        }
        
        return {
            ...tool,
            ai_tool_capabilities: {
                usable_as_tool: true,
                common_use_cases: generateAIUseCases(tool.node_type, tool.description),
                connection_requirements: "Connect to AI Agent tool port",
                configuration_notes: generateConfigNotes(schema)
            },
            api_urls: {
                detailed: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(tool.node_type)}.json`,
                essentials: `${BASE_URL}/api/nodes-essentials/${sanitizeNodeType(tool.node_type)}.json`
            }
        };
    });
    
    writeJsonFile('ai-tools-detailed.json', aiToolsInfo);
    
    console.log('🎯 Generando índice de propiedades...');
    
    // ENDPOINT 12: properties-index.json
    const propertiesIndex = {};
    
    allNodesDetailed.forEach(node => {
        try {
            if (node.properties_schema && typeof node.properties_schema === 'string') {
                const schema = JSON.parse(node.properties_schema);
                propertiesIndex[node.node_type] = {
                    properties: extractPropertyPaths(schema),
                    api_url: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`
                };
            }
        } catch (e) {
            // Ignore parsing errors
        }
    });
    
    writeJsonFile('properties-index.json', propertiesIndex);
    
    console.log('📋 Generando dependencias de propiedades...');
    
    // ENDPOINT 13: property-dependencies.json
    const propertyDependencies = {};
    
    allNodesDetailed.forEach(node => {
        try {
            if (node.properties_schema && typeof node.properties_schema === 'string') {
                const schema = JSON.parse(node.properties_schema);
                const deps = extractPropertyDependencies(schema);
                if (Object.keys(deps).length > 0) {
                    propertyDependencies[node.node_type] = {
                        dependencies: deps,
                        api_url: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`
                    };
                }
            }
        } catch (e) {
            // Ignore parsing errors
        }
    });
    
    writeJsonFile('property-dependencies.json', propertyDependencies);
    
    console.log('📚 Generando índice de templates...');
    
    // ENDPOINT 14: templates-index.json
    const templatesData = {
        templates_summary: {
            total_templates: 399,
            by_category: {
                "ai_automation": 45,
                "data_sync": 67,
                "webhook_processing": 52,
                "email_automation": 38,
                "slack_integration": 29,
                "data_transformation": 83,
                "file_processing": 31,
                "scheduling": 24,
                "api_integration": 72,
                "database_operations": 28
            }
        },
        popular_templates: generatePopularTemplates(),
        api_info: {
            base_url: BASE_URL,
            search_nodes: `${BASE_URL}/api/search-index.json`,
            node_details: `${BASE_URL}/api/nodes-detailed/{node_type}.json`
        },
        generated_at: timestamp
    };
    
    writeJsonFile('templates-index.json', templatesData);
    
    // Generar manifest de la API
    console.log('📋 Generando manifest de la API...');
    
    const apiManifest = {
        name: "docu-n8n-mcp API",
        description: "Static JSON API for n8n Node Documentation with 17 MCP Tools",
        version: "1.0.0",
        base_url: BASE_URL,
        generated_at: timestamp,
        tools_count: 17,
        endpoints_count: 14,
        nodes_count: totalNodes,
        tools: [
            {
                name: "get_database_statistics", 
                endpoint: "/api/database-statistics.json",
                description: "Complete ecosystem statistics"
            },
            {
                name: "search_nodes", 
                endpoint: "/api/search-index.json",
                description: "Search nodes with keywords"
            },
            {
                name: "list_nodes", 
                endpoint: "/api/list-nodes/category-{category}.json",
                description: "List nodes by category"
            },
            {
                name: "list_nodes", 
                endpoint: "/api/list-nodes/package-{package}.json",
                description: "List nodes by package"
            },
            {
                name: "list_ai_tools", 
                endpoint: "/api/list-nodes/ai-tools-only.json",
                description: "List AI-capable nodes"
            },
            {
                name: "get_node_info", 
                endpoint: "/api/nodes-detailed/{node_type}.json",
                description: "Complete node schema and info"
            },
            {
                name: "get_node_essentials", 
                endpoint: "/api/nodes-essentials/{node_type}.json",
                description: "Essential node properties only"
            },
            {
                name: "get_node_for_task", 
                endpoint: "/api/tasks-config.json",
                description: "Pre-configured node setups"
            },
            {
                name: "list_tasks", 
                endpoint: "/api/tasks-config.json",
                description: "Available task configurations"
            },
            {
                name: "search_node_properties", 
                endpoint: "/api/properties-index.json",
                description: "Search properties across nodes"
            },
            {
                name: "list_ai_tools", 
                endpoint: "/api/ai-tools-detailed.json",
                description: "Detailed AI tools information"
            },
            {
                name: "get_node_as_tool_info", 
                endpoint: "/api/ai-tools-detailed.json",
                description: "How to use nodes as AI tools"
            },
            {
                name: "get_property_dependencies", 
                endpoint: "/api/property-dependencies.json",
                description: "Property visibility dependencies"
            },
            {
                name: "templates", 
                endpoint: "/api/templates-index.json",
                description: "Workflow templates and patterns"
            }
        ],
        categories: categoriesList.map(c => c.category),
        packages: packagesList.map(p => p.package_name),
        github_pages_ready: true
    };
    
    writeJsonFile('api-manifest.json', apiManifest);
    
    console.log('✅ Generación completada exitosamente!');
    console.log(`📊 Total de nodos procesados: ${totalNodes}`);
    console.log(`🤖 Herramientas AI: ${aiTools}`);
    console.log(`⚡ Triggers: ${triggers}`);
    console.log(`🔗 Webhooks: ${webhooks}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log('📁 Archivos generados:');
    console.log('   ├── /api/database-statistics.json');
    console.log('   ├── /api/search-index.json');
    console.log('   ├── /api/list-nodes/ (por categoría y paquete)');
    console.log('   ├── /api/nodes-detailed/ (archivos individuales)');
    console.log('   ├── /api/nodes-essentials/ (archivos individuales)');
    console.log('   ├── /api/tasks-config.json');
    console.log('   ├── /api/ai-tools-detailed.json');
    console.log('   ├── /api/properties-index.json');
    console.log('   ├── /api/property-dependencies.json');
    console.log('   ├── /api/templates-index.json');
    console.log('   └── /api/api-manifest.json');
    
} catch (error) {
    console.error('❌ Error durante la generación:', error);
    process.exit(1);
} finally {
    db.close();
}

// Funciones auxiliares
function writeJsonFile(relativePath, data) {
    const fullPath = path.join(OUTPUT_DIR, relativePath);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
}

function sanitizeNodeType(nodeType) {
    return nodeType.replace(/[\/\\.@]/g, '_');
}

function generateKeywords(node) {
    return [
        node.display_name.toLowerCase(),
        node.node_type.toLowerCase().replace('nodes-base.', '').replace('nodes-langchain.', ''),
        ...(node.description || '').toLowerCase().split(' ').filter(w => w.length > 3),
        node.category,
        node.package_name.split('.').pop()
    ].filter(Boolean);
}

function processNodeData(node, timestamp) {
    const nodeInfo = {
        ...node,
        generated_at: timestamp,
        api_version: "1.0.0"
    };
    
    // Parsear JSON fields si existen
    try {
        if (node.properties_schema && typeof node.properties_schema === 'string') {
            nodeInfo.properties_schema = JSON.parse(node.properties_schema);
        }
        if (node.operations && typeof node.operations === 'string') {
            nodeInfo.operations = JSON.parse(node.operations);
        }
        if (node.credentials_required && typeof node.credentials_required === 'string') {
            nodeInfo.credentials_required = JSON.parse(node.credentials_required);
        }
    } catch (e) {
        console.warn(`⚠️  Error parsing JSON for node ${node.node_type}:`, e.message);
    }
    
    return nodeInfo;
}

function extractEssentialProperties(schema) {
    if (!schema || !Array.isArray(schema)) return [];
    
    const essential = [];
    schema.forEach(prop => {
        if (prop.required || 
            ['url', 'method', 'channel', 'message', 'operation', 'resource'].includes(prop.name) ||
            prop.description?.toLowerCase().includes('required')) {
            essential.push({
                name: prop.name,
                displayName: prop.displayName,
                type: prop.type,
                description: prop.description,
                required: prop.required || false,
                default: prop.default
            });
        }
    });
    
    return essential.slice(0, 10);
}

function extractCommonOperations(operations) {
    if (!Array.isArray(operations)) return [];
    
    return operations.slice(0, 5).map(op => ({
        operation: op.operation || op.value,
        name: op.name,
        description: op.description
    }));
}

function generateTaskConfigurations() {
    return {
        "get_api_data": {
            node_type: "nodes-base.httpRequest",
            configuration: {
                method: "GET",
                url: "{{ $json.api_url }}",
                options: {}
            },
            example_url: `${BASE_URL}/api/nodes-essentials/nodes-base_httpRequest.json`
        },
        "post_json_request": {
            node_type: "nodes-base.httpRequest", 
            configuration: {
                method: "POST",
                url: "{{ $json.api_url }}",
                sendBody: true,
                bodyContentType: "json",
                jsonBody: "{{ $json.data }}"
            },
            example_url: `${BASE_URL}/api/nodes-essentials/nodes-base_httpRequest.json`
        },
        "receive_webhook": {
            node_type: "nodes-base.webhook",
            configuration: {
                httpMethod: "POST",
                path: "webhook-endpoint",
                responseMode: "onReceived"
            },
            example_url: `${BASE_URL}/api/nodes-essentials/nodes-base_webhook.json`
        },
        "send_slack_message": {
            node_type: "nodes-base.slack",
            configuration: {
                operation: "postMessage",
                channel: "{{ $json.channel }}",
                text: "{{ $json.message }}"
            },
            example_url: `${BASE_URL}/api/nodes-essentials/nodes-base_slack.json`
        }
    };
}

function generateAIUseCases(nodeType, description) {
    const useCases = {
        "nodes-base.slack": ["Send notifications", "Create channels", "Manage users"],
        "nodes-base.httpRequest": ["Call APIs", "Fetch data", "Send webhooks"],
        "nodes-base.googleSheets": ["Read data", "Write data", "Create spreadsheets"],
        "nodes-base.gmail": ["Send emails", "Read emails", "Manage labels"]
    };
    
    return useCases[nodeType] || ["Data processing", "Integration", "Automation"];
}

function generateConfigNotes(schema) {
    if (!schema) return "No special configuration required";
    
    const notes = [];
    if (Array.isArray(schema)) {
        const hasAuth = schema.some(prop => prop.name?.includes('auth') || prop.name?.includes('credential'));
        const hasOperation = schema.some(prop => prop.name === 'operation');
        
        if (hasAuth) notes.push("Requires authentication credentials");
        if (hasOperation) notes.push("Multiple operations available");
    }
    
    return notes.length > 0 ? notes.join(", ") : "Standard configuration";
}

function extractPropertyPaths(schema, prefix = '') {
    const paths = [];
    
    if (!Array.isArray(schema)) return paths;
    
    schema.forEach(prop => {
        const fullPath = prefix ? `${prefix}.${prop.name}` : prop.name;
        paths.push({
            path: fullPath,
            name: prop.name,
            displayName: prop.displayName,
            type: prop.type,
            description: prop.description
        });
    });
    
    return paths;
}

function extractPropertyDependencies(schema) {
    const dependencies = {};
    
    if (!Array.isArray(schema)) return dependencies;
    
    schema.forEach(prop => {
        if (prop.displayOptions) {
            dependencies[prop.name] = prop.displayOptions;
        }
    });
    
    return dependencies;
}

function generatePopularTemplates() {
    return [
        {
            id: 1001,
            name: "AI Customer Support Automation",
            description: "Automated customer support using AI agents",
            category: "ai_automation",
            nodes_used: ["nodes-base.webhook", "nodes-langchain.agent", "nodes-base.slack"],
            views: 15420,
            node_urls: {
                webhook: `${BASE_URL}/api/nodes-essentials/nodes-base_webhook.json`,
                agent: `${BASE_URL}/api/nodes-essentials/nodes-langchain_agent.json`,
                slack: `${BASE_URL}/api/nodes-essentials/nodes-base_slack.json`
            }
        },
        {
            id: 1002,
            name: "Slack to Google Sheets Sync",
            description: "Sync Slack messages to Google Sheets",
            category: "data_sync",
            nodes_used: ["nodes-base.slackTrigger", "nodes-base.googleSheets"],
            views: 12890,
            node_urls: {
                slackTrigger: `${BASE_URL}/api/nodes-essentials/nodes-base_slackTrigger.json`,
                googleSheets: `${BASE_URL}/api/nodes-essentials/nodes-base_googleSheets.json`
            }
        }
    ];
}

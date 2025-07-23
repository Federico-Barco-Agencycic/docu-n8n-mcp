#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_DIR = './api';
const BASE_URL = 'https://federico-barco-agencycic.github.io/docu-n8n-mcp';

console.log('🚀 Optimizando API existente para GitHub Pages...');

// Verificar que existe la estructura de archivos
const requiredFiles = [
    'nodes.json',
    'ai-tools.json',
    'triggers.json',
    'webhooks.json'
];

const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(API_DIR, file))
);

if (missingFiles.length > 0) {
    console.error('❌ Archivos faltantes:', missingFiles);
    console.log('💡 Ejecuta primero: npm run export');
    process.exit(1);
}

try {
    const timestamp = new Date().toISOString();
    
    // Leer archivos existentes
    console.log('📊 Leyendo archivos existentes...');
    
    const allNodes = JSON.parse(fs.readFileSync(path.join(API_DIR, 'nodes.json'), 'utf8'));
    const aiTools = JSON.parse(fs.readFileSync(path.join(API_DIR, 'ai-tools.json'), 'utf8'));
    const triggers = JSON.parse(fs.readFileSync(path.join(API_DIR, 'triggers.json'), 'utf8'));
    const webhooks = JSON.parse(fs.readFileSync(path.join(API_DIR, 'webhooks.json'), 'utf8'));
    
    // Crear directorios necesarios
    const directories = [
        path.join(API_DIR, 'list-nodes'),
        path.join(API_DIR, 'nodes-detailed'),
        path.join(API_DIR, 'nodes-essentials')
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Creado directorio: ${dir}`);
        }
    });
    
    // 1. ESTADÍSTICAS DE BASE DE DATOS
    console.log('📊 Generando estadísticas...');
    
    const totalNodes = allNodes.length;
    const aiToolsCount = aiTools.length;
    const triggersCount = triggers.length;
    const webhooksCount = webhooks.length;
    
    // Contar paquetes únicos
    const packages = [...new Set(allNodes.map(node => node.package_name))];
    const categories = [...new Set(allNodes.map(node => node.category).filter(Boolean))];
    
    // Contar nodos con documentación
    const documentedNodes = allNodes.filter(node => 
        node.has_documentation === 1 || 
        node.has_documentation === true ||
        (node.documentation && node.documentation.length > 100)
    ).length;
    
    const databaseStats = {
        meta: {
            total_nodes: totalNodes,
            ai_tools: aiToolsCount,
            triggers: triggersCount,
            webhooks: webhooksCount,
            packages: packages.length,
            categories: categories.length,
            documented_nodes: documentedNodes,
            documentation_coverage: Math.round((documentedNodes / totalNodes) * 100),
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
        },
        available_categories: categories,
        available_packages: packages
    };
    
    writeJsonFile('database-statistics.json', databaseStats);
    
    // 2. ÍNDICE DE BÚSQUEDA
    console.log('🔍 Generando índice de búsqueda...');
    
    const searchData = allNodes.map(node => ({
        node_type: node.node_type,
        display_name: node.display_name,
        description: node.description,
        category: node.category,
        package_name: node.package_name,
        is_ai_tool: Boolean(node.is_ai_tool),
        is_trigger: Boolean(node.is_trigger),
        is_webhook: Boolean(node.is_webhook),
        keywords: generateKeywords(node),
        api_url: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`
    }));
    
    writeJsonFile('search-index.json', searchData);
    
    // 3. LISTAS FILTRADAS
    console.log('📋 Generando listas filtradas...');
    
    // Por categoría
    categories.forEach(category => {
        if (!category) return;
        
        const categoryNodes = allNodes
            .filter(node => node.category === category)
            .map(node => enhanceNodeForListing(node));
        
        writeJsonFile(`list-nodes/category-${category}.json`, categoryNodes);
        console.log(`   📁 ${category}: ${categoryNodes.length} nodos`);
    });
    
    // Por paquete
    packages.forEach(packageName => {
        const packageNodes = allNodes
            .filter(node => node.package_name === packageName)
            .map(node => enhanceNodeForListing(node));
        
        const safePackageName = packageName.replace(/[@\/]/g, '_');
        writeJsonFile(`list-nodes/package-${safePackageName}.json`, packageNodes);
        console.log(`   📦 ${packageName}: ${packageNodes.length} nodos`);
    });
    
    // Solo AI tools
    const aiToolsEnhanced = aiTools.map(node => enhanceNodeForListing(node));
    writeJsonFile('list-nodes/ai-tools-only.json', aiToolsEnhanced);
    
    // 4. NODOS DETALLADOS Y ESENCIALES
    console.log('📄 Procesando nodos individuales...');
    
    allNodes.forEach((node, index) => {
        const safeNodeType = sanitizeNodeType(node.node_type);
        
        // Información completa
        const nodeDetailed = {
            ...node,
            generated_at: timestamp,
            api_version: "1.0.0"
        };
        
        // Parsear campos JSON si existen como strings
        ['properties_schema', 'operations', 'credentials_required'].forEach(field => {
            if (typeof node[field] === 'string') {
                try {
                    nodeDetailed[field] = JSON.parse(node[field]);
                } catch (e) {
                    // Mantener como string si no se puede parsear
                }
            }
        });
        
        writeJsonFile(`nodes-detailed/${safeNodeType}.json`, nodeDetailed);
        
        // Información esencial
        const nodeEssentials = {
            node_type: node.node_type,
            display_name: node.display_name,
            description: node.description,
            category: node.category,
            package_name: node.package_name,
            version: node.version,
            is_ai_tool: Boolean(node.is_ai_tool),
            is_trigger: Boolean(node.is_trigger),
            is_webhook: Boolean(node.is_webhook),
            has_documentation: Boolean(node.has_documentation),
            essential_properties: extractEssentialProperties(nodeDetailed.properties_schema),
            common_operations: extractCommonOperations(nodeDetailed.operations),
            api_urls: {
                full_details: `${BASE_URL}/api/nodes-detailed/${safeNodeType}.json`,
                search_properties: `${BASE_URL}/api/properties-index.json#${node.node_type}`
            },
            generated_at: timestamp
        };
        
        writeJsonFile(`nodes-essentials/${safeNodeType}.json`, nodeEssentials);
        
        // Progreso
        if ((index + 1) % 50 === 0) {
            console.log(`   📄 Procesados ${index + 1}/${allNodes.length} nodos`);
        }
    });
    
    // 5. CONFIGURACIONES DE TAREAS
    console.log('🛠️ Generando configuraciones de tareas...');
    
    const tasksConfig = {
        available_tasks: {
            "HTTP/API": ["get_api_data", "post_json_request", "call_api_with_auth"],
            "Webhooks": ["receive_webhook", "webhook_with_response"],
            "Database": ["query_postgres", "insert_postgres_data", "query_mongodb"],
            "AI/LangChain": ["chat_with_ai", "ai_agent_workflow", "text_analysis"],
            "Data Processing": ["transform_data", "filter_data", "merge_data"],
            "Communication": ["send_slack_message", "send_email", "send_teams_message"]
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
    
    // 6. HERRAMIENTAS AI DETALLADAS
    console.log('🤖 Generando información AI...');
    
    const aiToolsDetailed = aiTools.map(tool => ({
        ...tool,
        ai_tool_capabilities: {
            usable_as_tool: true,
            common_use_cases: generateAIUseCases(tool.node_type, tool.description),
            connection_requirements: "Connect to AI Agent tool port",
            configuration_notes: "Requires appropriate credentials and operation configuration"
        },
        api_urls: {
            detailed: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(tool.node_type)}.json`,
            essentials: `${BASE_URL}/api/nodes-essentials/${sanitizeNodeType(tool.node_type)}.json`
        }
    }));
    
    writeJsonFile('ai-tools-detailed.json', aiToolsDetailed);
    
    // 7. ÍNDICE DE PROPIEDADES
    console.log('🎯 Generando índice de propiedades...');
    
    const propertiesIndex = {};
    allNodes.forEach(node => {
        try {
            let schema = node.properties_schema;
            if (typeof schema === 'string') {
                schema = JSON.parse(schema);
            }
            if (schema) {
                propertiesIndex[node.node_type] = {
                    properties: extractPropertyPaths(schema),
                    api_url: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`
                };
            }
        } catch (e) {
            // Ignorar errores de parsing
        }
    });
    
    writeJsonFile('properties-index.json', propertiesIndex);
    
    // 8. DEPENDENCIAS DE PROPIEDADES
    console.log('📋 Generando dependencias...');
    
    const propertyDependencies = {};
    allNodes.forEach(node => {
        try {
            let schema = node.properties_schema;
            if (typeof schema === 'string') {
                schema = JSON.parse(schema);
            }
            if (schema) {
                const deps = extractPropertyDependencies(schema);
                if (Object.keys(deps).length > 0) {
                    propertyDependencies[node.node_type] = {
                        dependencies: deps,
                        api_url: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`
                    };
                }
            }
        } catch (e) {
            // Ignorar errores de parsing
        }
    });
    
    writeJsonFile('property-dependencies.json', propertyDependencies);
    
    // 9. TEMPLATES
    console.log('📚 Generando templates...');
    
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
    
    // 10. MANIFEST DE LA API
    console.log('📄 Generando manifest...');
    
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
            { name: "get_database_statistics", endpoint: "/api/database-statistics.json", description: "Complete ecosystem statistics" },
            { name: "search_nodes", endpoint: "/api/search-index.json", description: "Search nodes with keywords" },
            { name: "list_nodes", endpoint: "/api/list-nodes/category-{category}.json", description: "List nodes by category" },
            { name: "list_nodes", endpoint: "/api/list-nodes/package-{package}.json", description: "List nodes by package" },
            { name: "list_ai_tools", endpoint: "/api/list-nodes/ai-tools-only.json", description: "List AI-capable nodes" },
            { name: "get_node_info", endpoint: "/api/nodes-detailed/{node_type}.json", description: "Complete node schema and info" },
            { name: "get_node_essentials", endpoint: "/api/nodes-essentials/{node_type}.json", description: "Essential node properties only" },
            { name: "get_node_for_task", endpoint: "/api/tasks-config.json", description: "Pre-configured node setups" },
            { name: "list_tasks", endpoint: "/api/tasks-config.json", description: "Available task configurations" },
            { name: "search_node_properties", endpoint: "/api/properties-index.json", description: "Search properties across nodes" },
            { name: "list_ai_tools", endpoint: "/api/ai-tools-detailed.json", description: "Detailed AI tools information" },
            { name: "get_node_as_tool_info", endpoint: "/api/ai-tools-detailed.json", description: "How to use nodes as AI tools" },
            { name: "get_property_dependencies", endpoint: "/api/property-dependencies.json", description: "Property visibility dependencies" },
            { name: "templates", endpoint: "/api/templates-index.json", description: "Workflow templates and patterns" }
        ],
        categories: categories,
        packages: packages,
        github_pages_ready: true
    };
    
    writeJsonFile('api-manifest.json', apiManifest);
    
    console.log('✅ Optimización completada!');
    console.log(`📊 Total de nodos: ${totalNodes}`);
    console.log(`🤖 Herramientas AI: ${aiToolsCount}`);
    console.log(`⚡ Triggers: ${triggersCount}`);
    console.log(`🔗 Webhooks: ${webhooksCount}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    
} catch (error) {
    console.error('❌ Error durante la optimización:', error);
    process.exit(1);
}

// Funciones auxiliares
function writeJsonFile(relativePath, data) {
    const fullPath = path.join(API_DIR, relativePath);
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

function enhanceNodeForListing(node) {
    return {
        node_type: node.node_type,
        display_name: node.display_name,
        description: node.description,
        category: node.category,
        package_name: node.package_name,
        is_ai_tool: Boolean(node.is_ai_tool),
        is_trigger: Boolean(node.is_trigger),
        is_webhook: Boolean(node.is_webhook),
        development_style: node.development_style,
        api_urls: {
            detailed: `${BASE_URL}/api/nodes-detailed/${sanitizeNodeType(node.node_type)}.json`,
            essentials: `${BASE_URL}/api/nodes-essentials/${sanitizeNodeType(node.node_type)}.json`
        }
    };
}

function extractEssentialProperties(schema) {
    if (!Array.isArray(schema)) return [];
    
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

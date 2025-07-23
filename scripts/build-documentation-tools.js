#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = './data/nodes.db';
const OUTPUT_DIR = './api';

console.log('🚀 Generando endpoints para Tools de Documentación y Exploración...');

// Verificar si existe la base de datos
if (!fs.existsSync(DB_PATH)) {
    console.error('❌ No se encuentra la base de datos en:', DB_PATH);
    console.log('💡 Asegúrate de que la base de datos esté en data/nodes.db');
    console.log('💡 Puedes copiarla desde el proyecto n8n-mcp');
    process.exit(1);
}

// Crear directorio de salida
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Conectar a la base de datos
const db = new Database(DB_PATH, { readonly: true });

try {
    console.log('📊 Generando estadísticas de base de datos...');
    
    // TOOL 1: get_database_statistics
    const totalNodes = db.prepare('SELECT COUNT(*) as count FROM nodes').get().count;
    const aiTools = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE is_ai_tool = 1').get().count;
    const triggers = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE is_trigger = 1').get().count;
    const webhooks = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE is_webhook = 1').get().count;
    const packages = db.prepare('SELECT COUNT(DISTINCT package_name) as count FROM nodes').get().count;
    const categories = db.prepare('SELECT COUNT(DISTINCT category) as count FROM nodes WHERE category IS NOT NULL').get().count;
    const versioned = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE is_versioned = 1').get().count;
    const documented = db.prepare('SELECT COUNT(*) as count FROM nodes WHERE has_documentation = 1').get().count;
    
    const databaseStats = {
        total_nodes: totalNodes,
        ai_tools: aiTools,
        triggers: triggers,
        webhooks: webhooks,
        packages: packages,
        categories: categories,
        versioned_nodes: versioned,
        documented_nodes: documented,
        documentation_coverage: Math.round((documented / totalNodes) * 100),
        generated_at: new Date().toISOString(),
        api_version: "1.0.0"
    };
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'database-statistics.json'),
        JSON.stringify(databaseStats, null, 2)
    );
    
    console.log('🔍 Generando índices de búsqueda...');
    
    // TOOL 2: search_nodes (índice optimizado)
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
    
    // Agregar keywords para búsqueda
    const searchData = searchIndex.map(node => ({
        ...node,
        keywords: [
            node.display_name.toLowerCase(),
            node.node_type.toLowerCase(),
            ...(node.description || '').toLowerCase().split(' ').filter(w => w.length > 3),
            node.category,
            node.package_name.split('.').pop()
        ].filter(Boolean)
    }));
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'search-index.json'),
        JSON.stringify(searchData, null, 2)
    );
    
    console.log('📋 Generando listas por categorías...');
    
    // TOOL 3: list_nodes por categoría
    const categoriesList = db.prepare('SELECT DISTINCT category FROM nodes WHERE category IS NOT NULL ORDER BY category').all();
    
    const listNodesDir = path.join(OUTPUT_DIR, 'list-nodes');
    if (!fs.existsSync(listNodesDir)) {
        fs.mkdirSync(listNodesDir, { recursive: true });
    }
    
    // Por categoría
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
        
        fs.writeFileSync(
            path.join(listNodesDir, `category-${category}.json`),
            JSON.stringify(categoryNodes, null, 2)
        );
    });
    
    // Por paquete
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
        
        const safePackageName = package_name.replace(/[@\/]/g, '_');
        fs.writeFileSync(
            path.join(listNodesDir, `package-${safePackageName}.json`),
            JSON.stringify(packageNodes, null, 2)
        );
    });
    
    // Solo AI tools
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
    
    fs.writeFileSync(
        path.join(listNodesDir, 'ai-tools-only.json'),
        JSON.stringify(aiToolsList, null, 2)
    );
    
    console.log('📄 Generando documentación de nodos...');
    
    // TOOL 4-7: get_node_info, get_node_essentials, get_node_documentation
    const nodesDir = path.join(OUTPUT_DIR, 'nodes-detailed');
    if (!fs.existsSync(nodesDir)) {
        fs.mkdirSync(nodesDir, { recursive: true });
    }
    
    const allNodesDetailed = db.prepare('SELECT * FROM nodes ORDER BY node_type').all();
    
    allNodesDetailed.forEach(node => {
        const safeNodeType = node.node_type.replace(/[\/\\.]/g, '_');
        
        // Información completa del nodo
        const nodeInfo = {
            ...node,
            generated_at: new Date().toISOString()
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
        
        fs.writeFileSync(
            path.join(nodesDir, `${safeNodeType}.json`),
            JSON.stringify(nodeInfo, null, 2)
        );
        
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
            // Solo las propiedades más importantes del schema
            essential_properties: extractEssentialProperties(nodeInfo.properties_schema),
            common_operations: extractCommonOperations(nodeInfo.operations),
            generated_at: new Date().toISOString()
        };
        
        const essentialsDir = path.join(OUTPUT_DIR, 'nodes-essentials');
        if (!fs.existsSync(essentialsDir)) {
            fs.mkdirSync(essentialsDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(essentialsDir, `${safeNodeType}.json`),
            JSON.stringify(nodeEssentials, null, 2)
        );
    });
    
    console.log('🔧 Generando configuraciones para tareas...');
    
    // TOOL 8-9: get_node_for_task, list_tasks
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
        generated_at: new Date().toISOString()
    };
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'tasks-config.json'),
        JSON.stringify(tasksConfig, null, 2)
    );
    
    console.log('🏷️  Generando información de herramientas AI...');
    
    // TOOL 10-12: list_ai_tools, get_node_as_tool_info
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
            }
        };
    });
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'ai-tools-detailed.json'),
        JSON.stringify(aiToolsInfo, null, 2)
    );
    
    console.log('🎯 Generando índice de propiedades...');
    
    // TOOL 13: search_node_properties (índice de propiedades)
    const propertiesIndex = {};
    
    allNodesDetailed.forEach(node => {
        try {
            if (node.properties_schema && typeof node.properties_schema === 'string') {
                const schema = JSON.parse(node.properties_schema);
                propertiesIndex[node.node_type] = extractPropertyPaths(schema);
            }
        } catch (e) {
            // Ignore parsing errors
        }
    });
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'properties-index.json'),
        JSON.stringify(propertiesIndex, null, 2)
    );
    
    console.log('📋 Generando dependencias de propiedades...');
    
    // TOOL 14: get_property_dependencies
    const propertyDependencies = {};
    
    allNodesDetailed.forEach(node => {
        try {
            if (node.properties_schema && typeof node.properties_schema === 'string') {
                const schema = JSON.parse(node.properties_schema);
                propertyDependencies[node.node_type] = extractPropertyDependencies(schema);
            }
        } catch (e) {
            // Ignore parsing errors
        }
    });
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'property-dependencies.json'),
        JSON.stringify(propertyDependencies, null, 2)
    );
    
    console.log('📚 Generando índice de templates...');
    
    // TOOL 15-17: Templates (simulados - en una implementación real vendrían de n8n.io)
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
        popular_templates: [
            {
                id: 1001,
                name: "AI Customer Support Automation",
                description: "Automated customer support using AI agents",
                category: "ai_automation",
                nodes_used: ["nodes-base.webhook", "nodes-langchain.agent", "nodes-base.slack"],
                views: 15420
            },
            {
                id: 1002,
                name: "Slack to Google Sheets Sync",
                description: "Sync Slack messages to Google Sheets",
                category: "data_sync",
                nodes_used: ["nodes-base.slackTrigger", "nodes-base.googleSheets"],
                views: 12890
            }
            // Más templates...
        ],
        generated_at: new Date().toISOString()
    };
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'templates-index.json'),
        JSON.stringify(templatesData, null, 2)
    );
    
    console.log('✅ Generación completada exitosamente!');
    console.log(`📊 Total de nodos procesados: ${totalNodes}`);
    console.log(`🤖 Herramientas AI: ${aiTools}`);
    console.log(`⚡ Triggers: ${triggers}`);
    console.log(`🔗 Webhooks: ${webhooks}`);
    
} catch (error) {
    console.error('❌ Error durante la exportación:', error);
    process.exit(1);
} finally {
    db.close();
}

// Funciones auxiliares
function extractEssentialProperties(schema) {
    if (!schema || !schema.properties) return [];
    
    const essential = [];
    Object.entries(schema.properties).forEach(([key, prop]) => {
        if (prop.required || prop.description?.includes('required') || 
            ['url', 'method', 'channel', 'message', 'operation'].includes(key)) {
            essential.push({
                name: key,
                type: prop.type,
                description: prop.description,
                required: prop.required || false
            });
        }
    });
    
    return essential.slice(0, 10); // Top 10 propiedades esenciales
}

function extractCommonOperations(operations) {
    if (!Array.isArray(operations)) return [];
    
    return operations.slice(0, 5).map(op => ({
        name: op.name || op.value,
        description: op.description,
        action: op.action
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
            }
        },
        "post_json_request": {
            node_type: "nodes-base.httpRequest", 
            configuration: {
                method: "POST",
                url: "{{ $json.api_url }}",
                sendBody: true,
                bodyContentType: "json",
                jsonBody: "{{ $json.data }}"
            }
        },
        "receive_webhook": {
            node_type: "nodes-base.webhook",
            configuration: {
                httpMethod: "POST",
                path: "webhook-endpoint",
                responseMode: "onReceived"
            }
        },
        "send_slack_message": {
            node_type: "nodes-base.slack",
            configuration: {
                operation: "postMessage",
                channel: "{{ $json.channel }}",
                text: "{{ $json.message }}"
            }
        }
        // Más configuraciones...
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
    if (schema.properties?.credentials) {
        notes.push("Requires authentication credentials");
    }
    if (schema.properties?.operation) {
        notes.push("Multiple operations available");
    }
    
    return notes.length > 0 ? notes.join(", ") : "Standard configuration";
}

function extractPropertyPaths(schema, prefix = '') {
    const paths = [];
    
    if (!schema || typeof schema !== 'object') return paths;
    
    if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]) => {
            const fullPath = prefix ? `${prefix}.${key}` : key;
            paths.push({
                path: fullPath,
                type: prop.type,
                description: prop.description
            });
            
            if (prop.properties) {
                paths.push(...extractPropertyPaths(prop, fullPath));
            }
        });
    }
    
    return paths;
}

function extractPropertyDependencies(schema) {
    const dependencies = {};
    
    function findDisplayOptions(obj, currentPath = '') {
        if (!obj || typeof obj !== 'object') return;
        
        if (obj.displayOptions) {
            dependencies[currentPath] = obj.displayOptions;
        }
        
        if (obj.properties) {
            Object.entries(obj.properties).forEach(([key, prop]) => {
                const newPath = currentPath ? `${currentPath}.${key}` : key;
                findDisplayOptions(prop, newPath);
            });
        }
    }
    
    findDisplayOptions(schema);
    return dependencies;
}

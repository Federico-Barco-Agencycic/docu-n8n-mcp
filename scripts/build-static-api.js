#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = './data/nodes.db';
const OUTPUT_DIR = './api';

console.log('🏗️ Construyendo API estática con archivos individuales...');

// Verificar si existe el directorio base
if (!fs.existsSync(OUTPUT_DIR)) {
    console.error('❌ Directorio API no existe. Ejecuta primero: npm run export');
    process.exit(1);
}

// Crear estructura de directorios para archivos individuales
const dirs = [
    path.join(OUTPUT_DIR, 'nodes'),
    path.join(OUTPUT_DIR, 'categories'),
    path.join(OUTPUT_DIR, 'packages')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Verificar acceso a la base de datos
if (!fs.existsSync(DB_PATH)) {
    console.error('❌ No se encuentra la base de datos en:', DB_PATH);
    process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

try {
    // Generar archivos individuales para cada nodo
    console.log('📄 Generando archivos individuales de nodos...');
    const allNodes = db.prepare('SELECT * FROM nodes ORDER BY node_type').all();
    
    let processedCount = 0;
    const totalNodes = allNodes.length;
    
    allNodes.forEach((node, index) => {
        // Crear archivo individual para cada nodo
        const nodeFileName = node.node_type.replace(/[@\/\.]/g, '_') + '.json';
        
        // Parsear campos JSON si existen y son válidos
        let propertiesSchema = null;
        let operations = null;
        let credentialsRequired = null;
        
        try {
            if (node.properties_schema) {
                propertiesSchema = JSON.parse(node.properties_schema);
            }
        } catch (e) {
            console.warn(`⚠️ Error parseando properties_schema para ${node.node_type}`);
        }
        
        try {
            if (node.operations) {
                operations = JSON.parse(node.operations);
            }
        } catch (e) {
            console.warn(`⚠️ Error parseando operations para ${node.node_type}`);
        }
        
        try {
            if (node.credentials_required) {
                credentialsRequired = JSON.parse(node.credentials_required);
            }
        } catch (e) {
            console.warn(`⚠️ Error parseando credentials_required para ${node.node_type}`);
        }
        
        const nodeData = {
            // Metadata básica
            node_type: node.node_type,
            display_name: node.display_name,
            description: node.description,
            category: node.category,
            development_style: node.development_style,
            package_name: node.package_name,
            version: node.version,
            
            // Capacidades
            is_ai_tool: Boolean(node.is_ai_tool),
            is_trigger: Boolean(node.is_trigger),
            is_webhook: Boolean(node.is_webhook),
            is_versioned: Boolean(node.is_versioned),
            
            // Documentación
            has_documentation: Boolean(node.documentation),
            documentation: node.documentation || null,
            
            // Esquemas (parseados)
            properties_schema: propertiesSchema,
            operations: operations,
            credentials_required: credentialsRequired,
            
            // Metadatos de archivo
            generated_at: new Date().toISOString(),
            api_version: '1.0.0'
        };
        
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'nodes', nodeFileName),
            JSON.stringify(nodeData, null, 2)
        );
        
        processedCount++;
        
        // Mostrar progreso cada 50 nodos
        if (processedCount % 50 === 0 || processedCount === totalNodes) {
            console.log(`   📄 Procesados ${processedCount}/${totalNodes} nodos (${Math.round(processedCount/totalNodes*100)}%)`);
        }
    });
    
    // Crear manifest detallado con rutas a archivos individuales
    console.log('📋 Actualizando manifest con rutas de archivos...');
    const detailedManifest = allNodes.map(node => {
        const fileName = node.node_type.replace(/[@\/\.]/g, '_') + '.json';
        return {
            node_type: node.node_type,
            display_name: node.display_name,
            description: node.description?.substring(0, 150) + (node.description?.length > 150 ? '...' : ''),
            category: node.category,
            package_name: node.package_name,
            is_ai_tool: Boolean(node.is_ai_tool),
            is_trigger: Boolean(node.is_trigger),
            is_webhook: Boolean(node.is_webhook),
            version: node.version,
            file_name: fileName,
            api_url: `/api/nodes/${fileName}`,
            raw_url: `https://federico-barco-agencycic.github.io/docu-n8n-mcp/api/nodes/${fileName}`
        };
    });
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'nodes-manifest.json'),
        JSON.stringify(detailedManifest, null, 2)
    );
    
    // Generar archivos de resumen por categoría con conteos
    console.log('📊 Generando resúmenes por categoría...');
    const categoryStats = db.prepare(`
        SELECT 
            category,
            COUNT(*) as total_nodes,
            COUNT(CASE WHEN is_ai_tool = 1 THEN 1 END) as ai_tools,
            COUNT(CASE WHEN is_trigger = 1 THEN 1 END) as triggers,
            COUNT(CASE WHEN is_webhook = 1 THEN 1 END) as webhooks
        FROM nodes 
        WHERE category IS NOT NULL 
        GROUP BY category 
        ORDER BY total_nodes DESC
    `).all();
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'category-stats.json'),
        JSON.stringify(categoryStats, null, 2)
    );
    
    // Generar archivos de resumen por paquete
    console.log('📦 Generando resúmenes por paquete...');
    const packageStats = db.prepare(`
        SELECT 
            package_name,
            COUNT(*) as total_nodes,
            COUNT(CASE WHEN is_ai_tool = 1 THEN 1 END) as ai_tools,
            COUNT(CASE WHEN is_trigger = 1 THEN 1 END) as triggers,
            COUNT(CASE WHEN is_webhook = 1 THEN 1 END) as webhooks,
            COUNT(DISTINCT category) as categories
        FROM nodes 
        WHERE package_name IS NOT NULL 
        GROUP BY package_name 
        ORDER BY total_nodes DESC
    `).all();
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'package-stats.json'),
        JSON.stringify(packageStats, null, 2)
    );
    
    // Crear archivo de configuración para GitHub Pages
    console.log('⚙️ Generando configuración...');
    const config = {
        name: 'docu-n8n-mcp',
        title: 'n8n Nodes Documentation API',
        description: 'Static JSON API for n8n node documentation and metadata',
        base_url: 'https://federico-barco-agencycic.github.io/docu-n8n-mcp',
        api_base: 'https://federico-barco-agencycic.github.io/docu-n8n-mcp/api',
        total_nodes: allNodes.length,
        generated_at: new Date().toISOString(),
        version: '1.0.0',
        cors_enabled: true,
        formats: ['json'],
        compression: false
    };
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'config.json'),
        JSON.stringify(config, null, 2)
    );
    
    console.log('\n✅ Construcción de API estática completada!');
    console.log('📁 Archivos generados:');
    console.log(`   - ${processedCount} archivos individuales de nodos`);
    console.log(`   - ${categoryStats.length} resúmenes de categorías`);
    console.log(`   - ${packageStats.length} resúmenes de paquetes`);
    console.log(`   - Manifests y índices actualizados`);
    console.log('\n🌐 La API está lista para deployment en GitHub Pages');
    
} catch (error) {
    console.error('❌ Error construyendo API estática:', error);
    process.exit(1);
} finally {
    db.close();
}

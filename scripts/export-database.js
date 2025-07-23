#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = './data/nodes.db';
const OUTPUT_DIR = './api';

console.log('🚀 Iniciando exportación de base de datos n8n-mcp...');

// Verificar si existe la base de datos
if (!fs.existsSync(DB_PATH)) {
    console.error('❌ No se encuentra la base de datos en:', DB_PATH);
    console.log('💡 Asegúrate de que el proyecto n8n-mcp esté en la carpeta superior');
    console.log('💡 O copia manualmente nodes.db a la carpeta data/');
    process.exit(1);
}

// Crear directorio de salida
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Conectar a la base de datos
const db = new Database(DB_PATH, { readonly: true });

try {
    // 1. Exportar todos los nodos
    console.log('📦 Exportando todos los nodos...');
    const allNodes = db.prepare('SELECT * FROM nodes ORDER BY node_type').all();
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'nodes.json'),
        JSON.stringify(allNodes, null, 2)
    );
    
    // 2. Exportar solo herramientas AI
    console.log('🤖 Exportando herramientas AI...');
    const aiTools = db.prepare('SELECT * FROM nodes WHERE is_ai_tool = 1 ORDER BY node_type').all();
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'ai-tools.json'),
        JSON.stringify(aiTools, null, 2)
    );
    
    // 3. Exportar triggers
    console.log('⚡ Exportando triggers...');
    const triggers = db.prepare('SELECT * FROM nodes WHERE is_trigger = 1 ORDER BY node_type').all();
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'triggers.json'),
        JSON.stringify(triggers, null, 2)
    );
    
    // 4. Exportar webhooks
    console.log('🔗 Exportando webhooks...');
    const webhooks = db.prepare('SELECT * FROM nodes WHERE is_webhook = 1 ORDER BY node_type').all();
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'webhooks.json'),
        JSON.stringify(webhooks, null, 2)
    );
    
    // 5. Exportar por categorías
    console.log('📂 Exportando por categorías...');
    const categories = db.prepare('SELECT DISTINCT category FROM nodes WHERE category IS NOT NULL ORDER BY category').all();
    
    const categoriesDir = path.join(OUTPUT_DIR, 'categories');
    if (!fs.existsSync(categoriesDir)) {
        fs.mkdirSync(categoriesDir, { recursive: true });
    }
    
    categories.forEach(({ category }) => {
        const categoryNodes = db.prepare('SELECT * FROM nodes WHERE category = ? ORDER BY node_type').all(category);
        fs.writeFileSync(
            path.join(categoriesDir, `${category}.json`),
            JSON.stringify(categoryNodes, null, 2)
        );
        console.log(`   📁 ${category}: ${categoryNodes.length} nodos`);
    });
    
    // 6. Exportar por paquetes
    console.log('📦 Exportando por paquetes...');
    const packages = db.prepare('SELECT DISTINCT package_name FROM nodes WHERE package_name IS NOT NULL ORDER BY package_name').all();
    
    const packagesDir = path.join(OUTPUT_DIR, 'packages');
    if (!fs.existsSync(packagesDir)) {
        fs.mkdirSync(packagesDir, { recursive: true });
    }
    
    packages.forEach(({ package_name }) => {
        const packageNodes = db.prepare('SELECT * FROM nodes WHERE package_name = ? ORDER BY node_type').all(package_name);
        const safePackageName = package_name.replace(/[@\/]/g, '_');
        fs.writeFileSync(
            path.join(packagesDir, `${safePackageName}.json`),
            JSON.stringify(packageNodes, null, 2)
        );
        console.log(`   📦 ${package_name}: ${packageNodes.length} nodos`);
    });
    
    // 7. Exportar templates si existen
    console.log('🎯 Verificando templates...');
    let templates = [];
    try {
        templates = db.prepare('SELECT * FROM templates ORDER BY views DESC').all();
        if (templates.length > 0) {
            fs.writeFileSync(
                path.join(OUTPUT_DIR, 'templates.json'),
                JSON.stringify(templates, null, 2)
            );
            console.log(`   🎯 ${templates.length} templates exportados`);
        }
    } catch (error) {
        console.log('   ⚠️ No hay tabla de templates disponible');
    }
    
    // 8. Crear índice general
    console.log('📋 Creando índice general...');
    const stats = {
        total_nodes: allNodes.length,
        ai_tools: aiTools.length,
        triggers: triggers.length,
        webhooks: webhooks.length,
        categories: categories.length,
        packages: packages.length,
        templates: templates.length,
        last_updated: new Date().toISOString(),
        version: '1.0.0',
        database_source: 'n8n-mcp'
    };
    
    const index = {
        meta: stats,
        endpoints: {
            all_nodes: '/api/nodes.json',
            ai_tools: '/api/ai-tools.json',
            triggers: '/api/triggers.json',
            webhooks: '/api/webhooks.json',
            categories: '/api/categories/',
            packages: '/api/packages/',
            search: '/api/search.json',
            templates: templates.length > 0 ? '/api/templates.json' : null
        },
        available_categories: categories.map(c => c.category),
        available_packages: packages.map(p => p.package_name),
        popular_nodes: allNodes
            .filter(node => node.is_ai_tool || node.is_trigger)
            .slice(0, 10)
            .map(node => ({
                node_type: node.node_type,
                display_name: node.display_name,
                category: node.category,
                is_ai_tool: Boolean(node.is_ai_tool)
            }))
    };
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'index.json'),
        JSON.stringify(index, null, 2)
    );
    
    // 9. Crear archivo de búsqueda optimizado
    console.log('🔍 Creando índice de búsqueda...');
    const searchIndex = allNodes.map(node => ({
        node_type: node.node_type,
        display_name: node.display_name,
        description: node.description,
        category: node.category,
        package_name: node.package_name,
        is_ai_tool: Boolean(node.is_ai_tool),
        is_trigger: Boolean(node.is_trigger),
        is_webhook: Boolean(node.is_webhook),
        version: node.version,
        keywords: [
            node.node_type,
            node.display_name,
            node.description,
            node.category,
            node.package_name
        ].filter(Boolean).join(' ').toLowerCase()
    }));
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'search.json'),
        JSON.stringify(searchIndex, null, 2)
    );
    
    // 10. Crear manifiesto simplificado para listados rápidos
    console.log('📋 Creando manifesto de nodos...');
    const manifest = allNodes.map(node => ({
        node_type: node.node_type,
        display_name: node.display_name,
        description: node.description?.substring(0, 100) + (node.description?.length > 100 ? '...' : ''),
        category: node.category,
        package_name: node.package_name,
        is_ai_tool: Boolean(node.is_ai_tool),
        is_trigger: Boolean(node.is_trigger),
        is_webhook: Boolean(node.is_webhook),
        version: node.version,
        api_url: `/api/nodes/${node.node_type.replace(/[@\/\.]/g, '_')}.json`
    }));
    
    fs.writeFileSync(
        path.join(OUTPUT_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    
    console.log('\n✅ Exportación completada exitosamente!');
    console.log('📊 Estadísticas:');
    console.log(`   - Total nodos: ${stats.total_nodes}`);
    console.log(`   - Herramientas AI: ${stats.ai_tools}`);
    console.log(`   - Triggers: ${stats.triggers}`);
    console.log(`   - Webhooks: ${stats.webhooks}`);
    console.log(`   - Categorías: ${stats.categories}`);
    console.log(`   - Paquetes: ${stats.packages}`);
    if (stats.templates > 0) {
        console.log(`   - Templates: ${stats.templates}`);
    }
    console.log(`\n🌐 API estará disponible en: ${OUTPUT_DIR}/`);
    
} catch (error) {
    console.error('❌ Error durante la exportación:', error);
    process.exit(1);
} finally {
    db.close();
}

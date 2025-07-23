#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_DIR = './api';

console.log('🔍 Validando archivos JSON...');

function validateJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        
        // Validaciones específicas según el tipo de archivo
        const fileName = path.basename(filePath);
        
        if (fileName === 'index.json') {
            if (!parsed.meta || !parsed.endpoints) {
                console.warn(`⚠️ ${filePath}: Estructura de índice incompleta`);
                return false;
            }
        } else if (fileName === 'nodes-manifest.json') {
            if (!Array.isArray(parsed)) {
                console.warn(`⚠️ ${filePath}: Manifest debe ser un array`);
                return false;
            }
        } else if (fileName.startsWith('nodes-base_') || fileName.startsWith('nodes-langchain_')) {
            // Validar estructura de nodo individual
            if (!parsed.node_type || !parsed.display_name) {
                console.warn(`⚠️ ${filePath}: Nodo sin campos requeridos`);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error(`❌ Error en ${filePath}: ${error.message}`);
        return false;
    }
}

function getFileSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function walkDir(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
        console.error(`❌ Directorio no existe: ${dir}`);
        return files;
    }
    
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...walkDir(fullPath));
        } else if (item.endsWith('.json')) {
            files.push(fullPath);
        }
    });
    
    return files;
}

// Verificar que existe el directorio API
if (!fs.existsSync(API_DIR)) {
    console.error('❌ Directorio API no existe. Ejecuta primero: npm run export');
    process.exit(1);
}

const jsonFiles = walkDir(API_DIR);
let validCount = 0;
let invalidCount = 0;
let totalSize = 0;

const fileStats = {
    byType: {},
    largest: { file: '', size: 0 },
    smallest: { file: '', size: Infinity }
};

console.log(`\n📁 Encontrados ${jsonFiles.length} archivos JSON\n`);

jsonFiles.forEach(file => {
    const size = getFileSize(file);
    totalSize += size;
    
    // Estadísticas por tipo
    const relativePath = path.relative(API_DIR, file);
    const dir = path.dirname(relativePath);
    const type = dir === '.' ? 'root' : dir.split(path.sep)[0];
    
    if (!fileStats.byType[type]) {
        fileStats.byType[type] = { count: 0, size: 0 };
    }
    fileStats.byType[type].count++;
    fileStats.byType[type].size += size;
    
    // Archivos más grandes/pequeños
    if (size > fileStats.largest.size) {
        fileStats.largest = { file: relativePath, size };
    }
    if (size < fileStats.smallest.size) {
        fileStats.smallest = { file: relativePath, size };
    }
    
    // Validar JSON
    if (validateJSON(file)) {
        validCount++;
        process.stdout.write('✅');
    } else {
        invalidCount++;
        process.stdout.write('❌');
    }
    
    // Nueva línea cada 50 archivos
    if ((validCount + invalidCount) % 50 === 0) {
        process.stdout.write('\n');
    }
});

process.stdout.write('\n\n');

console.log('📊 Resultados de validación:');
console.log(`   ✅ Válidos: ${validCount}`);
console.log(`   ❌ Inválidos: ${invalidCount}`);
console.log(`   📁 Total archivos: ${jsonFiles.length}`);
console.log(`   💾 Tamaño total: ${formatBytes(totalSize)}`);

console.log('\n📈 Estadísticas por tipo:');
Object.entries(fileStats.byType)
    .sort(([,a], [,b]) => b.count - a.count)
    .forEach(([type, stats]) => {
        console.log(`   📂 ${type}: ${stats.count} archivos (${formatBytes(stats.size)})`);
    });

console.log('\n🔍 Archivos destacados:');
console.log(`   📏 Más grande: ${fileStats.largest.file} (${formatBytes(fileStats.largest.size)})`);
console.log(`   📏 Más pequeño: ${fileStats.smallest.file} (${formatBytes(fileStats.smallest.size)})`);

// Verificar archivos críticos
console.log('\n🔧 Verificando archivos críticos:');
const criticalFiles = [
    'index.json',
    'nodes.json',
    'ai-tools.json',
    'search.json',
    'manifest.json',
    'nodes-manifest.json'
];

criticalFiles.forEach(fileName => {
    const filePath = path.join(API_DIR, fileName);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${fileName} - ${formatBytes(getFileSize(filePath))}`);
    } else {
        console.log(`   ❌ ${fileName} - FALTANTE`);
        invalidCount++;
    }
});

// Verificar estructura de directorios
console.log('\n📁 Verificando estructura:');
const expectedDirs = ['categories', 'packages', 'nodes'];
expectedDirs.forEach(dirName => {
    const dirPath = path.join(API_DIR, dirName);
    if (fs.existsSync(dirPath)) {
        const filesInDir = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).length;
        console.log(`   ✅ ${dirName}/ - ${filesInDir} archivos`);
    } else {
        console.log(`   ❌ ${dirName}/ - FALTANTE`);
    }
});

if (invalidCount === 0) {
    console.log('\n🎉 ¡Todos los archivos JSON son válidos!');
    console.log('🚀 La API está lista para deployment');
} else {
    console.log(`\n⚠️ Hay ${invalidCount} errores que necesitan corrección.`);
    process.exit(1);
}

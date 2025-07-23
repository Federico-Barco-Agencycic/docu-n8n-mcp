const Database = require('better-sqlite3');

const db = new Database('./data/nodes.db', { readonly: true });

try {
    // Ver tablas disponibles
    const tables = db.prepare('SELECT name FROM sqlite_master WHERE type="table"').all();
    console.log('Tables:', tables);
    
    // Ver estructura de la tabla nodes
    const schema = db.prepare('PRAGMA table_info(nodes)').all();
    console.log('\nColumns in nodes table:');
    schema.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
    });
    
    // Ver algunas filas de ejemplo
    const sample = db.prepare('SELECT * FROM nodes LIMIT 3').all();
    console.log('\nSample data:');
    if (sample.length > 0) {
        console.log('Available columns:', Object.keys(sample[0]));
    }
    
} catch (error) {
    console.error('Error:', error.message);
} finally {
    db.close();
}

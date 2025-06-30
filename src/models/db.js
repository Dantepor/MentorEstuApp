const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'ballast.proxy.rlwy.net',
    user: 'root',
    password: 'AtFSUqvyvDSvmyqpubgwURKWHZPIvDTB',
    database: 'railway',
    port: 52905
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a Railway MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL en Railway');
});

module.exports = db;
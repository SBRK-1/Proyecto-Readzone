const mysql = require('mysql2/promise'); // Conector en versión de Promesas

const pool = mysql.createPool({
    host: 'localhost',              
    user: 'root',                   
    password: 'Redmi10#', // La contraseña de tu MySQL Workbench
    database: 'readzone',       // Tu base de datos de Workbench
    port: 3306,                     
    waitForConnections: true,
    connectionLimit: 10              
});

module.exports = pool;
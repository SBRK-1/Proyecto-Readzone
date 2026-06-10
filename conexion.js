const mysql = require('mysql2'); // Conector en versión de Promesas

const pool = mysql.createConnection({
    host: 'acela.proxy.rlwy.net',              
    user: 'root',                   
    password: 'CUfMwashpeeRltZckCavAYvzQpWPkaPa', // La contraseña de tu MySQL Workbench
    database: 'readzone',       // Tu base de datos de Workbench
    port: 27816,                     
    waitForConnections: true,
    connectionLimit: 10              
});


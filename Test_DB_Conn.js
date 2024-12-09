require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
        });

        console.log('Connected to the database successfully!');
        await connection.end();
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
    }

})();

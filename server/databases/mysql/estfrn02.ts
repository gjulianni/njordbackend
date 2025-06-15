import mysql2 from 'mysql2/promise';

export const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.USER,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})
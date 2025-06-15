import mysql2 from 'mysql2/promise';

export const pool_estfrn01 = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.USER,
    database: process.env.DATABASE_2,
    password: process.env.PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})
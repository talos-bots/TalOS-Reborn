/* eslint-disable @typescript-eslint/no-explicit-any */
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./auth.db', (err: any) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        hashed_password TEXT,
        profile_pic TEXT,
        display_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

export default db;
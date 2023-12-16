/* eslint-disable @typescript-eslint/no-explicit-any */
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./talos.db', (err: any) => {
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
        tagline TEXT,
        bio TEXT,
        background_pic TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS characters (
        _id TEXT PRIMARY KEY,
        name TEXT,
        avatar TEXT,
        description TEXT,
        personality TEXT,
        mes_example TEXT,
        creator_notes TEXT,
        system_prompt TEXT,
        post_history_instructions TEXT,
        tags TEXT,
        creator TEXT,
        visual_description TEXT,
        thought_pattern TEXT,
        first_mes TEXT,
        alternate_greetings TEXT,
        scenario TEXT
    )`);
});

export default db;
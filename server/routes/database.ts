import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

type SchemaVersionRow = {
    version: number;
};

let useVarFolder = false;
const args = process.argv.slice(2);

args.forEach(arg => {
    if (arg.startsWith('--linux-server')) {
        useVarFolder = true;
    }
});

// Get the userData directory
const appDataDir = process.env.APPDATA || 
                   (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : 
                   (useVarFolder ? '/var/local' : process.env.HOME + '/.local/share'));
// Get the TalOS directory
const talosDir = path.join(appDataDir, 'TalOS');
// Create the TalOS directory if it doesn't exist
fs.mkdirSync(talosDir, { recursive: true });
// Get the database file path
const dbFile = path.join(talosDir, 'talos.db');
const db = new sqlite3.Database(dbFile, (err: any) => {
    if (err) {
        console.error(err.message);
    }
});

function getCurrentSchemaVersion(): Promise<number> {
    return new Promise((resolve, reject) => {
        db.get(`SELECT version FROM schema_version ORDER BY version DESC LIMIT 1`, [], (err, row: SchemaVersionRow) => {
            if (err) {
                if (err.message.includes("no such table: schema_version")) {
                    resolve(0); // Schema version table doesn't exist
                } else {
                    reject(err);
                }
            } else {
                resolve(row ? row.version : 0);
            }
        });
    });
}

async function migrateDatabase() {
    const currentVersion = await getCurrentSchemaVersion();

    if (currentVersion < 1) {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY
            )`);

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
                scenario TEXT,
                response_settings TEXT
            )`);

            db.run(`INSERT INTO schema_version (version) VALUES (1)`);
        });
    }

    if (currentVersion < 2) {
        db.serialize(() => {
            db.run(`ALTER TABLE characters ADD COLUMN nicknames TEXT`);

            db.run(`INSERT INTO schema_version (version) VALUES (2)`);
        });
    }

    // Add further migrations as needed
}

// Initialize database and apply migrations
migrateDatabase();

export async function clearUsers() {
    db.run(`DELETE FROM users`);
}

export default db;

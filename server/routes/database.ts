import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

let useVarFolder = false;
const args = process.argv.slice(2);

args.forEach(arg => {
    if (arg.startsWith('--linux-server')) {
        useVarFolder = true;
    }
});

//get the userData directory
const appDataDir = process.env.APPDATA || 
                   (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : 
                   (useVarFolder ? '/var/local' : process.env.HOME + '/.local/share'));//get the talos directory
//get the talos directory
const talosDir = path.join(appDataDir, 'TalOS');
//get the uploads directory
fs.mkdirSync(talosDir, { recursive: true });
//get the database file
const dbFile = path.join(talosDir, 'talos.db');
const db = new sqlite3.Database(dbFile, (err: any) => {
    if (err) {
        console.error(err.message);
    }
});

db.serialize(() => {
    // Create new users table with the same schema
    db.run(`CREATE TABLE IF NOT EXISTS new_users (
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

    // Create new characters table with the updated schema
    db.run(`CREATE TABLE IF NOT EXISTS new_characters (
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

    // Copy data from old users table to new users table
    db.run(`INSERT INTO new_users (id, username, hashed_password, profile_pic, display_name, tagline, bio, background_pic, created_at)
            SELECT id, username, hashed_password, profile_pic, display_name, tagline, bio, background_pic, created_at FROM users`);

    // Copy data from old characters table to new characters table
    db.run(`INSERT INTO new_characters (_id, name, avatar, description, personality, mes_example, creator_notes, system_prompt, post_history_instructions, tags, creator, visual_description, thought_pattern, first_mes, alternate_greetings, scenario)
            SELECT _id, name, avatar, description, personality, mes_example, creator_notes, system_prompt, post_history_instructions, tags, creator, visual_description, thought_pattern, first_mes, alternate_greetings, scenario FROM characters`);

    // Drop old users table
    db.run(`DROP TABLE users`);

    // Drop old characters table
    db.run(`DROP TABLE characters`);

    // Rename new users table to users
    db.run(`ALTER TABLE new_users RENAME TO users`);

    // Rename new characters table to characters
    db.run(`ALTER TABLE new_characters RENAME TO characters`);
});


export async function clearUsers() {
    db.run(`DELETE FROM users`);
}

export default db;
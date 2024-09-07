import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

type TableInfoRow = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
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


async function migrateDatabase() {
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
            scenario TEXT,
            response_settings TEXT,
            nicknames TEXT
        )`);
  });
}

function getExistingColumns(tableName: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, [], (err, rows: TableInfoRow[]) => {
      if (err) {
        reject(err);
      } else {
        const columns = rows.map(row => row.name);
        resolve(columns);
      }
    });
  });
}


async function addMissingColumns() {
  const desiredColumns = {
    characters: [
      "_id TEXT PRIMARY KEY",
      "name TEXT",
      "avatar TEXT",
      "description TEXT",
      "personality TEXT",
      "mes_example TEXT",
      "creator_notes TEXT",
      "system_prompt TEXT",
      "post_history_instructions TEXT",
      "tags TEXT",
      "creator TEXT",
      "visual_description TEXT",
      "thought_pattern TEXT",
      "first_mes TEXT",
      "alternate_greetings TEXT",
      "scenario TEXT",
      "response_settings TEXT",
      "nicknames TEXT" // new column
    ]
  };

  for (const [tableName, columns] of Object.entries(desiredColumns)) {
    const existingColumns = await getExistingColumns(tableName);
    for (const columnDefinition of columns) {
      const [columnName] = columnDefinition.split(' ');
      if (!existingColumns.includes(columnName)) {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`, (err) => {
          if (err) {
            console.error(`Error adding column ${columnName} to table ${tableName}:`, err.message);
          } else {
            console.log(`Added column ${columnName} to table ${tableName}`);
          }
        });
      }
    }
  }
}
// Initialize database and apply migrations
migrateDatabase();
addMissingColumns();

export async function clearUsers() {
  db.run(`DELETE FROM users`);
}

export default db;

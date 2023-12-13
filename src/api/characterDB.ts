import { Character } from "../global_classes/Character";
import { emitCharacterUpdated } from "../helpers/events";

export const CharacterDBConfig = {
    name: "CharactersDB",
    version: 1,
    objectStoresMeta: [
        {
            store: "characters",
            storeConfig: { keyPath: "_id", autoIncrement: false },
            storeSchema: [
                { name: "_id", keypath: "_id", options: { unique: true } },
                { name: "name", keypath: "name", options: { unique: false } },
                { name: "avatar", keypath: "avatar", options: { unique: false } },
                { name: "description", keypath: "description", options: { unique: false } },
                { name: "personality", keypath: "personality", options: { unique: false } },
                { name: "mes_example", keypath: "mes_example", options: { unique: false } },
                { name: "creator_notes", keypath: "creator_notes", options: { unique: false } },
                { name: "system_prompt", keypath: "system_prompt", options: { unique: false } },
                { name: "post_history_instructions", keypath: "post_history_instructions", options: { unique: false } },
                { name: "tags", keypath: "tags", options: { unique: false } },
                { name: "creator", keypath: "creator", options: { unique: false } },
                { name: "visual_description", keypath: "visual_description", options: { unique: false } },
                { name: "thought_pattern", keypath: "thought_pattern", options: { unique: false } },
                { name: "first_mes", keypath: "first_mes", options: { unique: false } },
                { name: "alternate_greetings", keypath: "alternate_greetings", options: { unique: false } },
                { name: "scenario", keypath: "scenario", options: { unique: false } },
            ],
        },
    ],
};

// Define the database name and version
const dbName = 'CharactersDB';
const dbVersion = 1;

export function openCharacterDB(): Promise<IDBDatabase> {
    // Open a connection to the database
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event: Event) => {
        // Handle errors
        const target = event.target as IDBRequest;
        console.error('Database error:', target.error);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('characters')) {
            db.createObjectStore('characters', { keyPath: '_id' });
        }
    };

    request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.onerror = (event: Event) => {
            const target = event.target as IDBRequest;
            console.error('Database error:', target.error);
        };
    };

    return new Promise((resolve, reject) => {
        request.onsuccess = (event: Event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };
        request.onerror = (event: Event) => {
            const target = event.target as IDBRequest;
            reject(target.error);
            console.error('Database error:', target.error);
        };
    });
}

export async function addCharacter(character: Character): Promise<void> {
    const db = await openCharacterDB();
    const transaction = db.transaction(['characters'], 'readwrite');
    const store = transaction.objectStore('characters');
    const request = store.put(character.toJSON());

    request.onsuccess = () => {
        console.log('characters added to the database');
        emitCharacterUpdated();
    };

    request.onerror = (event: Event) => {
        const target = event.target as IDBRequest;
        console.error('Error adding characters to the database', target.error);
    };
}

export async function deleteCharacter(id: string): Promise<void> {
    const db = await openCharacterDB();
    const transaction = db.transaction(['characters'], 'readwrite');
    const store = transaction.objectStore('characters');
    const request = store.delete(id);

    request.onsuccess = () => {
        console.log('characters deleted from the database');
        emitCharacterUpdated();
    };

    request.onerror = (event: Event) => {
        const target = event.target as IDBRequest;
        console.error('Error deleting characters from the database', target.error);
    };
}

export async function getCharacter(id: string): Promise<Character> {
    const db = await openCharacterDB();
    const transaction = db.transaction(['characters'], 'readonly');
    const store = transaction.objectStore('characters');
    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = (event: Event) => {
            const chatLog = (event.target as IDBRequest).result;
            const assembledChatLog = Character.fromJSON(chatLog);
            console.log('Retrieved characters:', assembledChatLog);
            resolve(assembledChatLog);
        };

        request.onerror = (event: Event) => {
            const target = event.target as IDBRequest;
            console.error('Error retrieving characters from the database', target.error);
            reject(target.error);
        };
    });
}

export async function getAllCharacters(): Promise<Character[]> {
    const db = await openCharacterDB();
    const transaction = db.transaction(['characters'], 'readonly');
    const store = transaction.objectStore('characters');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = (event: Event) => {
            const chatLogs = (event.target as IDBRequest).result;
            const assembledChatLogs: Character[] = [];
            for (const chatLog of chatLogs) {
                assembledChatLogs.push(Character.fromJSON(chatLog));
            }
            console.log('Retrieved characters:', assembledChatLogs);
            resolve(assembledChatLogs);
        };

        request.onerror = (event: Event) => {
            const target = event.target as IDBRequest;
            console.error('Error retrieving characters from the database', target.error);
            reject(target.error);
        };
    });
}
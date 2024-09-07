import { StoredChatLog } from "../global_classes/StoredChatLog";
import { emitChatLogChanged } from "../helpers/events";

export const DBConfig = {
  name: "ChatLogsDB", // Name of your database
  version: 1, // Version of your database
  objectStoresMeta: [
    {
      store: "chatLogs", // Name of the store
      storeConfig: { keyPath: "_id", autoIncrement: false }, // Primary key and autoIncrement
      storeSchema: [
        // Define schema based on StoredChatLog properties
        { name: "messages", keypath: "messages", options: { unique: false } },
        { name: "characters", keypath: "characters", options: { unique: false } },
        { name: "firstMessageDate", keypath: "firstMessageDate", options: { unique: false } },
        { name: "lastMessageDate", keypath: "lastMessageDate", options: { unique: false } },
        { name: "name", keypath: "name", options: { unique: false } },
        { name: "userID", keypath: "userID", options: { unique: false } },
      ],
    },
  ],
};


// Define the database name and version
const dbName = 'ChatLogsDB';
const dbVersion = 1;

export function openChatLogDB(): Promise<IDBDatabase> {
  // Open a connection to the database
  const request = indexedDB.open(dbName, dbVersion);

  request.onerror = (event: Event) => {
    // Handle errors
    const target = event.target as IDBRequest;
    console.error('Database error:', target.error);
  };

  request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains('chatLogs')) {
      db.createObjectStore('chatLogs', { keyPath: '_id' });
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

export async function addStoredChatLog(chatLog: StoredChatLog): Promise<void> {
  const db = await openChatLogDB();
  const transaction = db.transaction(['chatLogs'], 'readwrite');
  const store = transaction.objectStore('chatLogs');
  const request = store.put(chatLog.toJSON());

  request.onsuccess = () => {
    console.log('ChatLog added to the database');
    emitChatLogChanged();
  };

  request.onerror = (event: Event) => {
    const target = event.target as IDBRequest;
    console.error('Error adding chatLog to the database', target.error);
  };
}

export async function deleteStoredChatLog(id: string): Promise<void> {
  const db = await openChatLogDB();
  const transaction = db.transaction(['chatLogs'], 'readwrite');
  const store = transaction.objectStore('chatLogs');
  const request = store.delete(id);

  request.onsuccess = () => {
    console.log('ChatLog deleted from the database');
    emitChatLogChanged();
  };

  request.onerror = (event: Event) => {
    const target = event.target as IDBRequest;
    console.error('Error deleting chatLog from the database', target.error);
  };
}

export async function getStoredChatLog(id: string): Promise<StoredChatLog> {
  const db = await openChatLogDB();
  const transaction = db.transaction(['chatLogs'], 'readonly');
  const store = transaction.objectStore('chatLogs');
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = (event: Event) => {
      const chatLog = (event.target as IDBRequest).result;
      const assembledChatLog = StoredChatLog.fromJSON(chatLog);
      console.log('Retrieved ChatLog:', assembledChatLog);
      resolve(assembledChatLog);
    };

    request.onerror = (event: Event) => {
      const target = event.target as IDBRequest;
      console.error('Error retrieving chatLog from the database', target.error);
      reject(target.error);
    };
  });
}

export async function getAllStoredChatLogs(): Promise<StoredChatLog[]> {
  const db = await openChatLogDB();
  const transaction = db.transaction(['chatLogs'], 'readonly');
  const store = transaction.objectStore('chatLogs');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = (event: Event) => {
      const chatLogs = (event.target as IDBRequest).result;
      const assembledChatLogs: StoredChatLog[] = [];
      for (const chatLog of chatLogs) {
        assembledChatLogs.push(StoredChatLog.fromJSON(chatLog));
      }
      console.log('Retrieved ChatLogs:', assembledChatLogs);
      resolve(assembledChatLogs);
    };

    request.onerror = (event: Event) => {
      const target = event.target as IDBRequest;
      console.error('Error retrieving chatLogs from the database', target.error);
      reject(target.error);
    };
  });
}

export async function getAllStoredChatLogsWithCharacter(id: string): Promise<StoredChatLog[]> {
  const db = await openChatLogDB();
  const transaction = db.transaction(['chatLogs'], 'readonly');
  const store = transaction.objectStore('chatLogs');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = (event: Event) => {
      const chatLogs = (event.target as IDBRequest).result;
      const assembledChatLogs: StoredChatLog[] = [];
      for (const chatLog of chatLogs) {
        if (chatLog.characters.includes(id)) {
          assembledChatLogs.push(StoredChatLog.fromJSON(chatLog));
        }
      }
      console.log('Retrieved ChatLogs:', assembledChatLogs);
      resolve(assembledChatLogs);
    };

    request.onerror = (event: Event) => {
      const target = event.target as IDBRequest;
      console.error('Error retrieving chatLogs from the database', target.error);
      reject(target.error);
    };
  });
}
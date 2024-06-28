import express from 'express';
import db from './database.js';
import { authenticateToken } from './authenticate-token.js';
import { CharacterInterface, defaultCharacterObject } from '../typings/types.js';

export const charactersRouter = express.Router();

function serializeCharacter(character: CharacterInterface): any {
    return {
        ...character,
        tags: JSON.stringify(character.tags),
        alternate_greetings: JSON.stringify(character.alternate_greetings),
        response_settings: JSON.stringify(character.response_settings),
        nicknames: JSON.stringify(character.nicknames),
    };
}

function deserializeCharacter(row: any): CharacterInterface {
    let tags = [];
    let alternate_greetings = [];
    let response_settings = {};
    let nicknames = [];

    try {
        tags = JSON.parse(row.tags || '[]');
    } catch (error) {
        // console.error("Error parsing tags:", error);
    }

    try {
        alternate_greetings = JSON.parse(row.alternate_greetings || '[]');
    } catch (error) {
        // console.error("Error parsing alternate_greetings:", error);
    }

    try {
        response_settings = JSON.parse(row.response_settings || '{}');
    } catch (error) {
        // console.error("Error parsing response_settings:", error);
    }

    try {
        nicknames = JSON.parse(row.nicknames || '[]');
    } catch (error) {
        // console.error("Error parsing nicknames:", error);
    }

    return {
        ...row,
        tags,
        alternate_greetings,
        response_settings,
        nicknames,
    };
}

// get all characters from the ../data/characters/ folder
export async function fetchAllCharacters(): Promise<CharacterInterface[]> {
    const charas = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM characters', [], (err, rows: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    }) as CharacterInterface[];

    return charas.map((chara: any) => ({...defaultCharacterObject, ...deserializeCharacter(chara)}));
}

charactersRouter.get('/characters', async (req, res) => {
    try {
        const characterData = await fetchAllCharacters();
        res.send(characterData);
    } catch (error: any) {
        console.log(error);
        res.status(500).send({ error: error.message });
    }
});

// save a character to the ../data/characters/ folder
function saveOrUpdateCharacter(character: CharacterInterface): Promise<void> {
    return new Promise((resolve, reject) => {
        const upsertQuery = `REPLACE INTO characters (_id, name, avatar, description, personality, mes_example, creator_notes, system_prompt, post_history_instructions, tags, creator, visual_description, thought_pattern, first_mes, alternate_greetings, scenario, response_settings, nicknames) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const serializedCharacter = serializeCharacter({...defaultCharacterObject, ...character});

        db.run(upsertQuery, [
            serializedCharacter._id,
            serializedCharacter.name,
            serializedCharacter.avatar,
            serializedCharacter.description,
            serializedCharacter.personality,
            serializedCharacter.mes_example,
            serializedCharacter.creator_notes,
            serializedCharacter.system_prompt,
            serializedCharacter.post_history_instructions,
            serializedCharacter.tags,
            serializedCharacter.creator,
            serializedCharacter.visual_description,
            serializedCharacter.thought_pattern,
            serializedCharacter.first_mes,
            serializedCharacter.alternate_greetings,
            serializedCharacter.scenario,
            serializedCharacter.response_settings,
            serializedCharacter.nicknames,
        ], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

charactersRouter.post('/save/character', authenticateToken, async (req, res) => {
    try {
        console.log("Saving character...");
        console.log(req.body);
        await saveOrUpdateCharacter(req.body);
        console.log("Character saved successfully!");
        res.send({ message: "Character saved successfully!" });
    } catch (error: any) {
        console.log("Error saving character...");
        console.log(error);
        res.status(500).send({ error: error.message });
    }
});

// get a character by id from the ../data/characters/ folder
export async function fetchCharacterById(id: string): Promise<CharacterInterface | null> {
    const chara = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM characters WHERE _id = ?', [id], (err, row: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row || null);
        });
    });

    if (!chara) {
        return null;
    } else {
        return {...defaultCharacterObject, ...deserializeCharacter(chara)};
    }
}

charactersRouter.get('/character/:id', async (req, res) => {
    try {
        const character = await fetchCharacterById(req.params.id);
        if (character) {
            res.send(character);
        } else {
            res.status(404).send({ message: "Character not found" });
        }
    } catch (error: any) {
        console.log(error);
        res.status(500).send({ error: error.message });
    }
});

//get characters by creator from the ../data/characters/ folder
function fetchCharactersByCreator(creator: string): Promise<CharacterInterface[]> {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM characters WHERE creator = ?', [creator], (err, rows: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

charactersRouter.post('/characters/creator', async (req, res) => {
    try {
        const characterData = await fetchCharactersByCreator(req.body.creator);
        res.send(characterData);
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
});

//remove a character by id from the ../data/characters/ folder
function removeCharacterById(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM characters WHERE _id = ?', [id], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

charactersRouter.delete('/character/:id', authenticateToken, async (req, res) => {
    try {
        await removeCharacterById(req.params.id);
        res.send({ message: "Character removed successfully!" });
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
});
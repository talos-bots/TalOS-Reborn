import express from 'express';
import db from './database.js';
import { authenticateToken } from './authenticate-token.js';
import { CharacterInterface, defaultCharacterObject } from '../typings/types.js';

export const charactersRouter = express.Router();

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

    return charas.map((chara: any) => ({...defaultCharacterObject, ...chara}));
}

charactersRouter.get('/characters', async (req, res) => {
    try {
        const characterData = await fetchAllCharacters();
        res.send(characterData);
    } catch (error: any) {
        res.status(500).send({ error: error.message });
    }
});

// save a character to the ../data/characters/ folder
function saveOrUpdateCharacter(character: CharacterInterface): Promise<void> {
    return new Promise((resolve, reject) => {
        const upsertQuery = `REPLACE INTO characters (_id, name, avatar, description, personality, mes_example, creator_notes, system_prompt, post_history_instructions, tags, creator, visual_description, thought_pattern, first_mes, alternate_greetings, scenario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(upsertQuery, Object.values(character), (err) => {
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
        await saveOrUpdateCharacter(req.body);
        res.send({ message: "Character saved successfully!" });
    } catch (error: any) {
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
        return {...defaultCharacterObject, ...chara};
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
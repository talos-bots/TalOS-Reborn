/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Character } from '../global_classes/Character';

export async function saveCharacterToLocal(character: Character): Promise<void> {
    const response = await fetch('/api/save/character', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(character.toJSON()),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    console.log('Character saved successfully!');
}

export async function fetchCharacterById(id: string): Promise<Character | null> {
    const response = await fetch(`/api/character/${id}`);

    if (!response.ok) {
        if (response.status === 404) {
            console.log('Character not found');
            return null;
        }
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    console.log(data);
    return Character.fromJSON(data);
}

export async function fetchAllCharacters(): Promise<Character[]> {
    const response = await fetch('/api/characters');

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    console.log(data);
    return data.map((character: any) => Character.fromJSON(character));
}

export async function deleteCharacterById(id: string): Promise<void> {
    const response = await fetch(`/api/character/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    console.log('Character deleted successfully!');
}
import { User } from '../components/shared/auth-provider';
import { Character } from '../global_classes/Character';
import { emitCharacterUpdated } from '../helpers/events';

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
    emitCharacterUpdated();
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
    return Character.fromJSON(data);
}

export async function fetchAllCharacters(): Promise<Character[]> {
    const response = await fetch('/api/characters');

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
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
    emitCharacterUpdated();
}

export async function getCharactersByUserID(id: string): Promise<Character[]> {
    const response = await fetch(`/api/characters/creator`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            creator: id,
        }),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    return data.map((character: any) => Character.fromJSON(character));
}

export async function getUserdataByID(id: string): Promise<User> {
    const response = await fetch(`/api/profile/${id}`);

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    console.log(data);
    const newUser: User = {
        id: data.id,
        username: data.username,
        bio: data.bio,
        profilePic: data.profile_pic,
        tagline: data.tagline,
        displayName: data.display_name,
        backgroundPic: data.background_pic,
    }
    return newUser;
}

export async function getAllUserdata(): Promise<any> {
    const response = await fetch(`/api/profiles`);

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    return data;
}

// get all users
export async function getAllUsers(): Promise<any> {
    const response = await fetch(`/api/stats/users`);

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    return data;
}

// Fetch admins
export async function fetchAdmins(): Promise<string[] | null> {
    try {
        const response = await fetch('/api/appSettings/admins');
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching admins:", error);
        return null;
    }
}

// Check if a user is an admin
export async function checkIfAdmin(user: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/appSettings/isAdmin/${user}`);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error checking if user is admin:", error);
        return false;
    }
}

export async function getFirstAdminProfile(): Promise<any> {
    const admins = await fetchAdmins();
    if (admins && admins.length > 0) {
        return getUserdataByID(admins[0]);
    } else {
        return null;
    }
}
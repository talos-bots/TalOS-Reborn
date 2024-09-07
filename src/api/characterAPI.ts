import { User } from '../components/shared/auth-provider';
import { Character } from '../global_classes/Character';
import { emitCharacterUpdated } from '../helpers/events';
import axios from "axios";

const api = axios.create({ baseURL: '' });

export async function saveCharacterToLocal(character: Character): Promise<void> {
  const response = await api('/api/save/character', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(character.toJSON()),
  });

  if (response.status !== 200) {
    throw new Error(`Error: ${response.status}`);
  }

  console.log('Character saved successfully!');
  emitCharacterUpdated();
}

export async function fetchCharacterById(id: string): Promise<Character | null> {
  const response = await api(`/api/character/${id}`);

  if (response.status !== 200) {
    if (response.status === 404) {
      console.log('Character not found');
      return null;
    }
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.data;
  return Character.fromJSON(data);
}

export async function fetchAllCharacters(): Promise<Character[]> {
  const response = await api('/api/characters');

  if (response.status !== 200) {
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.data
  if (!Array.isArray(data)) return [];
  return data.map((character: any) => Character.fromJSON(character));
}

export async function deleteCharacterById(id: string): Promise<void> {
  const response = await api(`/api/character/${id}`, {
    method: 'DELETE',
  });

  if (response.status !== 200) {
    throw new Error(`Error: ${response.status}`);
  }

  console.log('Character deleted successfully!');
  emitCharacterUpdated();
}

export async function getCharactersByUserID(id: string): Promise<Character[]> {
  const response = await api(`/api/characters/creator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      creator: id,
    }),
  });

  if (response.status !== 200) {
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.data
  return data.map((character: any) => Character.fromJSON(character));
}

export async function getUserdataByID(id: string): Promise<User> {
  const response = await api(`/api/profile/${id}`);

  if (response.status !== 200) {
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.data
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
  const response = await api(`/api/profiles`);

  if (response.status !== 200) {
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.data
  return data;
}

interface UserConnection {
  userId: string;
  socketId: string;
}

interface UserStatsResponse {
  users: User[];
  activeUsers: UserConnection[];
}

// get all users
export async function getAllUsers(): Promise<UserStatsResponse> {
  const response = await api(`/api/stats/users`);

  if (response.status !== 200) {
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.data;
  const users = data.users.map((user: any) => {
    const newUser: User = {
      id: user.id,
      username: user.username,
      profilePic: user.profile_pic,
      displayName: user.display_name,
      tagline: user.tagline,
      bio: user.bio,
      backgroundPic: user.background_pic,
    };
    return newUser;
  });
  const assembledData: UserStatsResponse = {
    users: users,
    activeUsers: data.activeUsers,
  };
  return assembledData;
}

// Fetch admins
export async function fetchAdmins(): Promise<string[] | null> {
  try {
    const response = await api('/api/appSettings/admins');
    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching admins:", error);
    return null;
  }
}

// Check if a user is an admin
export async function checkIfAdmin(user: string): Promise<boolean> {
  try {
    const response = await api(`/api/appSettings/isAdmin/${user}`);
    if (response.status !== 200) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.data;
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
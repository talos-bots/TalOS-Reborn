import axios from 'axios';

const api = axios.create({baseURL: ''});

// Get all lorebooks
export async function getAllLorebooks() {
    try {
        const response = await api.get(`/api/lorebooks`);
        return response.data;
    } catch (error) {
        console.error('Error fetching all lorebooks:', error);
        throw error;
    }
}

// Save a lorebook
export async function saveLorebook(lorebook: any) {
    try {
        const response = await api.post(`/api/save/lorebook`, lorebook);
        return response.data;
    } catch (error) {
        console.error('Error saving lorebook:', error);
        throw error;
    }
}

// Get a lorebook by ID
export async function getLorebookById(id: string) {
    try {
        const response = await api.get(`/api/lorebooks/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching lorebook with ID ${id}:`, error);
        throw error;
    }
}

// Remove a lorebook by ID
export async function removeLorebookById(id: string) {
    try {
        const response = await api.delete(`/api/lorebooks/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error removing lorebook with ID ${id}:`, error);
        throw error;
    }
}
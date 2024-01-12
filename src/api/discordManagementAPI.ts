import axios from 'axios';
import { DiscordConfig } from '../types';

const apiClient = axios.create({
    baseURL: '/api/discordManagement'
});

export const startDiscordBot = async (config?: DiscordConfig) => {
    return apiClient.post('/start', { config })
        .then(response => response.data)
        .catch(error => console.error(error));
};

export const refreshProfile = async (config?: DiscordConfig) => {
    return apiClient.post('/refreshProfile', { config })
        .then(response => response.data)
        .catch(error => console.error(error));
};

export const checkIfDiscordIsConnected = async () => {
    return apiClient.get('/isConnected')
        .then(response => response.data)
        .catch(error => console.error(error));
};

export const checkIfDiscordIsProcessing = async () => {
    return apiClient.get('/isProcessing')
        .then(response => response.data)
        .catch(error => console.error(error));
};

export const stopDiscordBot = async () => {
    return apiClient.post('/stop')
        .then(response => response.data)
        .catch(error => console.error(error));
};

export const getGuilds = async () => {
    return apiClient.post('/guilds')
        .then(response => response.data)
        .catch(error => console.error(error));
};

export const getChannels = async (guildId: string) => {
    return apiClient.post('/channels', { guildId })
        .then(response => response.data)
        .catch(error => console.error(error));
};

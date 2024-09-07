import axios from 'axios';
import { DiscordConfig, DiscordGlobalConfig } from '../types';

// Function to fetch all Discord configs
export async function fetchAllDiscordConfigs(): Promise<DiscordConfig[]> {
  return await axios.get('/api/discordConfigs')
    .then(response => response.data)
    .catch(error => console.error('Error fetching Discord configs:', error));
}

// Function to save a Discord config
export async function saveDiscordConfig(discordConfig: DiscordConfig): Promise<any> {
  return await axios.post('/api/save/discordConfig', discordConfig)
    .then(response => response.data)
    .catch(error => console.error('Error saving Discord config:', error));
}

// Function to fetch a Discord config by ID
export async function fetchDiscordConfigById(id: string): Promise<DiscordConfig | null> {
  return await axios.get(`/api/discordConfigs/${id}`)
    .then(response => response.data)
    .catch(error => {
      console.error('Error fetching Discord config by ID:', error);
      return null;
    });
}

// Function to remove a Discord config by ID
export async function removeDiscordConfigById(id: string): Promise<any> {
  return await axios.delete(`/api/discordConfig/${id}`)
    .then(response => response.data)
    .catch(error => console.error('Error removing Discord config:', error));
}

// Function to set global Discord config
export async function setGlobalDiscordConfig(globalConfig: DiscordGlobalConfig): Promise<any> {
  return await axios.post('/api/save/discordDefaults', globalConfig)
    .then(response => response.data)
    .catch(error => console.error('Error setting global Discord config:', error));
}

// Function to fetch global Discord config
export async function fetchGlobalDiscordConfig(): Promise<DiscordGlobalConfig | null> {
  return await axios.get('/api/discordDefaults')
    .then(response => response.data)
    .catch(error => {
      console.error('Error fetching global Discord config:', error);
      return null;
    });
}
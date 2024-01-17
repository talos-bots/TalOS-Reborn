import axios from "axios";
import { SettingsInterface } from "../types";

const api = axios.create({baseURL: ''});

export async function saveSettingToLocal(setting: SettingsInterface): Promise<void> {
    const response = await api('/api/save/setting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(setting),
    });

    if (response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
    }

    console.log('Character saved successfully!');
}

export async function fetchSettingById(id: string): Promise<SettingsInterface | null> {
    const response = await api(`/api/setting/${id}`);

    if (response.status !== 200) {
        if (response.status === 404) {
            console.log('Character not found');
            return null;
        }
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.data
    console.log(data);
    return data as SettingsInterface;
}

export async function fetchAllSettings(): Promise<SettingsInterface[]> {
    const response = await api('/api/settings');

    if (response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.data
    console.log(data);
    return data.map((character: any) => character as SettingsInterface);
}

export async function fetchDefaultSettings(): Promise<SettingsInterface[] | null> {
    const response = await api('/api/settings/default');

    if (response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.data
    console.log(data);
    return data.map((character: any) => character as SettingsInterface);
}

export async function deleteSettingById(id: string): Promise<void> {
    const response = await api(`/api/setting/${id}`, {
        method: 'DELETE',
    });

    if (response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
    }

    console.log('Setting deleted successfully!');
}

interface AppSettingsInterface {
    defaultConnection: string;
    defaultSettings: string;
    admins: string[];
    enableCaptioning: boolean;
    enableEmbedding: boolean;
    enableQuestionAnswering: boolean;
    enableZeroShotClassification: boolean;
    enableYesNoMaybe: boolean;
    defaultDiffusionConnection: string;
}

// Fetch all app settings
export async function fetchAllAppSettings(): Promise<AppSettingsInterface | null> {
    try {
        const response = await api('/api/appSettings');
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.data as AppSettingsInterface;
    } catch (error) {
        console.error("Error fetching app settings:", error);
        return null;
    }
}

// Save an app setting
export async function saveAppSetting(appSetting: AppSettingsInterface): Promise<void> {
    try {
        const response = await api('/api/save/appSetting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(appSetting),
        });
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
    } catch (error) {
        console.error("Error saving app setting:", error);
    }
}

// Get default connection setting
export async function getAppSettingsConnection(): Promise<string | null> {
    try {
        const response = await api('/api/appSettings/connection');
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching default connection:", error);
        return null;
    }
}

export async function getAppSettingsDiffusionConnection(): Promise<string | null> {
    try {
        const response = await api('/api/appSettings/defaultDiffusionConnection');
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching default diffusion connection:", error);
        return null;
    }
}

// Get default settings
export async function getAppSettingsSettings(): Promise<string | null> {
    try {
        const response = await api('/api/appSettings/settings');
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching default settings:", error);
        return null;
    }
}

// Set default connection setting
export async function setAppSettingsConnection(connectionId: string): Promise<void> {
    try {
        const response = await api('/api/appSettings/connection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ connectionid: connectionId }),
        });
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
    } catch (error) {
        console.error("Error setting default connection:", error);
    }
}

// set default diffusion connection
export async function setAppSettingsDiffusion(diffusionId: string): Promise<void> {
    try {
        const response = await api('/api/appSettings/defaultDiffusionConnection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ diffusionId: diffusionId }),
        });
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
        console.log(response.data);
    } catch (error) {
        console.error("Error setting default diffusion connection:", error);
    }
}

// Set default settings
export async function setAppSettingsSettings(settingsId: string): Promise<void> {
    try {
        const response = await api('/api/appSettings/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ settingsid: settingsId }),
        });
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
    } catch (error) {
        console.error("Error setting default settings:", error);
    }
}

// Fetch status of a specific feature
export async function fetchFeatureStatus(feature: string): Promise<boolean | null> {
    try {
        const response = await api(`/api/appSettings/${feature}`);
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${feature} status:`, error);
        return null;
    }
}

// Update status of a specific feature
export async function updateFeatureStatus(feature: string, status: boolean): Promise<void> {
    try {
        const response = await api(`/api/appSettings/${feature}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ [feature]: status }),
        });
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error updating ${feature} status:`, error);
    }
}

// Update admins
export async function updateAdmins(admins: string[]): Promise<void> {
    try {
        const response = await api('/api/appSettings/admins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ admins }),
        });
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }
    } catch (error) {
        console.error("Error updating admins:", error);
    }
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SettingsInterface } from "../types";

export async function saveSettingToLocal(setting: SettingsInterface): Promise<void> {
    const response = await fetch('/api/save/setting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(setting),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    console.log('Character saved successfully!');
}

export async function fetchSettingById(id: string): Promise<SettingsInterface | null> {
    const response = await fetch(`/api/setting/${id}`);

    if (!response.ok) {
        if (response.status === 404) {
            console.log('Character not found');
            return null;
        }
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    console.log(data);
    return data as SettingsInterface;
}

export async function fetchAllSettings(): Promise<SettingsInterface[]> {
    const response = await fetch('/api/settings');

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    console.log(data);
    return data.map((character: any) => character as SettingsInterface);
}

export async function deleteSettingById(id: string): Promise<void> {
    const response = await fetch(`/api/setting/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
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
}

// Fetch all app settings
export async function fetchAllAppSettings(): Promise<AppSettingsInterface | null> {
    try {
        const response = await fetch('/api/appSettings');
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.json() as Promise<AppSettingsInterface>;
    } catch (error) {
        console.error("Error fetching app settings:", error);
        return null;
    }
}

// Save an app setting
export async function saveAppSetting(appSetting: AppSettingsInterface): Promise<void> {
    try {
        const response = await fetch('/api/save/appSetting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appSetting),
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
    } catch (error) {
        console.error("Error saving app setting:", error);
    }
}

// Get default connection setting
export async function getAppSettingsConnection(): Promise<string | null> {
    try {
        const response = await fetch('/api/appSettings/connection');
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.text();
    } catch (error) {
        console.error("Error fetching default connection:", error);
        return null;
    }
}

// Get default settings
export async function getAppSettingsSettings(): Promise<string | null> {
    try {
        const response = await fetch('/api/appSettings/settings');
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.text();
    } catch (error) {
        console.error("Error fetching default settings:", error);
        return null;
    }
}

// Set default connection setting
export async function setAppSettingsConnection(connectionId: string): Promise<void> {
    try {
        const response = await fetch('/api/appSettings/connection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ connectionid: connectionId }),
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
    } catch (error) {
        console.error("Error setting default connection:", error);
    }
}

// Set default settings
export async function setAppSettingsSettings(settingsId: string): Promise<void> {
    try {
        const response = await fetch('/api/appSettings/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ settingsid: settingsId }),
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
    } catch (error) {
        console.error("Error setting default settings:", error);
    }
}

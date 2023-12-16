/* eslint-disable @typescript-eslint/no-explicit-any */
import { SettingsInterface } from "../types";

export async function saveSettingToLocal(setting: SettingsInterface): Promise<void> {
    const response = await fetch('/api/save/settings', {
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
    const response = await fetch('/api/setting');

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
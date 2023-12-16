/* eslint-disable @typescript-eslint/no-explicit-any */
import { GenericCompletionConnectionTemplate } from "../types";

export async function saveConnectionToLocal(connection: GenericCompletionConnectionTemplate): Promise<void> {
    const response = await fetch('/api/save/connection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    console.log('Character saved successfully!');
}

export async function fetchConnectionById(id: string): Promise<GenericCompletionConnectionTemplate | null> {
    const response = await fetch(`/api/connection/${id}`);

    if (!response.ok) {
        if (response.status === 404) {
            console.log('Character not found');
            return null;
        }
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    console.log(data);
    return data as GenericCompletionConnectionTemplate;
}

export async function fetchAllConnections(): Promise<GenericCompletionConnectionTemplate[]> {
    const response = await fetch('/api/connections');

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json()
    console.log(data);
    return data.map((character: any) => character as GenericCompletionConnectionTemplate);
}

export async function deleteConnectionById(id: string): Promise<void> {
    const response = await fetch(`/api/connection/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    console.log('Connection deleted successfully!');
}

export async function fetchConnectionModels(url: string): Promise<any> {
    try {
        const response = await fetch(`/api/test/connections`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });
        
        if (!response.ok) {
            console.error('Error fetching connection models:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Fetched connection models:', data);
        if(data.error) {
            console.error('Error fetching connection models:', data.error);
            return null;
        }else{
            return data.data.map((model: any) => model.id);
        }
    } catch (error) {
        console.error('Error in fetchConnectionModels:', error);
        return null;
    }
}

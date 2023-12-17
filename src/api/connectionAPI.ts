/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserPersona } from "../global_classes/Character";
import { CharacterInterface, CompletionRequest, GenericCompletionConnectionTemplate, Message } from "../types";

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

export async function fetchConnectionModels(url: string, key?: string): Promise<any> {
    try {
        const response = await fetch(`/api/test/connections`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, key }),
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

export async function fetchMancerModels(key?: string){
    try {
        const response = await fetch(`/api/test/mancer`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key }),
        });
        
        if (!response.ok) {
            console.error('Error fetching mancer models:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Fetched mancer models:', data);
        if(data.error) {
            console.error('Error fetching mancer models:', data.error);
            return null;
        }else{
            return data.data.map((model: any) => model.id);
        }
    } catch (error) {
        console.error('Error in fetchMancerModels:', error);
        return null;
    }
}

export async function sendCompletionRequest(messages: Message[], character: CharacterInterface, persona: UserPersona, connectionid?: string, settingsid?: string){
    const newRequest: CompletionRequest = {
        lorebookid: 'mancer',
        messages,
        character,
        persona,
        connectionid,
        settingsid,
    }

    try {
        const response = await fetch(`/api/completions`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newRequest),
        });
        
        if (!response.ok) {
            console.error('Error sending mancer completion request:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Sent mancer completion request:', data);
        if(data.error) {
            console.error('Error sending mancer completion request:', data.error);
            return null;
        }else{
            return data.data;
        }
    } catch (error) {
        console.error('Error in sendCompletionRequest:', error);
        return null;
    }
}
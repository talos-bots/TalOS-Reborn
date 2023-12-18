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

export async function fetchPalmModels(key?: string){
    try {
        const response = await fetch(`/api/test/palm`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key }),
        }).then((response) => {
            return response;
        }).catch((error) => {
            console.error('Error sending palm completion request:', error);
            return null;
        });
        
        if (!response.ok) {
            console.error('Error fetching palm models:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Fetched palm models:', data);
        if(data.error) {
            console.error('Error fetching palm models:', data.error);
            return null;
        }else{
            return data.models.filter(
                (model: any) => model.supportedGenerationMethods.includes("generateText") || model.supportedGenerationMethods.includes("generateContent")
            ).map((model: any) => {
                return model.name
            });
        }
    } catch (error) {
        console.error('Error in fetchPalmModel:', error);
        return null;
    }
}

export async function fetchOpenAIModels(key?: string){
    try {
        const response = await fetch(`/api/test/openai`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key }),
        });
        
        if (!response.ok) {
            console.error('Error fetching openai models:', response.status);
            return null;
        }

        const data = await response.json();
        if(data.error) {
            console.error('Error fetching openai models:', data.error);
            return null;
        }else{
            return data.data.filter((model: any) => (model.id.includes('gpt'))).map((model: any) => model.id);
        }
    } catch (error) {
        console.error('Error in fetchOpenAIModels:', error);
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
        }).then((response) => {
            return response;
        }).catch((error) => {
            console.error('Error sending completion request:', error);
            return null;
        });
        
        if (!response.ok) {
            console.error('Error sending completion request:', response.status);
            return null;
        }

        const data = await response.json();
        console.log('Fetched completion:', data);
        return data;
    } catch (error) {
        console.error('Error in sendCompletionRequest:', error);
        return null;
    }
}
import axios, { AxiosError } from "axios";
import { DiffusionCompletionConnectionTemplate, DiffusionResponseObject } from "../types";

const api = axios.create({baseURL: ''});

export async function saveDiffusionConnectionToLocal(connection: DiffusionCompletionConnectionTemplate): Promise<void> {
    const response = await api('/api/save/diffusion-connection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(connection),
    });

    if (response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
    }

    console.log('Diffusion Connection saved successfully!');
}

export async function fetchDiffusionConnectionById(id: string): Promise<DiffusionCompletionConnectionTemplate | null> {
    const response = await api(`/api/diffusion-connection/${id}`);

    if (response.status !== 200) {
        if (response.status === 404) {
            console.log('Character not found');
            return null;
        }
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.data
    console.log(data);
    return data as DiffusionCompletionConnectionTemplate;
}

export async function fetchAllDiffusionConnections(): Promise<DiffusionCompletionConnectionTemplate[]> {
    const response = await api('/api/diffusion-connections');

    if (response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.data
    console.log(data);
    return data.map((character: any) => character as DiffusionCompletionConnectionTemplate);
}

export async function deleteDiffusionConnectionById(id: string): Promise<void> {
    const response = await api(`/api/diffusion-connection/${id}`, {
        method: 'DELETE',
    });

    if (response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
    }

    console.log('Diffusion Connection deleted successfully!');
}

export async function fetchDiffusionConnectionModels(url: string, key?: string): Promise<any> {
    try {
        const response = await api(`/api/test/diffusion`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ url, key }),
        });
        
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.data;
        if(data.error) {
            console.error('Error fetching connection models:', data.error);
            return null;
        }else{
            if(!data?.data){
                if(!Array.isArray(data)){
                    return null;
                }
                return data.map((model: any) => model.id);
            }else if(data?.data?.data){
                if(!Array.isArray(data.data.data)){
                    return null;
                }
                return data.data.data.map((model: any) => model.id);
            }else if(data?.data){
                if(!Array.isArray(data.data)){
                    return null
                }
                return data.data.map((model: any) => model.id);
            }
        }
    } catch (error) {
        console.error('Error in fetchDiffusionConnectionModels:', error);
        return null;
    }
}

export async function testDallekey(key: string){
    try {
        const response = await api(`/api/test-dalle-key`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({ key }),
        });
        
        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.data;
        if(data.error) {
            console.error('Error fetching connection models:', data.error);
            return null;
        }else{
            if(!data?.data){
                if(!Array.isArray(data)){
                    return null;
                }
                return data.map((model: any) => model.id);
            }else if(data?.data?.data){
                if(!Array.isArray(data.data.data)){
                    return null;
                }
                return data.data.data.map((model: any) => model.id);
            }else if(data?.data){
                if(!Array.isArray(data.data)){
                    return null
                }
                const models = data.data.map((model: any) => model.id);
                return models;
            }
        }
    } catch (error) {
        console.error('Error in fetchDiffusionConnectionModels:', error);
        return null;
    }
}

export async function generateDalleImage(prompt: string | null, size: string | null, samples: number | null, style: string | null, connectionId: string, model_id: string): Promise<DiffusionResponseObject[]> {
    const response = await api('/api/dalle/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({ prompt, size, samples, style, connectionId, model_id }),
    });

    if (response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.data;
    console.log(data);
    switch (model_id) {
        case "dall-e-3":
            return data.data.map((image: any) => {
                return {
                    url: image.url,
                    revisedPrompt: image.revised_prompt ?? '',
                }
            });
        case "dall-e-2":
            return data.data.map((image: any) => {
                return {
                    url: image.url,
                    revisedPrompt: image.revised_prompt ?? '',
                }
            });
        default:
            return []
    }
    return data;
}
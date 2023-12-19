import axios from "axios";

const api = axios.create({baseURL: ''});
  
export async function uploadBackground(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api('/api/background/upload', {
        method: 'POST',
        data: formData,
    });
    if (response.status === 200) {
        return `${file.name}`;
    }
}

export async function deleteBackground(filename: string): Promise<any> {
    const formData = new FormData();
    formData.append('filename', filename);
    const response = await api('/api/background/delete', {
        method: 'POST',
        data: formData,
    });
    return response;
}

export async function renameBackground(oldFilename: string, newFilename: string): Promise<any> {
    const formData = new FormData();
    formData.append('oldFilename', oldFilename);
    formData.append('newFilename', newFilename);
    const response = await api('/api/background/rename', {
        method: 'POST',
        data: formData,
    });
    if (response.status === 200) {
        return `${newFilename}`;
    }
}

export async function fetchAllBackgrounds(): Promise<any> {
    const response = await api('/api/background/all');
    const data = await response.data;
    return data;
}
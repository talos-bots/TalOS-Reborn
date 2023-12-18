export async function uploadBackground(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/background/upload', {
        method: 'POST',
        body: formData,
    });
    if (response.status === 200) {
        return `${file.name}`;
    }
}

export async function deleteBackground(filename: string): Promise<any> {
    const formData = new FormData();
    formData.append('filename', filename);
    const response = await fetch('/api/background/delete', {
        method: 'POST',
        body: formData,
    });
    return response;
}

export async function renameBackground(oldFilename: string, newFilename: string): Promise<any> {
    const formData = new FormData();
    formData.append('oldFilename', oldFilename);
    formData.append('newFilename', newFilename);
    const response = await fetch('/api/background/rename', {
        method: 'POST',
        body: formData,
    });
    if (response.status === 200) {
        return `${newFilename}`;
    }
}

export async function fetchAllBackgrounds(): Promise<any> {
    const response = await fetch('/api/background/all');
    const data = await response.json();
    return data;
}
import axios from "axios";

const api = axios.create({ baseURL: '' });

export async function uploadFile(file: File) {
  // Generate a unique name for the file
  const uniqueName = new Date().getTime() + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');

  // Create a Blob from the file
  const blob = new Blob([file], { type: file.type });

  // Create a new File object with the unique name
  const newFile = new File([blob], uniqueName);

  // Prepare FormData
  const formData = new FormData();
  formData.append('image', newFile);

  // Perform the fetch request
  const response = await api('/api/files/upload', {
    method: 'POST',
    data: formData
  });

  const data = await response.data;
  console.log(data);

  // Return the path with the unique file name
  return `/images/${uniqueName}`;
}

export async function uploadProfilePicture(file: File) {
  // Generate a unique name for the file
  const uniqueName = new Date().getTime() + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');

  // Create a Blob from the file
  const blob = new Blob([file], { type: file.type });

  // Create a new File object with the unique name
  const newFile = new File([blob], uniqueName);

  // Prepare FormData
  const formData = new FormData();
  formData.append('image', newFile);

  // Perform the fetch request
  const response = await api('/api/pfp/upload', {
    method: 'POST',
    data: formData
  });

  const data = await response.data;
  console.log(data);

  // Return the path with the unique file name
  return `/pfp/${uniqueName}`;
}
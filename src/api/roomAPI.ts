import axios from 'axios';
import { Room } from '../types';

const apiClient = axios.create({
    baseURL: '/api/rooms'
});

async function getRooms() {
    return await apiClient.get('/').then(response => response.data).catch(err => console.error(err));
}

async function getRoomById(id: string) {
    return await apiClient.get(`/${id}`).then(response => response.data).catch(err => console.error(err));
}

async function saveRoom(roomData: Room) {
    return await apiClient.post('/save', roomData).then(response => response.data).catch(err => console.error(err));
}

async function removeRoomById(id: string) {
    return await apiClient.delete(`/${id}`).then(response => (
        console.log(response.data),
        response.data
    )).catch(err => console.error(err));
}

export { getRooms, getRoomById, saveRoom, removeRoomById };
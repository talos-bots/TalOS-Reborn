import React, { useEffect, useState } from 'react';
import { Room } from '../../../types';
import { getRooms, removeRoomById } from '../../../api/roomAPI';
import RoomItem from './RoomItem';
import { useUser } from '../../../components/shared/auth-provider';
import RoomSettings from './RoomSettings';

interface RoomManagerProps {
    discordOnline: boolean;
}

const RoomManager = ({ discordOnline } : RoomManagerProps) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const { user } = useUser();

    useEffect(() => {
        getRooms().then((rooms) => {
            console.log(rooms);
            setRooms(rooms);
            setSelectedRoom(rooms[0]);
        });
    }, []);

    const createNewRoom = () => {
        const room: Room = {
            _id: new Date().getTime().toString(),
            name: 'New Room',
            description: 'A new room.',
            createdBy: user?.id || '',
            channelId: '',
            guildId: '',
            isPrivate: false,
            isLocked: false,
            createdAt: new Date(),
            lastModified: new Date(),
            messages: [],
            bannedUsers: [],
            bannedPhrases: [],
            whitelistUsers: [],
            characters: [],
            aliases: [],
            authorsNotes: [],
            authorsNoteDepth: 0,
            allowRegeneration: false,
            allowDeletion: false,
            users: [],
            overrides: [], 
        }
        setRooms([...rooms, room]);
        setSelectedRoom(room);
    }

    const delRoom = (room: Room) => {
        const newRooms = rooms.filter((r) => r._id !== room._id);
        removeRoomById(room._id);
        setRooms(newRooms);
        setSelectedRoom(newRooms[0]);
    }

    return (
        <div className='grid grid-cols-1 md:grid-cols-6 gap-2 h-full'>
            <div className='flex flex-col gap-2 col-span-4 h-full max-h-full'>
                <label className="font-bold w-full text-left">Rooms</label>
                <div className='dy-textarea dy-textarea-bordered flex-grow grid grid-cols-3 overflow-y-scroll justify-center'>
                    <div className='flex flex-col justify-between rounded-box dy-textarea dy-textarea-bordered max-w-[256px] w-[256px] max-h-[256px] h-[256px]'>
                        <h3 className='text-center  font-semibold'>What is a Room?</h3>
                        <p className='text-center'>A room is a digital space where humans and language models can interact. Rooms are available through discord, and through the TalOS: Reborn Rooms page.</p>
                        <button className='dy-btn dy-btn-primary' onClick={()=>{createNewRoom()}}>Create Room</button>
                    </div>
                    {rooms.map((room) => (
                        <RoomItem key={room._id} room={room} setSelectedRoom={setSelectedRoom} delRoom={delRoom}/>
                    ))}
                </div>
            </div>
            <div className='flex flex-col gap-2 col-span-2 h-full max-h-full'>
                <span className="font-bold w-full justify-between flex flex-row"><p>Room Settings</p></span>
                <div className='dy-textarea dy-textarea-bordered flex-grow overflow-y-scroll'>
                    <RoomSettings discordOnline={discordOnline} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom}/>
                </div>
            </div>
        </div>
    );
}
export default RoomManager;
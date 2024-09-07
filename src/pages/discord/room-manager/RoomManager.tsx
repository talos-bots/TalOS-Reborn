import React, { useEffect, useState } from 'react';
import { Room } from '../../../types';
import { getRooms, removeRoomById } from '../../../api/roomAPI';
import RoomItem from './RoomItem';
import { useUser } from '../../../components/shared/auth-provider';
import RoomSettings from './RoomSettings';

interface RoomManagerProps {
  discordOnline: boolean;
}

const RoomManager = ({ discordOnline }: RoomManagerProps) => {
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
      allowMultiline: false,
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
    <div className='grid grid-cols-1 md:grid-cols-4 md:gap-2 h-full w-full'>
      <div className='flex flex-col gap-2 md:col-span-1 h-full max-h-full'>
        <button className='dy-btn dy-btn-primary dy-btn-sm' onClick={() => { createNewRoom() }}>Create Room</button>
        <div className='flex flex-col gap-2 overflow-y-auto h-full border dy-textarea-bordered p-2'>
        {rooms.map((room) => (
          <RoomItem key={room._id} room={room} setSelectedRoom={setSelectedRoom} delRoom={delRoom} />
        ))}
        </div>
      </div>
      <div className='flex flex-col gap-2 md:col-span-3 h-full max-h-full w-full'>
        <span className="font-bold w-full justify-between flex flex-row"><p>Room Settings</p></span>
        <div className='dy-textarea dy-textarea-bordered flex-grow overflow-y-scroll w-full'>
          <RoomSettings discordOnline={discordOnline} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} />
        </div>
      </div>
    </div>
  );
}
export default RoomManager;
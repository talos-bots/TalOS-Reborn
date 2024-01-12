import React, { useEffect, useState } from 'react';
import { Room } from '../../../types';
const RoomManager = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 h-full'>
            <div className='flex flex-col gap-2 col-span-1 h-full'>
                <label className="font-bold w-full text-left">Rooms</label>
                <div className='dy-textarea dy-textarea-bordered flex-grow'>

                </div>
            </div>
            <div className='flex flex-col gap-2 col-span-1 h-full'>
                <span className="font-bold w-full justify-between flex flex-row"><p>Room Settings</p><p>{selectedRoom?.name}</p></span>
                <div className='dy-textarea dy-textarea-bordered flex-grow'>

                </div>
            </div>
        </div>
    );
}
export default RoomManager;
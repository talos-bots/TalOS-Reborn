import { Check, Trash } from "lucide-react";
import { Room } from "../../../types";
import { UserInfo } from "../../../global_classes/UserInfo";
import { useEffect, useState } from "react";
import { getUserdataByID } from "../../../api/characterAPI";
import { User } from "../../../components/shared/auth-provider";
import { confirmModal } from "../../../components/shared/confirm-modal";

interface RoomItemProps {
  room: Room;
  setSelectedRoom: (room: Room) => void;
  delRoom: (room: Room) => void;
}

const RoomItem = ({ room, setSelectedRoom, delRoom }: RoomItemProps) => {
  const [userInfo, setUserInfo] = useState<User | null>(null);

  useEffect(() => {
    getUserdataByID(room.createdBy).then((userInfo) => {
      setUserInfo(userInfo);
    });
  }, [room.createdBy]);

  return (
    <div 
      className='flex flex-row justify-between items-center rounded-md dy-textarea-bordered border p-2 bg-base-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:bg-base-300'
      onClick={() => setSelectedRoom(room)}
    >
      <div>
        <h3 className='text-lg font-bold'>{room.name}</h3>
        <p className='text-sm line-clamp-1'>{room.description}</p>
      </div>
      <div className='flex flex-wrap gap-1'>
        <button 
          className='dy-btn dy-btn-sm dy-btn-error' 
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (await confirmModal('Are you sure you want to delete this room?')) {
              delRoom(room);
            }
          }}
        >
          <Trash size={16} />
        </button>
      </div>
    </div>
  );
}

export default RoomItem;
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
        <div className='flex flex-col justify-between rounded-box dy-textarea dy-textarea-bordered max-w-[256px] w-[256px] max-h-[256px] h-[256px]'>
            <div className="overflow-y">
                <h3 className="text-center text-ellipsis font-semibold">{room.name}</h3>
                <label className="font-bold w-full text-left text-sm">Description</label>
                <p className="text-ellipsis text-sm">{room.description}</p>
                <div className="flex flex-row gap-2 justify-between">
                    <div>
                        <label className="font-bold w-full text-left text-sm">Messages</label>
                        <p className="text-ellipsis text-sm">{room.messages.length}</p>
                    </div>
                    <div>
                        <label className="font-bold w-full text-left text-sm">Created By</label>
                        <p className="text-ellipsis text-sm">{userInfo?.displayName}</p>
                    </div>
                </div>
            </div>
            <div className='flex flex-row gap-2 w-full items-center justify-center'>
                <button className='dy-btn dy-btn-primary' onClick={() => { setSelectedRoom(room) }}>
                    <Check/>
                </button>
                <button className='dy-btn dy-btn-error' onClick={async () => { if(await confirmModal('Are you sure you want to delete this room?')) delRoom(room); }}>
                    <Trash/>
                </button>
            </div>
        </div>
    );
}
export default RoomItem;
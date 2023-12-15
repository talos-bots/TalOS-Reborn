import React from 'react';
import { useEffect, useState } from "react";
import { getUserDataCallable } from "../../../firebase_api/userlore";
import { checkIsAdmin, makeAdmin, removeAdmin } from "../../../firebase_api/adminAPI";

interface UserDisplayProps {
    uid: string;
}
const UserDisplay = (props: UserDisplayProps) => {
    const { uid } = props;
    const [displayName, setDisplayName] = useState<string>('');
    const [photoURL, setPhotoURL] = useState<string>('');
    const [isAdministrator, setIsAdministrator] = useState<boolean>(false);

    useEffect(() => {
        const userData = getUserDataCallable(uid);
        userData.then((result) => {
            if(result === null) {
                return;
            }else{
                setDisplayName(result.displayName);
                setPhotoURL(result.photoURL);
            }
        });
        const init = async () => {
            const isAdmin = await checkIsAdmin(uid);
            setIsAdministrator(isAdmin);
        }
        init();
    }, [uid]);

    const handleMakeAdmin = async () => {
        await makeAdmin(uid).then(() => {
            console.log('Successfully made admin!');
            setIsAdministrator(true);
        }).catch((error) => {
            console.log(error);
        });
    }

    const handleRemoveAdmin = async () => {
        await removeAdmin(uid).then(() => {
            console.log('Successfully removed admin!');
            setIsAdministrator(false);
        }).catch((error) => {
            console.log(error);
        });
    }

    if((displayName === '' || photoURL === '') || (displayName === undefined || photoURL === undefined) || (displayName.length < 2 || photoURL.length < 2)) return null;

    return (
        <div className="flex flex-row mt-2 py-2 px-4 items-center justify-between pop-in rounded-box bg-base-100">
            <img className="avatar w-14 h-14" src={photoURL} alt={displayName} />
            <p className="text-left ml-4 font-semibold">{displayName} {isAdministrator? '(Admin)' : ''}</p>
            {!isAdministrator? <button className="dy-btn hover:dy-btn-primary" onClick={()=>{handleMakeAdmin()}}>Make Admin</button> : <button className="hover:dy-btn-warning dy-btn" onClick={()=>{handleRemoveAdmin()}}>Revoke Admin</button>}
        </div>
    );
};
export default UserDisplay;
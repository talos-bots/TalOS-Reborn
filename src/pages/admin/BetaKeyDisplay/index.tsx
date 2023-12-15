/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useEffect, useState } from "react";
import { getUserDataCallable } from "../../../firebase_api/userlore";
import { Eye, User } from "lucide-react";
import { BetaKey } from "../../../global_classes/BetaKey";

interface BetaKeyDisplayInterface {
    betakey: BetaKey;
}
const BetaKeyDisplay = (props: BetaKeyDisplayInterface) => {
    const { betakey } = props;
    const [creatorName, setCreatorName] = useState<string>('');
    const [creatorPhoto, setCreatorPhoto] = useState<string>('');
    const [registrant, setRegistrant] = useState<string>('');
    useEffect(() => {
        const init = async () => {
            const data = await getUserDataCallable(betakey.creator);
            setCreatorName(data?.displayName ?? '');
            setCreatorPhoto(data?.photoURL ?? '');
            if(betakey.registeredUser === '') return setRegistrant('');
            const registrantData = await getUserDataCallable(betakey.registeredUser);
            setRegistrant(registrantData?.displayName ?? '');
        }
        if (betakey) {
            init();
        }
    }, [betakey]);

    return (
        <tr>
            <th>{betakey?.key}</th>
            <td>{creatorName} {betakey?.creator === '' ? <User className="avatar w-14 h-14 bg-blue-gray-300 hover:cursor-default"/> : <img src={creatorPhoto} alt="avatar" className="hover:cursor-default w-14 h-14 avatar object-cover object-top" />}</td>
            <td>{betakey?.requests > 0 ? betakey.requests : 'None'}</td>
            <td>{registrant.length > 0 ? registrant : 'None'}</td>
        </tr>
    )
}
export default BetaKeyDisplay;

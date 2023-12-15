/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useEffect, useState } from "react";
import { getUserDataCallable } from "../../../firebase_api/userlore";
import { Eye, User } from "lucide-react";
import { Character } from "../../../global_classes/Character";

interface CharacterTableDisplayProps {
    character: Character;
    viewCharacter: (character: Character) => void;
}
const CharacterTableDisplay = (props: CharacterTableDisplayProps) => {
    const { character, viewCharacter } = props;
    const [creatorName, setCreatorName] = useState<string>('');
    const [creatorPhoto, setCreatorPhoto] = useState<string>('');

    useEffect(() => {
        const init = async () => {
            const data = await getUserDataCallable(character.creator);
            setCreatorName(data?.displayName ?? '');
            setCreatorPhoto(data?.photoURL ?? '');
        }
        if (character) {
            init();
        }
    }, [character]);

    return (
        <tr>
            <th>{character?.name}</th>
            <td>{character?.avatar === '' ? <User className="avatar w-14 h-14 bg-blue-gray-300 hover:cursor-default"/> : <img src={character.avatar} alt="avatar" className="hover:cursor-default w-14 h-14 avatar object-cover object-top" />}</td>
            <td>{character._id ? new Date(parseInt(character._id, 10)).toLocaleString() : ''}</td>
            <td>{creatorName}</td>
            <td>{character?.verification_info?.status}</td>
            <td>{character?.canon === true ? 'True' : 'False'}</td>
            <td>{character?.votes.length}</td>
            <td>{character?.origin}</td>
            <td><button onClick={() => viewCharacter(character)}><Eye className="hover:text-gray-200"/></button></td>
        </tr>
    )
}
export default CharacterTableDisplay;

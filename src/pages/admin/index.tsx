/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query } from "firebase/firestore";
import UserDisplay from "./UserDisplay";
import CharacterTableDisplay from "./CharacterTableDisplay";
import './Admin.scss';
import { Character } from "../../global_classes/Character";
import { UserInfo } from "../../global_classes/UserInfo";
import CharacterPopup from "../../components/shared/character-popup";
import BetaKeyDisplay from "./BetaKeyDisplay";
import { confirmModal } from "../../components/shared/confirm-modal";

const AdminPage = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [user, setUser] = useState();
    const [isAdmin, setIsAdmin] = useState(false);
    
    const navigate = useNavigate();
    
    const [characters, setCharacters] = useState<Character[]>([]);
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [profilePopupOpen, setProfilePopupOpen] = useState<boolean>(false);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

    const viewCharacter = (character: Character) => {
        setSelectedCharacter(character);
        setProfilePopupOpen(true);
    }

    const deactivatePopup = () => {
        setProfilePopupOpen(false);
        setSelectedCharacter(null);
    }

    return(
        <div className="w-full max-w-full gap-2 p-2 md:p-4 h-[90vh] md:grid md:grid-cols-2 overflow-y-auto">
            {loading && (<div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-base-300 rounded-box p-2 md:p-6">
                    <div className="flex flex-row justify-center items-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                        </div>
                    </div>
                </div>
            )}
            <CharacterPopup character={selectedCharacter} isOpen={profilePopupOpen} toggleModal={deactivatePopup} />
            <div className="col-span-1 row-span-3 bg-base-300 rounded-box p-2 md:p-6 max-h-[800px] min-h-[800px] max-w-full w-full flex flex-col">
                <h2 className="text-left font-extrabold">Character Management</h2>
                <div className="flex-grow overflow-x-auto overflow-y-auto max-w-full w-full flex flex-col max-h-full mt-4">
                    <table className="table-auto dy-table dy-table-zebra dy-table-pin-rows w-full h-full overflow-y-auto rounded-box bg-base-100">
                            <thead className="rounded-box">
                                <tr className="rounded-box">
                                    <th className="rounded-box">Name</th>
                                    <th className="rounded-box">Avatar</th>
                                    <th className="rounded-box">Submission Date</th>
                                    <th className="rounded-box">Creator</th>
                                    <th className="rounded-box">Status</th>
                                    <th className="rounded-box">Canon</th>
                                    <th className="rounded-box">Votes</th>
                                    <th className="rounded-box">Origin</th>
                                    <th className="rounded-box">View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {characters.map((character, index) => {
                                    return (
                                        <CharacterTableDisplay key={index} character={character} viewCharacter={viewCharacter} />
                                    );
                                })}
                            </tbody>
                        </table>
                </div>
            </div>
            <div className="col-span-1 row-span-3 bg-base-300 rounded-box p-2 md:p-6 max-h-[800px] min-h-[800px] flex flex-col">
                <h2 className="text-left font-extrabold">Userbase</h2>
                <div className="flex-grow overflow-x-auto overflow-y-auto max-h-full max-w-full h-full w-full">
                    {users.map((user, index) => {
                        return (
                            <UserDisplay key={index} uid={user.uid} />
                        )
                    })}
                </div>
            </div>
        </div>
    )
};
export default AdminPage;
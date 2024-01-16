/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import CharacterPopup from '../../components/shared/character-popup';
import { Character } from '../../global_classes/Character';
import CharacterComponent from '../../components/shared/character-component';
import { Info, MessageCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useCharacterUpdatedListener } from '../../helpers/events';
import { fetchAllCharacters } from '../../api/characterAPI';
import { Helmet } from 'react-helmet-async';

const CharactersPage = () => {
    const [profilePopupOpen, setProfilePopupOpen] = useState<boolean>(false);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [publicCharacters, setPublicCharacters] = useState<Character[]>([]);

    const [loading, setLoading] = useState<boolean>(false);

    const getMoreCharacters = async () => {
        setLoading(true);
        const newCharacters = await fetchAllCharacters().then((characters) => {
            return characters;
        });
        setPublicCharacters([...newCharacters]);
        setLoading(false);
    }

    useEffect(() => {
        getMoreCharacters();
    }, []);

    useCharacterUpdatedListener(() => {
        getMoreCharacters();
    });

    const activateProfilePopup = (character: Character) => {
        if(character === null) return;
        setSelectedCharacter(character);
        setProfilePopupOpen(true);
    }

    const deactivateProfilePopup = () => {
        setProfilePopupOpen(false);
    }

    return (
        <>
        <Helmet>
            <title>TalOS | Characters</title>
        </Helmet>
        <div className="w-full h-full flex-col md:min-h-[90vh]">
            {loading && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-base-300 rounded-box p-2 md:p-6">
                        <div className="flex flex-row justify-center items-center">
                            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                        </div>
                    </div>
                </div>
            )}
            <CharacterPopup character={selectedCharacter} isOpen={profilePopupOpen} toggleModal={deactivateProfilePopup}/>
            <div className="p-2 md:p-4 w-full h-full grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 grid-cols-1 gap-2 text-base-content">
                <div className="col-span-1 md:col-span-4 lg:col-span-5 xl:col-span-5 bg-base-300 rounded-box p-2">
                    <h1 className="text-4xl text-center font-bold text-primary">Characters</h1>
                    <p className="text-center text-base-content flex justify-center items-center gap-1">Click on the <Info size={18}/> to view their profile.</p>
                    <p className="text-center text-base-content flex justify-center items-center gap-1">Click on the <MessageCircle size={18}/> to chat.</p>
                </div>
                <div className="p-4 rounded-box bg-base-300 grid grid-cols-3 justify-between gap-2 max-h-[260px] h-[260px]">
                    <div className="flex flex-col gap-1 col-span-1">
                        <h3 className="character-name text-left text-ellipsis line-clamp-1">Unknown</h3>
                        <div className="rounded-md flex-grow justify-center items-center flex flex-col bg-base-100 h-[10rem]">
                            <svg className="relative w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                        </div>
                        <div className="grid grid-cols-2 justify-center mt-2 gap-1 items-center grid-">
                            <button className="dy-btn dy-btn-sm dy-btn-info dy-btn-outline" disabled><Info/></button>
                            <button className="dy-btn dy-btn-sm dy-btn-info dy-btn-outline" disabled><MessageCircle/></button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 max-w-full h-full py-4">
                        <NavLink className="dy-btn dy-btn-primary w-full h-full text-xl" to={`/characters/create`}>Create New Character</NavLink>
                    </div>
                </div>
                {Array.from(publicCharacters).map((character: Character, index: number) => {
                    return (
                        <CharacterComponent key={index} character={character} activateProfilePopup={activateProfilePopup}/>
                    )
                })}
            </div>
        </div>
        </>
    )
};

export default CharactersPage;
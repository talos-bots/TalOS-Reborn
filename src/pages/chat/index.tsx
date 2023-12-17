/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Auth } from "firebase/auth";
import { useEffect, useState } from "react";
import { Character } from "../../global_classes/Character";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight} from "lucide-react";
import ChatWindow from "./chat-window";
import UserPersonaWindow from "./user-persona";
import ChatSettings from "./chat-settings";
import ContactsBox from "./contacts-box";
import { StoredChatLog } from "../../global_classes/StoredChatLog";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { useWindowSize } from "../../helpers/character-card";
import CharacterPopup from "../../components/shared/character-popup";
import ChatLogs from './chat-logs';
import { useCloseSidesListener } from '../../helpers/events';
import { getCharacter } from '../../api/characterDB';
import { useUser } from '../../components/shared/auth-provider';
import { fetchCharacterById } from '../../api/characterAPI';
import { Helmet } from 'react-helmet-async';

const ChatPage = () => {
    const { user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if(!user?.id) navigate('/login?redirect=chat');
    }, [user, navigate]);
    
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [selectedChat, setSelectedChat] = useState<StoredChatLog | null>(null);
    const [showCharacterPopup, setShowCharacterPopup] = useState<boolean>(false);
    const [characterPopupCharacter, setCharacterPopupCharacter] = useState<Character | null>(null);
    const [theaterMode, setTheaterMode] = useState<boolean>(true);
    const [background, setBackground] = useState<string | null>(null);

    const location = useLocation();
    const [width] = useWindowSize();

    const isDesktop = width >= 1024;
    
    const queryParams = new URLSearchParams(location.search);
    const characterID = queryParams.get('characterID');

    // State variables to control drawer open/close
    const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
    const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

    // Handlers to toggle drawers
    const toggleLeftDrawer = () => setIsLeftDrawerOpen(!isLeftDrawerOpen);
    const toggleRightDrawer = () => setIsRightDrawerOpen(!isRightDrawerOpen);
    
    useEffect(() => {
        if(characterID === null) return;
        const retrieveCharacter = async () => {
            const character = await fetchCharacterById(characterID).then((character) => {
                return character;
            });
            if(!character) return;
            setSelectedCharacter(character)
        }
        retrieveCharacter();
    }, [characterID]);
    
    const handleCharacterSelect = (character: Character) => {
        setSelectedCharacter(character);
        setShowCharacterPopup(false);
        setIsLeftDrawerOpen(false);
    }

    const handleCharacterPopupToggle = (character?: Character) => {
        if(character) setCharacterPopupCharacter(character);
        setIsLeftDrawerOpen(false);
        setIsRightDrawerOpen(false);
        setShowCharacterPopup(!showCharacterPopup);
    }

    useCloseSidesListener(() => {
        setIsLeftDrawerOpen(false);
        setIsRightDrawerOpen(false);
    });
    
    return (
        <div className="grid grid-cols-12 w-full h-[92.5vh] max-h-[92.5vh] gap-2 md:p-4 text-base-content">
            <Helmet>
                <title>{"Talos | Chat " + (selectedCharacter ? '- ' + selectedCharacter.name : '')}</title>
                <meta name="title" content={"TalOS | Chat " + (selectedCharacter ? '- ' + selectedCharacter.name : '')}/>
                <meta name="description" content={selectedCharacter ? selectedCharacter.personality ?? selectedCharacter.description : 'Chat with your favorite characters!'}/>
                <meta property="og:type" content="website"/>
                <meta property="og:url" content={window.location.href}/>
                <meta property="og:title" content={"TalOS | Chat " + (selectedCharacter ? '- ' + selectedCharacter.name : '')}/>
                <meta property="og:description" content={selectedCharacter ? selectedCharacter.personality ?? selectedCharacter.description : 'Chat with your favorite characters!'}/>
                <meta property="twitter:card" content={selectedCharacter?.avatar}/>
                <meta property="twitter:url" content={window.location.href}/>
                <meta property="twitter:title" content={"TalOS | Chat " + (selectedCharacter ? '- ' + selectedCharacter.name : '')}/>
                <meta property="twitter:description" content={selectedCharacter ? selectedCharacter.personality ?? selectedCharacter.description : 'Chat with your favorite characters!'}/>
            </Helmet>
            <CharacterPopup isOpen={showCharacterPopup} toggleModal={handleCharacterPopupToggle} character={characterPopupCharacter}/>
            <>
            {isDesktop ? (
                <>
                    <div className="col-span-3 md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 p-2 max-h-[90vh]">
                        <h3 className="font-bold justify-between flex flex-row">
                            Contacts
                            {/* <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div> */}
                        </h3>
                        <ContactsBox character={selectedCharacter} setCharacter={handleCharacterSelect} showCharacterPopup={handleCharacterPopupToggle}/>
                        <h3 className="font-bold justify-between flex flex-row">
                            You
                            {/* <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div> */}
                        </h3>
                        <UserPersonaWindow persona={null} setPersona={() => {}}/>
                    </div>
                </>
            ) : (
                <SwipeableDrawer
                    anchor="left"
                    open={isLeftDrawerOpen}
                    onClose={toggleLeftDrawer}
                    onOpen={toggleLeftDrawer}
                    variant="temporary"
                    transitionDuration={250}
                    className="bg-transparent"
                >
                    <div className="col-span-3 md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 p-2">
                        <h3 className="font-bold justify-between flex flex-row">
                            Contacts
                            {/* <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div> */}
                        </h3>
                        <ContactsBox character={selectedCharacter} setCharacter={handleCharacterSelect} showCharacterPopup={handleCharacterPopupToggle}/>
                        <h3 className="font-bold justify-between flex flex-row">
                            You
                            {/* <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div> */}
                        </h3>
                        <UserPersonaWindow persona={null} setPersona={() => {}}/>
                        <button className="dy-btn dy-btn-error dy-btn-outline dy-btn-sm md:hidden" onClick={toggleLeftDrawer}>
                            <ArrowRight/>
                        </button>
                    </div>
                </SwipeableDrawer>
            )}
            </>
            <ChatWindow theaterMode={theaterMode} setTheaterMode={setTheaterMode}character={selectedCharacter} persona={null} theme={null} toggleLeftDrawer={toggleLeftDrawer} toggleRightDrawer={toggleRightDrawer} showCharacterPopup={handleCharacterPopupToggle} background={background} setBackground={setBackground}/>
            {isDesktop ? (
                <div className="col-span-2 shadow-xl md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 text-right p-2 max-h-[90vh]">
                    <h3 className="font-bold text-right flex flex-row-reverse justify-between">
                        Chat Settings
                        {/* <div className="flex gap-1">
                            <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                <ArrowLeft/>
                            </button>
                            <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                <ArrowRight/>
                            </button>
                        </div> */}
                    </h3>
                    <ChatSettings theme={null} setTheme={() => {}} background={background} setBackground={setBackground}/>
                    <h3 className="font-bold text-right flex flex-row-reverse justify-between">
                        Chats
                        {/* <div className="flex gap-1">
                            <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                <ArrowLeft/>
                            </button>
                            <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                <ArrowRight/>
                            </button>
                        </div> */}
                    </h3>
                    <div className="flex flex-col gap-2 rounded-box bg-base-100 h-full">
                        <ChatLogs character={selectedCharacter} showCharacterPopup={handleCharacterPopupToggle}/>
                    </div>
                </div>
            ) : (
                <SwipeableDrawer
                    anchor="right"
                    open={isRightDrawerOpen}
                    onClose={toggleRightDrawer}
                    onOpen={toggleRightDrawer}
                    variant="temporary"
                    transitionDuration={250}
                    className="bg-transparent"
                >
                    <div className="col-span-2 shadow-xl bg-base-300 md:p-4 h-full flex flex-col gap-2 text-right p-2">
                        <h3 className="font-bold text-right flex flex-row-reverse justify-between">
                            Chat Settings
                            {/* <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div> */}
                        </h3>
                        <ChatSettings theme={null} setTheme={() => {}} background={background} setBackground={setBackground}/>
                        <h3 className="font-bold text-right flex flex-row-reverse justify-between">
                            Chats
                            {/* <div className="flex gap-1">
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowLeft/>
                                </button>
                                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm">
                                    <ArrowRight/>
                                </button>
                            </div> */}
                        </h3>
                        <div className="flex flex-col gap-2 rounded-box bg-base-100 h-full">
                            <ChatLogs character={selectedCharacter} showCharacterPopup={handleCharacterPopupToggle}/>
                        </div>
                        <button className="dy-btn dy-btn-error dy-btn-outline dy-btn-sm md:hidden" onClick={toggleRightDrawer}>
                            <ArrowLeft/>
                        </button>
                    </div>
                </SwipeableDrawer>
            )}
        </div>
    )
}
export default ChatPage;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Auth } from "firebase/auth";
import { Character } from "../../../global_classes/Character";
import ContactItem from "./contact-item";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { emitCloseSides } from '../../../helpers/events';

interface ContactsBoxProps {
    character: Character | null;
    setCharacter: (character: Character) => void;
    showCharacterPopup: (character?: Character) => void;
}

const ContactsBox = (props: ContactsBoxProps) => {
    const { character, setCharacter } = props;
    const [contacts, setContacts] = useState<Character[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    
    const navigate = useNavigate();
    const location = useLocation();
  
    // Function to change the chatID
    const changeCharacterID = (characterID: string) => {
      // Create a new URLSearchParams object based on the current query string
      const queryParams = new URLSearchParams(location.search);
  
      // Set the new chatID
      queryParams.set('characterID', characterID);
  
      // Replace the current entry in the history stack
      navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
    };
    
    const handleCharacterClick = (character: Character) => {
        setCharacter(character);
        changeCharacterID(character._id);
        emitCloseSides();
    }

    return (
        <div className="rounded-box bg-base-100 h-full w-full p-2 flex gap-2 flex-col overflow-y-scroll">
            {contacts.map((contact) => {
                return (
                    <ContactItem
                        key={contact._id}
                        character={contact}
                        setCharacter={handleCharacterClick}
                        showCharacterPopup={props.showCharacterPopup}
                    />
                )
            })}
            {loading &&
                <div className="rounded-box bg-base-200 h-[6rem] w-full animate-pulse self-center flex-row flex items-center p-6">
                    <h2 className="text-lg font-bold">Loading...</h2>
                </div>
            }
        </div>
    )
}
export default ContactsBox;
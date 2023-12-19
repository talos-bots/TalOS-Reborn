/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Character } from "../../../../global_classes/Character";
import { Check, Info } from "lucide-react";

interface ContactItemProps {
    character: Character | null;
    setCharacter: (character: Character) => void;
    showCharacterPopup: (character?: Character) => void;
}

const ContactItem = (props: ContactItemProps) => {
    const { character, setCharacter } = props;

    const handleCharacterClick = () => {
        if(character === null) return;
        setCharacter(character);
    }
    
    const handleCharacterInfoClick = () => {
        if(character === null) return;
        props.showCharacterPopup(character);
    }

    return (
        <div className="rounded-box bg-base-200 h-[6rem] flex flex-row p-4 w-full">
            <div className="flex flex-row w-full items-center justify-between gap-2">
                <div className="flex flex-row w-full items-center gap-2">
                    <img src={character?.avatar} className="avatar min-w-14 min-h-[3.5rem] max-h-14 max-w-[3.5rem] object-top object-cover" onClick={handleCharacterInfoClick} onTouchStart={
                        (e) => {
                            e.preventDefault();
                            e.currentTarget.click();
                        }
                    }/>
                    <div className="flex flex-col w-full">
                        <p className="text-lg font-bold">{character?.name}</p>
                        <p className="dy-textarea w-full dy-textarea-bordered dy-textarea-xs line-clamp-2 overflow-y-auto">
                            {character?.description.length > 1 ? character?.description : character?.personality}
                        </p>
                    </div>
                </div>
                <div className="flex flex-row items-center gap-2">
                    <button onClick={(e)=>{handleCharacterClick()}}className="dy-btn h-full dy-btn-accent">
                        <Check/>
                    </button>
                </div>
            </div>
        </div>
    )
}
export default ContactItem;
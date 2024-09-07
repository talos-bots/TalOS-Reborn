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
    if (character === null) return;
    setCharacter(character);
  }

  const handleCharacterInfoClick = () => {
    if (character === null) return;
    props.showCharacterPopup(character);
  }

  return (
    <div className="rounded-box bg-base-200 h-[6rem] flex flex-row p-2 w-full">
      <div className="flex flex-row w-full items-center justify-between gap-2">
        <div className="flex flex-row w-full items-center gap-2">
          <img src={character?.avatar} className="avatar h-10 w-10 shrink-0 grow-0 object-top object-cover" onClick={handleCharacterInfoClick} onTouchStart={
            (e) => {
              e.preventDefault();
              e.currentTarget.click();
            }
          } />
          <h3 className="text-lg font-bold">{character?.name}</h3>
        </div>
        <div className="flex flex-row items-center gap-2">
          <button onClick={(e) => { handleCharacterClick() }} className="dy-btn dy-btn-xs h-full dy-btn-accent">
            <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
export default ContactItem;
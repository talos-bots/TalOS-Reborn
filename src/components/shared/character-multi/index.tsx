import React, { useEffect, useState } from 'react';
import { Character } from '../../../global_classes/Character';
import e from 'express';

interface CharacterMultiSelectProps {
  characters: Character[];
  selectedCharacters: string[];
  setSelectedCharacters: (characters: string[]) => void;
}

const CharacterMultiSelect = ({ characters, selectedCharacters, setSelectedCharacters }: CharacterMultiSelectProps) => {
  const [selectedCharacterObjects, setSelectedCharacterObjects] = useState<Character[]>([]);

  useEffect(() => {
    const newSelectedCharacterObjects: Character[] = [];
    for (let i = 0; i < characters.length; i++) {
      if (selectedCharacters.includes(characters[i]._id)) {
        newSelectedCharacterObjects.push(characters[i]);
      }
    }
    setSelectedCharacterObjects(newSelectedCharacterObjects);
  }, [selectedCharacters]);

  const handleSelectCharacter = (character: Character) => {
    if (!selectedCharacters.includes(character._id)) {
      setSelectedCharacters([...selectedCharacters, character._id]);
    } else {
      setSelectedCharacters(selectedCharacters.filter(c => c !== character._id));
    }
  };

  const handleClearCharacters = () => {
    setSelectedCharacters([]);
  }

  const removeCharacter = (character: Character) => {
    setSelectedCharacters(selectedCharacters.filter(c => c !== character._id));
  }

  return (
    <div className='dy-dropdown'>
      {/* Value box displaying selected characters */}
      <div tabIndex={0} className='w-full dy-select-bordered dy-select flex flex-row items-center' role='button'>
        {selectedCharacterObjects.map(character => (
          <span key={character._id} className='dy-badge dy-badge-outline dy-badge-secondary dy-badge-lg flex flex-row gap-1'>
            {character.name}
            <button onClick={() => removeCharacter(character)}>
              X
            </button>
          </span>
        ))}
        {selectedCharacters.length === 0 && <span className='dy-badge dy-badge-outline dy-badge-lg'>No characters selected</span>}
      </div>

      {/* Dropdown for character selection */}
      <ul tabIndex={0} className="dy-dropdown-content z-[1] dy-menu shadow w-full p-2 dy-textarea dy-textarea-bordered">
        {characters.map((character) => (
          <div key={character._id} className={'flex flex-row dy-btn dy-btn-outline ' + (selectedCharacters.includes(character._id) ? 'dy-btn-secondary' : '')} onClick={() => handleSelectCharacter(character)}>
            <img src={character.avatar} alt={character.name} className='rounded-full w-8 h-8' />
            <p>{character.name}</p>
          </div>
        ))}
      </ul>
    </div>
  );
};

export default CharacterMultiSelect;
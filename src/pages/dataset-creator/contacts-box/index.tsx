import React from 'react';
import { Character } from "../../../global_classes/Character";
import ContactItem from "./contact-item";
import { useEffect, useState } from "react";
import { fetchAllCharacters, fetchCharacterById } from '../../../api/characterAPI';
import { useDataset } from '../../../components/dataset/DatasetProvider';
import CharacterMultiSelect from '../../../components/shared/character-multi';
import { CharacterMap } from '../../../types';
import { Dataset } from '../../../global_classes/Dataset';
import { saveDataset } from '../../../api/datasetAPI';

const ContactsBox = () => {
    const [contacts, setContacts] = useState<Character[]>([]);
    const [selectedCharacters, setSelectedCharacters] = useState<CharacterMap[]>([]);
    const [characterIds, setCharacterIds] = useState<string[]>([]);
    const { dataset, setDataset } = useDataset();
    const [loading, setLoading] = useState<boolean>(true);

    const handleAddCharacter = ( characterId: string ) => {
        if(characterId === null) return console.log('Character is null')
        const character = contacts.find((char) => char._id === characterId)
        if(!character) return console.log('Character is undefined')
        if(dataset === null) return console.log('Dataset is null')
        const newCharacterMap: CharacterMap = {
            characterId: character._id,
            connectionId: null,
            model: null,
            settingsId: null,
            role: 'Assistant'
        }
        const newCharacters = dataset.characters.filter((char) => char.characterId !== character._id)
        newCharacters.push(newCharacterMap)
        setCharacterIds(newCharacters.map((char) => char.characterId))
        updateDataset({characters: newCharacters})
    }

    const handleRemoveCharacter = ( characterId: string ) => {
        if(dataset === null) return console.log('Dataset is null')
        const newCharacters = dataset.characters.filter((char) => char.characterId !== characterId)
        setCharacterIds(newCharacters.map((char) => char.characterId))
        updateDataset({characters: newCharacters})
    }

    const updateDataset = (updatedValues: Partial<Dataset>) => {
        if (dataset) {
            console.log('Updating dataset')
            const newDataset = new Dataset(
                updatedValues.id ?? dataset.id,
                updatedValues.name ?? dataset.name,
                updatedValues.description ?? dataset.description,
                updatedValues.messages ?? dataset.messages,
                updatedValues.badWords ?? dataset.badWords,
                updatedValues.characters ?? dataset.characters,
                updatedValues.systemPrompts ?? dataset.systemPrompts,
                updatedValues.retries ?? dataset.retries,
                updatedValues.badWordsGenerated ?? dataset.badWordsGenerated
            );
            setDataset(newDataset);
            saveDataset(newDataset); // Save the updated dataset
            return newDataset
        }
        console.log('fail Updated dataset')
    };

    useEffect(() => {
        const getContacts = async () => {
            const newCharacters = await fetchAllCharacters().then((characters) => {
                return characters;
            });
            setContacts(newCharacters);
            setLoading(false);
        }
        getContacts();
    }, []);

    useEffect(() => {
        if(dataset === null) return;
        const oldIds = dataset.characters.map((char) => char.characterId);
        for (const id of characterIds) {
            if (!oldIds.includes(id)) {
                handleAddCharacter(id);
            } else {
                console.log('Character already exists in dataset')
            }
        }
        // find characters that are in the old dataset but not in the new one
        const removedCharacters = oldIds.filter((id) => !characterIds.includes(id));
        for (const id of removedCharacters) {
            handleRemoveCharacter(id);
        }
    }, [characterIds]);

    useEffect(() => {
        if(dataset === null) return;
        const newCharacters = dataset.characters.filter((char) => char.characterId !== null)
        setCharacterIds(newCharacters.map((char) => char.characterId))
    }, [dataset]);

    return (
        <div className="rounded-box bg-base-100 h-full w-full p-2 flex gap-2 flex-col overflow-y-scroll">
            <CharacterMultiSelect characters={contacts} selectedCharacters={characterIds} setSelectedCharacters={setCharacterIds}/>
            {Array.isArray(dataset.characters) && dataset.characters.map((contact, index) => {
                return (
                    <ContactItem
                        key={index}
                        characterMap={contact}
                        handleRemoveCharacter={handleRemoveCharacter}
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
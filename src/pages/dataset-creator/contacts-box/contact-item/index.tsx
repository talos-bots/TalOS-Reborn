/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Character } from "../../../../global_classes/Character";
import { Minus, Plus } from "lucide-react";
import { CharacterMap, GenericCompletionConnectionTemplate, Role, SettingsInterface } from '../../../../types';
import { fetchAllSettings, fetchDefaultSettings } from '../../../../api/settingsAPI';
import { fetchAllConnections, fetchConnectionModels, fetchMancerModels, fetchOpenAIModels, fetchPalmModels } from '../../../../api/connectionAPI';
import { useDataset } from '../../../../components/dataset/DatasetProvider';
import { Dataset } from '../../../../global_classes/Dataset';
import { saveDataset } from '../../../../api/datasetAPI';

interface ContactItemProps {
    character: Character | null;
}

const ContactItem = (props: ContactItemProps) => {
    const { character } = props;
    const { dataset, setDataset, updateName, updateDescription, updateMessages, updateBadWords, updateCharacters, updateSystemPrompts, updateRetries, updateBadWordsGenerated, updateId } = useDataset();
    const [currentPreset, setCurrentPreset] = useState<SettingsInterface | null>(null);
    const [savedConnections, setSavedConnections] = useState<GenericCompletionConnectionTemplate[]>([] as GenericCompletionConnectionTemplate[]);
    const [currentConnection, setCurrentConnection] = useState<GenericCompletionConnectionTemplate | null>(null);
    const [connectionModelList, setConnectionModelList] = useState<string[]>([] as string[])
    const [connectionModel, setConnectionModel] = useState<string>('')
    const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected')
    const [availablePresets, setAvailablePresets] = useState<SettingsInterface[]>([] as SettingsInterface[]);
    const [defaultPresets, setDefaultPresets] = useState<SettingsInterface[]>([] as SettingsInterface[]);
    const [role, setRole] = useState<Role>('Assistant')
    const roles: Role[] = ['Assistant', 'System', 'User']

    const handleLoadConnections = () => {
        fetchAllConnections().then((connections) => {
            setSavedConnections(connections)
            setCurrentConnection(connections[0])
            
        })
    }

    const handleLoadSettings = () => {
        fetchAllSettings().then((connections) => {
            setAvailablePresets(connections)
        })
        fetchDefaultSettings().then((connections) => {
            setDefaultPresets(connections)
        })
    }

    useEffect(() => {
        handleLoadSettings()
        handleLoadConnections()
    }, [])

    useEffect(() => {
        if(dataset === null) return
        if(character === null) return console.log('Character is null')
        const characterMap = dataset.characters.find((char) => char.characterId === character._id);
        console.log(characterMap)
        setConnectionModel(characterMap?.model ?? '')
        setRole(characterMap?.role ?? 'Assistant')
        setCurrentPreset(availablePresets.find((preset) => preset.id === characterMap?.settingsId) ?? null)
        setCurrentConnection(savedConnections.find((connection) => connection.id === characterMap?.connectionId) ?? null)
    }, [dataset, character, availablePresets, savedConnections])

    const handlePresetChange = (e: any) => {
        const preset = availablePresets.find((preset) => preset.id === e.target.value)
        if(preset === undefined) return
        setCurrentPreset(preset)
    }

    const handleConnectionChange = (e: any) => {
        const connection = savedConnections.find((connection) => connection.id === e.target.value)
        if(connection === undefined) return
        setCurrentConnection(connection)
    }

    const handleModelChange = (e: any) => {
        setConnectionModel(e.target.value)
    }

    const handleTestConnection = () => {
        if(currentConnection.type === 'Mancer'){
            setConnectionStatus('Connecting...')
            fetchMancerModels(currentConnection.key).then((models) => {
                if(models === null) return setConnectionStatus('Connection Failed')
                setConnectionStatus('Connection Successful!')
                setConnectionModelList(models)
            }).catch((error) => {
                setConnectionStatus('Connection Failed')
            })
        }else if (currentConnection.type === 'PaLM'){
            setConnectionStatus('Connecting...')
            fetchPalmModels(currentConnection.key).then((models) => {
                if(models === null) return setConnectionStatus('Connection Failed')
                setConnectionStatus('Connection Successful!')
                setConnectionModelList(models)
            }).catch((error) => {
                setConnectionStatus('Connection Failed')
            })
        }else if(currentConnection.type === 'OAI'){
            setConnectionStatus('Connecting...')
            fetchOpenAIModels(currentConnection.key).then((models) => {
                if(models === null) return setConnectionStatus('Connection Failed')
                setConnectionStatus('Connection Successful!')
                setConnectionModelList(models)
            }).catch((error) => {
                setConnectionStatus('Connection Failed')
            })
        
        }else {
            setConnectionStatus('Connecting...')
            fetchConnectionModels(currentConnection.url).then((models) => {
                if(models === null) return setConnectionStatus('Connection Failed')
                setConnectionStatus('Connection Successful!')
                setConnectionModelList(models)
            }).catch((error) => {
                setConnectionStatus('Connection Failed')
            })
        }
    }

    const isCharacterSelected = () => {
        if(character === null) return false
        return dataset?.characters.find((char) => char.characterId === character._id) !== undefined
    }

    const handleAddCharacter = () => {
        if(character === null) return console.log('Character is null')
        if(dataset === null) return console.log('Dataset is null')
        const newCharacterMap: CharacterMap = {
            characterId: character._id,
            connectionId: currentConnection?.id,
            model: connectionModel,
            settingsId: currentPreset?.id,
            role: role
        }
        const newCharacters = dataset.characters.filter((char) => char.characterId !== character._id)
        newCharacters.push(newCharacterMap)
        updateCharacters(newCharacters)
        updateDataset({characters: newCharacters})
    }

    const handleUpdateCharacter = () => {
        if(character === null) return console.log('Character is null')
        if(dataset === null) return console.log('Dataset is null')
        const newCharacterMap: CharacterMap = {
            characterId: character._id,
            connectionId: currentConnection?.id,
            model: connectionModel ?? '',
            settingsId: currentPreset?.id ?? '',
            role: role
        }
        const newCharacters = dataset.characters.filter((char) => char.characterId !== character._id)
        newCharacters.push(newCharacterMap)
        updateCharacters(newCharacters)
        updateDataset({ characters: newCharacters })
    }

    const handleRemoveCharacter = () => {
        if(character === null) return console.log('Character is null')
        if(dataset === null) return console.log('Dataset is null')
        const newCharacters = dataset.characters.filter((char) => char.characterId !== character._id)
        updateCharacters(newCharacters)
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
        if(currentConnection === null) return
        handleTestConnection()
    }, [currentConnection])

    return (
        <div className="rounded-box bg-base-200 min-h-[300px] max-h-[300px] p-4 w-full grid gird-rows-3 gap-2 overflow-y-auto">
            <div className="flex flex-row w-full items-center justify-between gap-2 row-span-1">
                <div className="flex flex-row w-full items-center gap-2">
                    <img src={character?.avatar} className="avatar min-w-14 min-h-[3.5rem] max-h-14 max-w-[3.5rem] object-top object-cover"/>
                    <div className="flex flex-col w-full">
                        <p className="text-lg font-bold">{character?.name}</p>
                        <p className="dy-textarea w-full dy-textarea-bordered dy-textarea-xs line-clamp-2 overflow-y-auto">
                            {character?.description.length > 1 ? character?.description : character?.personality}
                        </p>
                    </div>
                </div>
                <div className="flex flex-row items-center gap-2">
                    <button onClick={(e)=>{handleAddCharacter()}}className={"dy-btn h-full dy-btn-accent " + (!isCharacterSelected() ? '' : 'hidden')}>
                        <Plus/>
                    </button>
                    <button onClick={(e)=>{handleRemoveCharacter()}}className={"dy-btn h-full dy-btn-error " + (isCharacterSelected() ? '' : 'hidden')}>
                        <Minus/>
                    </button>
                </div>
            </div>
            <div className="flex flex-row w-full items-center gap-2 row-span-1">
                <div className="flex flex-col w-full">
                    <p className="text-lg font-bold">Connection</p>
                    <div className="flex flex-row w-full items-center gap-2">
                        <select onChange={handleConnectionChange} className="dy-select dy-select-bordered w-full">
                            {savedConnections.map((connection) => {
                                return (
                                    <option value={connection.id}>{connection.name}</option>
                                )
                            })}
                        </select>
                    </div>
                </div>
                <div className="flex flex-col w-full">
                    <p className="text-lg font-bold">Model</p>
                    <div className="flex flex-row w-full items-center gap-2">
                        <select onChange={handleModelChange} className="dy-select dy-select-bordered w-full">
                            {connectionModelList.map((model) => {
                                return (
                                    <option value={model}>{model}</option>
                                )
                            })}
                        </select>
                    </div>
                </div>
            </div>
            <div className="flex flex-row w-full items-center gap-2 row-span-1">
                <div className="flex flex-col w-full">
                    <p className="text-lg font-bold">Settings</p>
                    <div className="flex flex-row w-full items-center gap-2">
                        <select onChange={handlePresetChange} className="dy-select dy-select-bordered w-full">
                            {availablePresets.concat(defaultPresets).map((preset) => {
                                return (
                                    <option value={preset.id}>{preset.name}</option>
                                )
                            })}
                        </select>
                    </div>
                </div>
                <div className="flex flex-col w-full">
                    <p className="text-lg font-bold">Status</p>
                    <div className="flex flex-row w-full items-center gap-2">
                        <p className='dy-textarea w-full dy-textarea-bordered'>{connectionStatus}</p>
                        <button onClick={handleTestConnection} className="dy-btn dy-btn-primary">Test</button>
                    </div>
                </div>
            </div>
            <div className="flex flex-row w-full items-center gap-2 row-span-1">
                <div className="flex flex-col w-full">
                    <p className="text-lg font-bold">Settings</p>
                    <div className="flex flex-row w-full items-center gap-2">
                        <select onChange={(e)=> setRole(e.target.value as Role)} className="dy-select dy-select-bordered w-full" >
                            {roles.map((preset) => {
                                return (
                                    <option value={preset}>{preset}</option>
                                )
                            })}
                        </select>
                    </div>
                </div>
                <div className={"flex flex-col w-full" + (isCharacterSelected() ? '' : 'hidden')}>
                    <p className="text-lg font-bold">Actions</p>
                    <div className="flex flex-row w-full items-center gap-2">
                        <button onClick={()=> handleUpdateCharacter()} className="dy-btn dy-btn-primary">Update</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default ContactItem;
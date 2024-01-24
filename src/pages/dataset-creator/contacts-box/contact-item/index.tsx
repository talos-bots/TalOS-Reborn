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
import { fetchCharacterById } from '../../../../api/characterAPI';

interface ContactItemProps {
    characterMap: CharacterMap | null;
    handleRemoveCharacter: (character: string) => void;
}

const ContactItem = (props: ContactItemProps) => {
    const { characterMap, handleRemoveCharacter } = props;
    const [character, setCurrentCharacter] = useState<Character | null>();
    const { dataset, setDataset, updateName, updateDescription, updateMessages, updateBadWords, updateCharacters, updateSystemPrompts, updateRetries, updateBadWordsGenerated, updateId } = useDataset();
    const [currentPresetId, setCurrentPresetId] = useState<string | null>(characterMap?.settingsId ?? null);
    const [currentConnectionId, setCurrentConnectionId] = useState<string | null>(characterMap?.connectionId ?? null);
    const [currentPreset, setCurrentPreset] = useState<SettingsInterface | null>(null);
    const [savedConnections, setSavedConnections] = useState<GenericCompletionConnectionTemplate[]>([] as GenericCompletionConnectionTemplate[]);
    const [currentConnection, setCurrentConnection] = useState<GenericCompletionConnectionTemplate | null>(null);
    const [connectionModelList, setConnectionModelList] = useState<string[]>([] as string[])
    const [connectionModel, setConnectionModel] = useState<string>(characterMap?.model ?? '')
    const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected')
    const [availablePresets, setAvailablePresets] = useState<SettingsInterface[]>([] as SettingsInterface[]);
    const [defaultPresets, setDefaultPresets] = useState<SettingsInterface[]>([] as SettingsInterface[]);
    const [role, setRole] = useState<Role>(characterMap?.role ?? 'Assistant')
    const roles: Role[] = ['Assistant', 'System', 'User']

    const init = async () => {
        if(characterMap === null) return console.log('CharacterMap is null')
        await fetchCharacterById(characterMap?.characterId ?? '').then((character) => {
            if(character === null) return
            setCurrentCharacter(character)
        });
        if(character === null) return console.log('Character is null')
        await handleLoadSettings();
        await handleLoadConnections();
        setCurrentConnectionId(characterMap.connectionId)
        setCurrentPresetId(characterMap.settingsId)
        setConnectionModel(characterMap.model)
        setRole(characterMap.role)
    }

    useEffect(() => {
        init()
    }, [characterMap])

    const handleLoadConnections = async () => {
        await fetchAllConnections().then((connections) => {
            setSavedConnections(connections)
            setCurrentConnection(connections[0])
            
        })
    }

    const handleLoadSettings = async () => {
        await fetchAllSettings().then((connections) => {
            setAvailablePresets(connections)
        })
        await fetchDefaultSettings().then((connections) => {
            setDefaultPresets(connections)
        })
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

    useEffect(() => {
        if(currentPresetId === null) return
        const preset = availablePresets.find((preset) => preset.id === currentPresetId)
        if(preset === undefined) return
        setCurrentPreset(preset)
    }, [currentPresetId])

    useEffect(() => {
        handleConnectionChange({target: {value: currentConnectionId}})
    }, [currentConnectionId])

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
                    <button onClick={()=>{handleRemoveCharacter(character?._id)}} className={"dy-btn h-full dy-btn-error "}>
                        <Minus/>
                    </button>
                </div>
            </div>
            <div className="flex flex-row w-full items-center gap-2 row-span-1">
                <div className="flex flex-col w-full">
                    <p className="text-lg font-bold">Connection</p>
                    <div className="flex flex-row w-full items-center gap-2">
                        <select onChange={(e)=>{setCurrentConnectionId(e.target.value)}} className="dy-select dy-select-bordered w-full" value={currentConnectionId}>
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
                        <select onChange={handleModelChange} className="dy-select dy-select-bordered w-full" value={connectionModel}>
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
                        <select onChange={(e)=>{setCurrentPresetId(e.target.value)}} className="dy-select dy-select-bordered w-full" value={currentPresetId}>
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
                        <select onChange={(e)=> setRole(e.target.value as Role)} className="dy-select dy-select-bordered w-full" value={role}>
                            {roles.map((preset) => {
                                return (
                                    <option value={preset}>{preset}</option>
                                )
                            })}
                        </select>
                    </div>
                </div>
                <div className={"flex flex-col w-full"}>
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
import React, { useEffect, useState } from 'react';
import { DiffusionCompletionConnectionTemplate, DiffusionType, dalleModels } from '../../types';
import { deleteDiffusionConnectionById, fetchAllDiffusionConnections, getSDXLModels, saveDiffusionConnectionToLocal, testDallekey, testNovelAIKey } from '../../api/diffusionAPI';
import { getAppSettingsDiffusionConnection, setAppSettingsDiffusion } from '../../api/settingsAPI';
import RequiredInputField, { RequiredSelectField } from '../../components/shared/required-input-field';

function getForwardFacingName(type: DiffusionType): string {
    switch (type) {
        case 'Dalle':
            return 'OpenAI\'s DALLE';
        case 'Auto1111':
            return 'Automatic1111\'s SDWebUI';
        case 'SDAPI':
            return '"The Stable Diffusion API" Service"';
        case 'NovelAI':
            return 'NovelAI\'s Service';
        default:
            return type;
    }
}

const DiffusionPanel = () => {
    const connectionTypes: DiffusionType[] = ['Dalle', 'Auto1111', 'NovelAI']
    const [savedConnections, setSavedConnections] = useState<DiffusionCompletionConnectionTemplate[]>([])
    const [connectionType, setConnectionType] = useState<DiffusionType>(connectionTypes[0] as DiffusionType)
    const [connectionID, setConnectionID] = useState<string>('' as string)
    const [connectionPassword, setConnectionPassword] = useState<string>('' as string)
    const [connectionURL, setConnectionURL] = useState<string>('' as string)
    const [connectionName, setConnectionName] = useState<string>('' as string)
    const [connectionModel, setConnectionModel] = useState<string>('' as string)
    const [connectionStatus, setConnectionStatus] = useState<string>('Untested' as string)
    const [connectionModelList, setConnectionModelList] = useState<string[]>([] as string[])

    const [urlValid, setURLValid] = useState<boolean>(false)

    const handleLoadConnections = () => {
        fetchAllDiffusionConnections().then((connections) => {
            setSavedConnections(connections)
        })
    }

    const handleLoadConnection = (id:string) => {
        const connection = savedConnections.find((connection) => connection.id === id)
        if (connection){
            console.log(connection)
            setConnectionType(connection.type)
            setConnectionPassword(connection.key)
            setConnectionURL(connection.url)
            setConnectionName(connection.name)
            setConnectionModel(connection.model)
        }

    }

    useEffect(() => {
        handleLoadConnections()
    }, [])

    const handleSaveConnection = () => {
        let newID = connectionID
        if (newID === ''){
            newID = new Date().getTime().toString()
        }
        const newConnection: DiffusionCompletionConnectionTemplate = {
            id: newID,
            key: connectionPassword,
            url: connectionURL,
            name: connectionName,
            model: connectionModel,
            type: connectionType
        } as DiffusionCompletionConnectionTemplate
        setConnectionID(newID)
        if (savedConnections.some((connection) => connection.id === connectionID)) {
            const index = savedConnections.findIndex((connection) => connection.id === connectionID)
            savedConnections[index] = newConnection
        }else{
            setSavedConnections([...savedConnections, newConnection])
        }
        saveDiffusionConnectionToLocal(newConnection)
        handleLoadConnections()
    }

    const handleDeleteConnection = () => {
        const index = savedConnections.findIndex((connection) => connection.id === connectionID)
        savedConnections.splice(index, 1)
        setSavedConnections([...savedConnections])
        deleteDiffusionConnectionById(connectionID)
    }

    const handleValidateURL = () => {
        //check if a url is a valid url
        try {
            const newURL = new URL(connectionURL);
            setURLValid(true)
            setConnectionURL(newURL.toString())
        } catch (_) {
            setURLValid(false)
        }
    }

    const setDefaultConnection = async () => {
        await setAppSettingsDiffusion(connectionID)
    }

    useEffect(() => {
        if(connectionType == 'Dalle'){
            setConnectionModelList(dalleModels)
        } else if(connectionType == 'Auto1111'){
            setConnectionModelList([])
        } else if(connectionType == 'NovelAI'){
            setConnectionModelList(['nai-diffusion', 'safe-diffusion', 'nai-diffusion-furry', 'kandinsky-vanilla', 'nai-diffusion-2', 'nai-diffusion-3'])
        } else {
            setConnectionModelList([])
        }
    }, [connectionType])
    
    const handleTestConnection = () => {
        const currentConnection = savedConnections.find((connection) => connection.id === connectionID)
        if (!currentConnection){
            setConnectionStatus('Failed')
            return
        }
        switch (connectionType) {
            case 'Dalle':
                if (!currentConnection.key){
                    setConnectionStatus('Failed')
                    return
                }
                testDallekey(currentConnection.key).then((response) => {
                    if(Array.isArray(response)){
                        setConnectionStatus('Connected')
                    }else{
                        setConnectionStatus('Failed')
                    }
                })
                break;
            case 'NovelAI':
                if (!currentConnection.key){
                    setConnectionStatus('Failed')
                    return
                }
                testNovelAIKey(currentConnection.key).then((response) => {
                    if (response){
                        setConnectionStatus('Connected')
                    } else {
                        setConnectionStatus('Failed')
                    }
                })
                break;
            case 'Auto1111':
                if(currentConnection.url){
                    getSDXLModels(currentConnection.url, currentConnection.key).then((response) => {
                        if(response){
                            setConnectionModelList(response.map((model: any) => model.model_name))
                            setConnectionStatus('Connected')
                        }else{
                            setConnectionStatus('Failed')
                        }
                    })
                } else {
                    setConnectionStatus('Failed')
                }
                break;
            default:
                break;
        }
    }

    return (
        <div className="text-base-content flex flex-col gap-2">
            <div className="flex flex-row gap-2 w-full items-end justify-center">
                <RequiredSelectField
                    label="Profile"
                    value={connectionID}
                    onChange={(e)=> {setConnectionID(e.target.value); handleLoadConnection(e.target.value);}}
                    required={false}
                    className={'w-full'}
                >
                    <option value={''}>New Diffusion Connection</option>
                    {savedConnections.map((connectionOption, index) => (
                        <option key={index} value={connectionOption.id}>{connectionOption.name}</option>
                    ))}
                </RequiredSelectField>
                <button className="dy-btn dy-btn-primary" onClick={handleSaveConnection}>Save</button>
                <button className="dy-btn dy-btn-error" onClick={handleDeleteConnection}>Delete</button>
            </div>
            <RequiredInputField
                type="text"
                label="Name"
                value={connectionName}
                onChange={(e)=> setConnectionName(e.target.value)}
                required={false}
                className={''}
            />
            <RequiredSelectField
                label="Type"
                value={connectionType}
                onChange={(e)=> setConnectionType(e.target.value as DiffusionType)}
                required={false}
                className={''}
            >
                {connectionTypes.map((connectionOption, index) => (
                    <option key={index} value={connectionOption}>{getForwardFacingName(connectionOption)}</option>
                ))}
            </RequiredSelectField>
            {connectionType !== 'Dalle' && connectionType !== 'SDAPI' && connectionType !== 'Google' && connectionType !== 'Stability'  && connectionType !== 'NovelAI' && (
                <>
                <div className="flex flex-row gap-2 w-full items-center justify-center">
                    <RequiredInputField
                        type="text"
                        label="URL"
                        value={connectionURL}
                        onChange={(e)=> setConnectionURL(e.target.value)}
                        required={false}
                        className={'w-full'}
                    />
                    <button className="dy-btn dy-btn-primary" onClick={() => handleValidateURL()}>Validate URL</button>
                </div>
                <div className="flex flex-col gap-2 dy-textarea dy-textarea-bordered">
                    <p className="text-sm dy-label flex flex-row justify-between"><b>URL Valid</b> {urlValid ? 'True' : 'False'}</p>
                </div>
                </>
            )}
            <RequiredInputField
                type="password"
                label="Password (API Key)"
                value={connectionPassword}
                onChange={(e)=> setConnectionPassword(e.target.value)}
                required={false}
                className={''}
            />
            <div className="flex flex-row gap-2 w-full items-center justify-center">
                <button className="dy-btn dy-btn-primary" onClick={handleTestConnection}>Test Connection</button>
                <button className="dy-btn dy-btn-primary" onClick={handleSaveConnection}>Save</button>
            </div>
            <div className="flex flex-col gap-2">
                <p className="dy-textarea dy-textarea-bordered w-full flex flex-row justify-between">
                    <b>Status</b> {connectionStatus}
                </p>
                <RequiredSelectField
                    label="Model"
                    value={connectionModel}
                    onChange={(e)=> setConnectionModel(e.target.value)}
                    required={false}
                    className={''}
                >
                    {connectionModelList.map((connectionOption, index) => (
                        <option key={index} value={connectionOption}>{connectionOption}</option>
                    ))}
                </RequiredSelectField>
            </div>
            <div className="flex flex-row gap-2 w-full items-center justify-center">
                <button className="dy-btn dy-btn-primary" onClick={setDefaultConnection}>Set as Default</button>
                <button className="dy-btn dy-btn-primary" onClick={handleSaveConnection}>Save</button>
            </div>
        </div>
    );
}
export default DiffusionPanel;
import { useEffect, useState } from "react";
import { EndpointType, GenericCompletionConnectionTemplate } from "../../types";
import RequiredInputField, { RequiredSelectField } from "../shared/required-input-field";
import { deleteConnectionById, saveConnectionToLocal, fetchAllConnections, fetchConnectionModels, fetchMancerModels, fetchPalmModels, fetchOpenAIModels } from "../../api/connectionAPI";
import { getAppSettingsConnection, getAppSettingsSettings, setAppSettingsConnection } from "../../api/settingsAPI";

function getForwardFacingName(type: EndpointType): string {
    switch (type) {
        case 'OAI-Compliant-API':
            return 'Generic OpenAI Completions Endpoint';
        case 'PaLM':
            return 'Google Makersuite';
        case 'OAI':
            return 'OpenAI Key';
        default:
            return type;
    }
}

const ConnectionPanel = () => {
    const connectionTypes: EndpointType[] = ['OAI-Compliant-API', 'Mancer', 'OAI', 'PaLM']
    const [savedConnections, setSavedConnections] = useState<GenericCompletionConnectionTemplate[]>([])
    const [connectionType, setConnectionType] = useState<EndpointType>(connectionTypes[0] as EndpointType)
    const [connectionID, setConnectionID] = useState<string>('' as string)
    const [connectionPassword, setConnectionPassword] = useState<string>('' as string)
    const [connectionURL, setConnectionURL] = useState<string>('' as string)
    const [connectionName, setConnectionName] = useState<string>('' as string)
    const [connectionModel, setConnectionModel] = useState<string>('' as string)
    const [connectionStatus, setConnectionStatus] = useState<string>('Untested' as string)
    const [connectionModelList, setConnectionModelList] = useState<string[]>([] as string[])

    const [urlValid, setURLValid] = useState<boolean>(false)

    const handleLoadConnections = () => {
        fetchAllConnections().then((connections) => {
            setSavedConnections(connections)
        })
    }

    useEffect(() => {
        handleLoadConnections()
    }, [])

    const handleSaveConnection = () => {
        let newID = connectionID
        if (newID === ''){
            newID = new Date().getTime().toString()
        }
        const newConnection: GenericCompletionConnectionTemplate = {
            id: newID,
            key: connectionPassword,
            url: connectionURL,
            name: connectionName,
            model: connectionModel,
            type: connectionType
        } as GenericCompletionConnectionTemplate
        if (savedConnections.some((connection) => connection.id === connectionID)) {
            const index = savedConnections.findIndex((connection) => connection.id === connectionID)
            savedConnections[index] = newConnection
        }else{
            setSavedConnections([...savedConnections, newConnection])
        }
        saveConnectionToLocal(newConnection)
        handleLoadConnections()
    }

    const handleDeleteConnection = () => {
        const index = savedConnections.findIndex((connection) => connection.id === connectionID)
        savedConnections.splice(index, 1)
        setSavedConnections([...savedConnections])
        deleteConnectionById(connectionID)
    }

    useEffect(() => {
        const handleLoadConnection = () => {
            const connection = savedConnections.find((connection) => connection.id === connectionID)
            if (connection){
                setConnectionType(connection.type)
                setConnectionPassword(connection.key)
                setConnectionURL(connection.url)
                setConnectionName(connection.name)
                setConnectionModel(connection.model)
            }else{
                setConnectionType(connectionTypes[0] as EndpointType)
                setConnectionPassword('')
                setConnectionURL('')
                setConnectionName('')
                setConnectionModel('')
            }
        }
        handleLoadConnection()
    }, [connectionID])
    
    useEffect(() => {
        getAppSettingsConnection().then((settings) => {
            setConnectionID(settings)
        })
    }, [])

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
        await setAppSettingsConnection(connectionID)
    }

    const handleTestConnection = () => {
        if(connectionType === 'Mancer'){
            setConnectionStatus('Connecting...')
            fetchMancerModels(connectionPassword).then((models) => {
                if(models === null) return
                setConnectionStatus('Connection Successful!')
                setConnectionModelList(models)
            }).catch((error) => {
                setConnectionStatus('Connection Failed')
            })
        }else if (connectionType === 'PaLM'){
            setConnectionStatus('Connecting...')
            fetchPalmModels(connectionPassword).then((models) => {
                if(models === null) return
                setConnectionStatus('Connection Successful!')
                setConnectionModelList(models)
            }).catch((error) => {
                setConnectionStatus('Connection Failed')
            })
        }else if(connectionType === 'OAI'){
            setConnectionStatus('Connecting...')
            fetchOpenAIModels(connectionPassword).then((models) => {
                if(models === null) return
                setConnectionStatus('Connection Successful!')
                setConnectionModelList(models)
            }).catch((error) => {
                setConnectionStatus('Connection Failed')
            })
        
        }else {
            setConnectionStatus('Connecting...')
            fetchConnectionModels(connectionURL).then((models) => {
                if(models === null) return
                setConnectionStatus('Connection Successful!')
                setConnectionModelList(models)
            }).catch((error) => {
                setConnectionStatus('Connection Failed')
            })
        }
    }

    return (
        <div className="flex flex-col gap-2 text-base-content">
            <div className="flex flex-row gap-2 w-full items-center justify-center">
                <RequiredSelectField
                    label="Connection Profile"
                    value={connectionID}
                    onChange={(e)=> setConnectionID(e.target.value)}
                    required={false}
                    className={'w-full'}
                >
                    <option value={''}>New Connection</option>
                    {savedConnections.map((connectionOption, index) => (
                        <option key={index} value={connectionOption.id}>{connectionOption.name}</option>
                    ))}
                </RequiredSelectField>
                <button className="dy-btn dy-btn-primary" onClick={handleSaveConnection}>Save</button>
                <button className="dy-btn dy-btn-error" onClick={handleDeleteConnection}>Delete</button>
            </div>
            <RequiredInputField
                type="text"
                label="Connection Name"
                value={connectionName}
                onChange={(e)=> setConnectionName(e.target.value)}
                required={false}
                className={''}
            />
            <RequiredSelectField
                label="Connection Type"
                value={connectionType}
                onChange={(e)=> setConnectionType(e.target.value as EndpointType)}
                required={false}
                className={''}
            >
                {connectionTypes.map((connectionOption, index) => (
                    <option key={index} value={connectionOption}>{getForwardFacingName(connectionOption)}</option>
                ))}
            </RequiredSelectField>
            {connectionType !== 'Mancer' && connectionType !== 'OAI' && connectionType !== 'Horde' && connectionType !== 'PaLM' && (
                <div className="flex flex-row gap-2 w-full items-center justify-center">
                    <RequiredInputField
                        type="text"
                        label="Connection URL"
                        value={connectionURL}
                        onChange={(e)=> setConnectionURL(e.target.value)}
                        required={false}
                        className={'w-full'}
                    />
                    <button className="dy-btn dy-btn-primary" onClick={() => handleValidateURL()}>Validate URL</button>
                    <div className="flex flex-col gap-2">
                        <p className="text-sm dy-label">URL Valid: {urlValid ? 'True' : 'False'}</p>
                    </div>
                </div>
            )}
            <RequiredInputField
                type="password"
                label="Connection Password (API Key)"
                value={connectionPassword}
                onChange={(e)=> setConnectionPassword(e.target.value)}
                required={false}
                className={''}
            />
            <button className="dy-btn dy-btn-primary" onClick={handleTestConnection}>Test Connection</button>
            <div className="flex flex-col gap-2">
                <p className="bg-base-200 rounded-box p-4 w-full flex flex-row justify-between">
                    <b>Connection Status</b> {connectionStatus}
                </p>
                <RequiredSelectField
                    label="Connection Model"
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
            </div>
        </div>
    );
};
export default ConnectionPanel;
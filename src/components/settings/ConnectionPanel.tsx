import { useEffect, useState } from "react";
import { EndpointType, GenericCompletionConnectionTemplate } from "../../types";
import RequiredInputField, { RequiredSelectField } from "../shared/required-input-field";
import { deleteConnectionById, saveConnectionToLocal, fetchAllConnections, fetchConnectionModels, fetchMancerModels, fetchPalmModels, fetchOpenAIModels, fetchOpenRouterModels, fetchKoboldModel, fetchClaudeModel } from "../../api/connectionAPI";
import { getAppSettingsConnection, getAppSettingsSettings, setAppSettingsConnection } from "../../api/settingsAPI";

function getForwardFacingName(type: EndpointType): string {
  switch (type) {
    case 'OAI-Compliant-API':
      return 'Generic OpenAI Completions Endpoint';
    case 'PaLM':
      return 'Google Makersuite';
    case 'OAI':
      return 'OpenAI Key';
    case 'Kobold':
      return 'KoboldAI (Classic)';
    case 'P-AWS-Claude':
      return 'AWS Claude (Proxy)';
    case 'P-Claude':
      return 'Claude (Proxy)';
    default:
      return type;
  }
}

const ConnectionPanel = () => {
  const connectionTypes: EndpointType[] = ['OAI-Compliant-API', 'Mancer', 'OAI', 'PaLM', 'OpenRouter', 'Kobold', 'P-AWS-Claude', 'P-Claude']
  const [savedConnections, setSavedConnections] = useState<GenericCompletionConnectionTemplate[]>([])
  const [connectionType, setConnectionType] = useState<EndpointType>(localStorage.getItem('connectionType') as EndpointType || 'OAI-Compliant-API')
  const [connectionID, setConnectionID] = useState<string>(localStorage.getItem('connectionID') as string || '')
  const [connectionPassword, setConnectionPassword] = useState<string>(localStorage.getItem('connectionPassword') as string || '')
  const [connectionURL, setConnectionURL] = useState<string>(localStorage.getItem('connectionURL') as string || '')
  const [connectionName, setConnectionName] = useState<string>(localStorage.getItem('connectionName') as string || 'New Connection')
  const [connectionModel, setConnectionModel] = useState<string>(localStorage.getItem('connectionModel') as string || 'davinci')
  const [connectionStatus, setConnectionStatus] = useState<string>('Untested')
  const [connectionModelList, setConnectionModelList] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [urlValid, setURLValid] = useState<boolean>(false)

  useEffect(() => {
    if (connectionID === '') return
    if (savedConnections.length === 0) return
    const connection = savedConnections.find((connection) => connection.id === connectionID)
    if (connection) {
      setConnectionType(connection.type)
      setConnectionPassword(connection.key)
      setConnectionURL(connection.url)
      setConnectionName(connection.name)
      setConnectionModel(connection.model)
    }
  }, [connectionID, savedConnections])

  const handleLoadConnections = () => {
    fetchAllConnections().then((connections) => {
      setSavedConnections(connections)
    })
  }

  useEffect(() => {
    handleLoadConnections()
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
    if (connectionType === 'Mancer') {
      setConnectionStatus('Connecting...')
      fetchMancerModels(connectionPassword).then((models) => {
        if (models === null) return
        setConnectionStatus('Connection Successful!')
        setConnectionModelList(models)
      }).catch((error) => {
        setConnectionStatus('Connection Failed')
      })
    } else if (connectionType === 'PaLM') {
      setConnectionStatus('Connecting...')
      fetchPalmModels(connectionPassword).then((models) => {
        if (models === null) return
        setConnectionStatus('Connection Successful!')
        setConnectionModelList(models)
      }).catch((error) => {
        setConnectionStatus('Connection Failed')
      })
    } else if (connectionType === 'OAI') {
      setConnectionStatus('Connecting...')
      fetchOpenAIModels(connectionPassword).then((models) => {
        if (models === null) return
        setConnectionStatus('Connection Successful!')
        setConnectionModelList(models)
      }).catch((error) => {
        setConnectionStatus('Connection Failed')
      })

    } else if (connectionType === 'OAI-Compliant-API') {
      setConnectionStatus('Connecting...')
      fetchConnectionModels(connectionURL, connectionPassword).then((models) => {
        if (models === null) return
        setConnectionStatus('Connection Successful!')
        setConnectionModelList(models)
      }).catch((error) => {
        setConnectionStatus('Connection Failed')
      })
    } else if (connectionType === 'OpenRouter') {
      setConnectionStatus('Connecting...')
      fetchOpenRouterModels(connectionPassword).then((models) => {
        if (models === null) return
        setConnectionStatus('Connection Successful!')
        setConnectionModelList(models)
      }).catch((error) => {
        setConnectionStatus('Connection Failed')
      });
    } else if (connectionType === 'Kobold') {
      setConnectionStatus('Connecting...')
      fetchKoboldModel(connectionURL, connectionPassword).then((models) => {
        if (models === null) return
        setConnectionStatus('Connection Successful!')
        setConnectionModelList(models)
      }).catch((error) => {
        setConnectionStatus('Connection Failed')
      });
      setConnectionStatus('Connection Successful!')
    } else if (connectionType === 'P-AWS-Claude' || connectionType === 'P-Claude') {
      setConnectionStatus('Connecting...')
      fetchClaudeModel(connectionURL, connectionPassword, (connectionType === 'P-AWS-Claude')).then((models) => {
        if (models === null) return
        console.log(models)
        setConnectionStatus('Connection Successful!')
        setConnectionModelList(models)
      }).catch((error) => {
        setConnectionStatus('Connection Failed')
      });
      setConnectionStatus('Connection Successful!')
    } else {
      setConnectionStatus('Connecting...')
      fetchConnectionModels(connectionURL, connectionPassword).then((models) => {
        if (models === null) return
        setConnectionStatus('Connection Successful!')
        setConnectionModelList(models)
      }).catch((error) => {
        setConnectionStatus('Connection Failed')
      })
    }
  }

  const handleSaveConnection = () => {
    let newID = connectionID
    if (newID === '') {
      newID = new Date().getTime().toString()
    }
    const newConnection: GenericCompletionConnectionTemplate = {
      id: newID,
      key: connectionPassword,
      url: connectionURL,
      name: connectionName,
      model: (connectionModel.trim() === '') ? connectionModelList[0] : connectionModel,
      type: connectionType
    } as GenericCompletionConnectionTemplate
    setConnectionID(newID)
    if (savedConnections.some((connection) => connection.id === connectionID)) {
      const index = savedConnections.findIndex((connection) => connection.id === connectionID)
      savedConnections[index] = newConnection
    } else {
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
    const saveToLocalStorage = () => {
      localStorage.setItem('connectionID', connectionID)
      localStorage.setItem('connectionType', connectionType)
      localStorage.setItem('connectionPassword', connectionPassword)
      localStorage.setItem('connectionURL', connectionURL)
      localStorage.setItem('connectionName', connectionName)
      localStorage.setItem('connectionModel', connectionModel)
    }
    saveToLocalStorage()
  }, [connectionID, connectionType, connectionPassword, connectionURL, connectionName, connectionModel])

  return (
    <div className="flex flex-col gap-2 text-base-content">
      <div className="flex flex-row gap-2 w-full items-end justify-center">
        <RequiredSelectField
          label="Connection Profile"
          value={connectionID}
          onChange={(e) => setConnectionID(e.target.value)}
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
        onChange={(e) => setConnectionName(e.target.value)}
        required={false}
        className={''}
      />
      <RequiredSelectField
        label="Connection Type"
        value={connectionType}
        onChange={(e) => setConnectionType(e.target.value as EndpointType)}
        required={false}
        className={''}
      >
        {connectionTypes.map((connectionOption, index) => (
          <option key={index} value={connectionOption}>{getForwardFacingName(connectionOption)}</option>
        ))}
      </RequiredSelectField>
      {connectionType !== 'Mancer' && connectionType !== 'OAI' && connectionType !== 'Horde' && connectionType !== 'PaLM' && connectionType !== 'OpenRouter' && (
        <>
          <div className="flex flex-row gap-2 w-full items-center justify-center">
            <RequiredInputField
              type="text"
              label="Connection URL"
              value={connectionURL}
              onChange={(e) => setConnectionURL(e.target.value)}
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
        label="Connection Password (API Key)"
        value={connectionPassword}
        onChange={(e) => setConnectionPassword(e.target.value)}
        required={false}
        className={''}
      />
      <div className="flex flex-row gap-2 w-full items-center justify-center">
        <button className="dy-btn dy-btn-primary" onClick={handleTestConnection}>Test Connection</button>
        <button className="dy-btn dy-btn-primary" onClick={handleSaveConnection}>Save</button>
      </div>
      <div className="flex flex-col gap-2">
        <p className="dy-textarea dy-textarea-bordered p-4 w-full flex flex-row justify-between">
          <b>Connection Status</b> {connectionStatus}
        </p>
        <input
          type="text"
          placeholder="Search Models"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dy-input dy-input-bordered"
        />
        <RequiredSelectField
          label="Connection Model"
          value={connectionModel}
          onChange={(e) => setConnectionModel(e.target.value)}
          required={false}
          className={''}
        >
          {connectionModelList.filter(
            (model) => model.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((connectionOption, index) => (
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
};
export default ConnectionPanel;
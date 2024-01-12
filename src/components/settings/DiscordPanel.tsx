import React, { useEffect, useState } from 'react';
import { DiscordConfig, DiscordGlobalConfig } from '../../types';
import RequiredInputField, { RequiredSelectField } from '../shared/required-input-field';
import { fetchAllDiscordConfigs, fetchGlobalDiscordConfig, removeDiscordConfigById, saveDiscordConfig, setGlobalDiscordConfig } from '../../api/discordConfigAPI';
import { uploadFile } from '../../api/fileServer';
import ImgRefresh from '../shared/img-refresh';
import { checkIfDiscordIsConnected } from '../../api/discordManagementAPI';
import { useDiscordBotConnectionListener } from '../../helpers/events';

const DiscordPanel = () => {
    const [savedConfigs, setSavedConfigs] = useState<DiscordConfig[]>([])
    const [configID, setConfigID] = useState<string>('' as string)
    const [configKey, setConfigKey] = useState<string>('' as string)
    const [photoURL, setPhotoURL] = useState<string>('' as string)
    const [configApplicationID, setConfigApplicationID] = useState<string>('' as string)
    const [configName, setConfigName] = useState<string>('' as string)
    const [autoRestart, setAutoRestart] = useState<boolean>(false)
    const [configChannelID, setConfigChannelID] = useState<string>('' as string)
    const [logChannelID, setLogChannelID] = useState<string>('' as string)
    const [sendLogMessages, setSendLogMessages] = useState<boolean>(false)
    const [sendReadyMessages, setSendReadyMessages] = useState<boolean>(false)
    const [sendReminderMessages, setSendReminderMessages] = useState<boolean>(false)
    const [allowDiffusion, setAllowDiffusion] = useState<boolean>(false)
    const [allowChannelManagement, setAllowChannelManagement] = useState<boolean>(false)
    const [allowRoleManagement, setAllowRoleManagement] = useState<boolean>(false)
    const [allowUserManagement, setAllowUserManagement] = useState<boolean>(false)
    const [allowDirectMessages, setAllowDirectMessages] = useState<boolean>(false)
    const [adminUsers, setAdminUsers] = useState<string[]>([] as string[])
    const [adminRoles, setAdminRoles] = useState<string[]>([] as string[])
    const [bannedUsers, setBannedUsers] = useState<string[]>([] as string[])
    const [bannedRoles, setBannedRoles] = useState<string[]>([] as string[])
    const [sendIsTyping, setSendIsTyping] = useState<boolean>(false)
    const [allowMultiCharacter, setAllowMultiCharacter] = useState<boolean>(false)
    const [defaultCharacter, setDefaultCharacter] = useState<string>('' as string)
    const [waitingForImage, setWaitingForImage] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false);
    const [online, setOnline] = useState<boolean>(false);

    const handleLoadConfigs = () => {
        fetchAllDiscordConfigs().then((configs) => {
            setSavedConfigs(configs)
        })
        checkIfDiscordIsConnected().then((isConnected) => {
            console.log(isConnected)
            setOnline(isConnected)
        })
    }

    useEffect(() => {
        handleLoadConfigs()
    }, [])

    useDiscordBotConnectionListener(() => {
        checkIfDiscordIsConnected().then((isConnected) => {
            setOnline(isConnected)
        })
    })

    const handleSaveConfig = () => {
        let newID = configID
        if (newID === ''){
            newID = new Date().getTime().toString()
        }
        const newConfig: DiscordConfig = {
            id: newID,
            apiKey: configKey,
            photoUrl: photoURL,
            applicationId: configApplicationID,
            name: configName,
            configChannelId: configChannelID,
            logChannelId: logChannelID,
            sendLogMessages: sendLogMessages,
            sendReadyMessages: sendReadyMessages,
            sendReminderMessages: sendReminderMessages,
            allowDiffusion: allowDiffusion,
            allowChannelManagement: allowChannelManagement,
            allowRoleManagement: allowRoleManagement,
            allowUserManagement: allowUserManagement,
            allowDirectMessages: allowDirectMessages,
            adminUsers: adminUsers,
            adminRoles: adminRoles,
            bannedUsers: bannedUsers,
            bannedRoles: bannedRoles,
            sendIsTyping: sendIsTyping,
            allowMultiCharacter: allowMultiCharacter,
            defaultCharacter: defaultCharacter,
        } as DiscordConfig
        if (savedConfigs.some((config) => config.id === configID)) {
            const index = savedConfigs.findIndex((config) => config.id === configID)
            savedConfigs[index] = newConfig
        }else{
            setSavedConfigs([...savedConfigs, newConfig])
        }
        saveDiscordConfig(newConfig)
        handleLoadConfigs()
    }

    const handleDeleteConfig = () => {
        const index = savedConfigs.findIndex((config) => config.id === configID)
        savedConfigs.splice(index, 1)
        setSavedConfigs([...savedConfigs])
        removeDiscordConfigById(configID)
    }

    const handleProfilePictureChange = async (files: FileList | null) => {
        if (files === null) return;
        setWaitingForImage(true);
    
        const file = files[0];
        const fileName = await uploadFile(file);
        setPhotoURL(fileName);
        setWaitingForImage(false);
    };
    
    useEffect(() => {
        const handleLoadConfig = () => {
            const config = savedConfigs.find((config) => config.id === configID)
            if (config){
                setConfigKey(config.apiKey)
                setPhotoURL(config.photoUrl)
                setConfigApplicationID(config.applicationId)
                setConfigName(config.name)
                setConfigChannelID(config.configChannelId)
                setLogChannelID(config.logChannelId)
                setSendLogMessages(config.sendLogMessages)
                setSendReadyMessages(config.sendReadyMessages)
                setSendReminderMessages(config.sendReminderMessages)
                setAllowDiffusion(config.allowDiffusion)
                setAllowChannelManagement(config.allowChannelManagement)
                setAllowRoleManagement(config.allowRoleManagement)
                setAllowUserManagement(config.allowUserManagement)
                setAllowDirectMessages(config.allowDirectMessages)
                setAdminUsers(config.adminUsers)
                setAdminRoles(config.adminRoles)
                setBannedUsers(config.bannedUsers)
                setBannedRoles(config.bannedRoles)
                setSendIsTyping(config.sendIsTyping)
                setAllowMultiCharacter(config.allowMultiCharacter)
                setDefaultCharacter(config.defaultCharacter)
            }else{
                setConfigKey('')
                setPhotoURL('')
                setConfigApplicationID('')
                setConfigName('')
                setConfigChannelID('')
                setLogChannelID('')
                setSendLogMessages(false)
                setSendReadyMessages(false)
                setSendReminderMessages(false)
                setAllowDiffusion(false)
                setAllowChannelManagement(false)
                setAllowRoleManagement(false)
                setAllowUserManagement(false)
                setAllowDirectMessages(false)
                setAdminUsers([])
                setAdminRoles([])
                setBannedUsers([])
                setBannedRoles([])
                setSendIsTyping(false)
                setAllowMultiCharacter(false)
                setDefaultCharacter('')
            }
        }
        handleLoadConfig()
    }, [configID])
    
    useEffect(() => {
        fetchGlobalDiscordConfig().then((settings) => {
            setConfigID(settings.currentConfig)
            setAutoRestart(settings.autoRestart)
        })
    }, [])

    const setDefaultConfig = async () => {
        const globals: DiscordGlobalConfig = {
            currentConfig: configID,
            autoRestart: autoRestart,
        } as DiscordGlobalConfig
        await setGlobalDiscordConfig(globals)
    }

    return (
        <div className="text-base-content flex flex-col gap-2">
            <div className="flex flex-row gap-2 w-full items-center justify-center">
                <RequiredSelectField
                    label="Profile"
                    value={configID}
                    onChange={(e)=> setConfigID(e.target.value)}
                    required={false}
                    className={'w-full'}
                >
                    <option value={''}>New Discord Config</option>
                    {savedConfigs.map((configOption, index) => (
                        <option key={index} value={configOption.id}>{configOption.name}</option>
                    ))}
                </RequiredSelectField>
                <button className="dy-btn dy-btn-primary" onClick={handleSaveConfig}>Save</button>
                <button className="dy-btn dy-btn-error" onClick={handleDeleteConfig}>Delete</button>
            </div>
            <label className="font-bold w-full text-left">Bot Status</label>
            <p className={'dy-textarea dy-textarea-bordered ' + (online ? 'text-primary' : 'text-error')}>
                {online ? 'Online' : 'Offline'}
            </p>
            <div className="flex flex-col w-full justify-center items-center">
                <label className="font-bold w-full text-left">Bot Avatar</label>
                <label htmlFor="image-upload" className="relative">
                    <ImgRefresh src={photoURL} alt={configName} className="character-image" loading={waitingForImage} setLoading={setLoading}/>
                </label>
                <input
                    type="file" 
                    aria-label="Profile Picture"
                    name="profilePicture"
                    id="image-upload" 
                    className="hidden" 
                    accept=".png, .jpg, .jpeg"
                    onChange={(e) => handleProfilePictureChange(e.target.files)}
                />
            </div>
            <RequiredInputField
                type="text"
                label="Bot Name"
                value={configName}
                onChange={(e)=> setConfigName(e.target.value)}
                required={false}
                className={''}
            />
            <RequiredInputField
                type="password"
                label="API Key"
                value={configKey}
                onChange={(e)=> setConfigKey(e.target.value)}
                required={false}
                className={''}
            />
            <RequiredInputField
                type="text"
                label="Application ID"
                value={configApplicationID}
                onChange={(e)=> setConfigApplicationID(e.target.value)}
                required={false}
                className={''}
            />
            <div className="flex flex-row gap-2 w-full items-center justify-center">
                <button className="dy-btn dy-btn-primary" onClick={setDefaultConfig}>Set as Default</button>
                <button className="dy-btn dy-btn-primary" onClick={handleSaveConfig}>Save</button>
            </div>
            <div className='dy-textarea flex flex-col gap-2 text-center border dy-textarea-bordered'>
                <div className='flex flex-row justify-between w-full gap-2'>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Auto Restart</label>
                        <input type="checkbox" checked={autoRestart} onChange={(e) => setAutoRestart(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Send Log Updates</label>
                        <input type="checkbox" checked={sendLogMessages} onChange={(e) => setSendLogMessages(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Send Ready Messages</label>
                        <input type="checkbox" checked={sendReadyMessages} onChange={(e) => setSendReadyMessages(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                </div>
                <div className='flex flex-row justify-between w-full gap-2'>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Send Reminder Messages</label>
                        <input type="checkbox" checked={sendReminderMessages} onChange={(e) => setSendReminderMessages(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Allow Diffusion</label>
                        <input type="checkbox" checked={allowDiffusion} onChange={(e) => setAllowDiffusion(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Allow Channel Management</label>
                        <input type="checkbox" checked={allowChannelManagement} onChange={(e) => setAllowChannelManagement(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                </div>
                <div className='flex flex-row justify-between w-full gap-2'>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Allow Role Management</label>
                        <input type="checkbox" checked={allowRoleManagement} onChange={(e) => setAllowRoleManagement(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Allow User Management</label>
                        <input type="checkbox" checked={allowUserManagement} onChange={(e) => setAllowUserManagement(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Allow Direct Messages</label>
                        <input type="checkbox" checked={allowDirectMessages} onChange={(e) => setAllowDirectMessages(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                </div>
                <div className='flex flex-row justify-between w-full gap-2'>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Show 'is typing...'</label>
                        <input type="checkbox" checked={sendIsTyping} onChange={(e) => setSendIsTyping(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                    <div className='flex flex-col gap-2 w-full flex-grow justify-between items-center'>
                        <label className="font-bold w-full">Allow Multiple Characters</label>
                        <input type="checkbox" checked={allowMultiCharacter} onChange={(e) => setAllowMultiCharacter(e.target.checked)} className='dy-toggle-lg dy-toggle dy-toggle-primary' />
                    </div>
                </div>
            </div>
        </div>
    );
}
export default DiscordPanel;
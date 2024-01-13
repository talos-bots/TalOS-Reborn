/* eslint-disable prefer-const */
import { useEffect, useState } from "react";
import { Room } from "../../../types";
import RequiredInputField, { RequiredSelectField, RequiredTextAreaField } from "../../../components/shared/required-input-field";
import { saveRoom } from "../../../api/roomAPI";
import { getAllChannels, getChannels, getGuilds } from "../../../api/discordManagementAPI";
import { Character } from "../../../global_classes/Character";
import CharacterMultiSelect from "../../../components/shared/character-multi";
import { fetchAllCharacters } from "../../../api/characterAPI";

interface RoomSettingsProps {
    discordOnline: boolean;
    selectedRoom: Room | null;
    setSelectedRoom: (room: Room) => void;
}

interface ChannelOption {
    name: string;
    value: string;
    guildID: string;
}

interface Option {
    name: string;
    value: string;
}

const RoomSettings = ({ discordOnline, selectedRoom, setSelectedRoom }: RoomSettingsProps) => {
    const [roomName, setRoomName] = useState<string>('');
    const [roomDescription, setRoomDescription] = useState<string>('');
    const [channel, setChannel] = useState<string>('');
    const [guildID, setGuildID] = useState<string>('');
    const [characterIds, setCharacterIds] = useState<string[]>([]);
    const [availableChannels, setAvailableChannels] = useState<ChannelOption[]>([]);
    const [availableGuilds, setAvailableGuilds] = useState<Option[]>([]);
    const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);

    const getGuildOptions = async () => {
        getGuilds().then((guilds) => {
            const options: Option[] = [];
            guilds.forEach((guild) => {
                options.push({name: guild.name, value: guild.id});
            });
            setAvailableGuilds(options);
        });
    }
    
    const getCharacterOptions = async () => {
        fetchAllCharacters().then((characters) => {
            setAvailableCharacters(characters);
        });
    }

    useEffect(() => {
        if(discordOnline){
            getGuildOptions();
        }
    }, [discordOnline]);

    useEffect(() => {
        if(selectedRoom) {
            setRoomName(selectedRoom.name);
            setRoomDescription(selectedRoom.description);
            setChannel(selectedRoom.channelId);
            setGuildID(selectedRoom.guildId);
            if(discordOnline){
                getChannels(selectedRoom.guildId).then((channels) => {
                    const options: ChannelOption[] = [];
                    channels.forEach((channel) => {
                        if(channel.type === 0)
                        options.push({name: channel.name, value: channel.id, guildID: selectedRoom.guildId});
                    });
                    setAvailableChannels(options);
                });
            }
            setCharacterIds(selectedRoom.characters);
        }else {
            setRoomName('');
            setRoomDescription('');
            setChannel('');
            setGuildID('');
            setCharacterIds([]);
        }
        if(discordOnline){
            getGuildOptions();
        }
    }, [selectedRoom]);

    useEffect(() => {
        getCharacterOptions();
    }, []);
    
    const saveRoomState = () => {
        if(selectedRoom){
            const room: Room = {
                ...selectedRoom,
                name: roomName,
                description: roomDescription,
                channelId: channel,
                guildId: guildID,
                characters: characterIds,
            }
            saveRoom(room);
            setSelectedRoom(room);
        }
    }

    return (
        <div className="w-full h-full flex flex-col gap-2">
            <RequiredInputField
                label='Room Name'
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder='Enter a name for your room'
                required={false}
                disabled={!selectedRoom}
                className={'w-full'}
            />
            <RequiredTextAreaField
                label='Room Description'
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                placeholder='Enter a description for your room'
                required={false}
                disabled={!selectedRoom}
                className={'w-full'}
            />
            <RequiredSelectField
                label='Room Guild'
                value={guildID}
                onChange={(e) => {
                    setGuildID(e.target.value);
                    getChannels(e.target.value).then((channels) => {
                        const options: ChannelOption[] = [];
                        channels.forEach((channel) => {
                            if(channel.type === 0)
                            options.push({name: channel.name, value: channel.id, guildID: e.target.value});
                        });
                        setAvailableChannels(options);
                    });
                }}
                placeholder='Select a guild for your room'
                required={false}
                disabled={!selectedRoom || !discordOnline || !availableGuilds.length}
                className={'w-full'}
            >
                <option value={''} disabled>Select a guild for your room</option>
                {availableGuilds.map((option) => (
                    <option value={option.value} key={option.value}>{option.name}</option>
                ))}
            </RequiredSelectField>
            <RequiredSelectField
                label='Room Channel'
                value={channel}
                onChange={(e) => {
                    setChannel(e.target.value);
                }}
                placeholder='Select a channel for your room'
                required={false}
                disabled={!selectedRoom || !discordOnline || !availableChannels.length}
                className={'w-full'}
            >
                <option value={''} disabled>Select a channel for your room</option>
                {availableChannels.map((option) => (
                    <option value={option.value} key={option.value}>{option.name}</option>
                ))}
            </RequiredSelectField>
            <CharacterMultiSelect characters={availableCharacters} selectedCharacters={characterIds} setSelectedCharacters={setCharacterIds}/>
            <button className='dy-btn dy-btn-primary w-full' onClick={() => { saveRoomState() }} disabled={!selectedRoom}>
                Save
            </button>
        </div>
    );
}
export default RoomSettings;
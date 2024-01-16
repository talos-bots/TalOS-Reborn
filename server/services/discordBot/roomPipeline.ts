import { Message } from "discord.js";
import { Alias, AuthorsNote, CharacterSettingsOverride, ChatMessage, Room, RoomMessage } from "../../typings/discordBot.js";
import { roomsPath } from "../../server.js";
import fs from 'fs';
import path from 'path';
import { fetchCharacterById } from "../../routes/characters.js";
import { handleCompletionRequest } from "../../routes/llms.js";
import { breakUpCommands } from "../../helpers/index.js";
import { CompletionRequest, Role, UsageArguments } from "../../typings/types.js";

export class RoomPipeline implements Room {
    public _id: string = '';
    public name: string = '';
    public description: string = '';
    public createdBy: string = '';
    public channelId: string = '';
    public guildId: string = '';
    public isPrivate: boolean = false;
    public isLocked: boolean = false;
    public createdAt: Date = new Date();
    public lastModified: Date = new Date();
    public messages: RoomMessage[] = [];
    public bannedUsers: string[] = [];
    public bannedPhrases: string[] = [];   
    public whitelistUsers: string[] = [];
    public characters: string[] = [];
    public aliases: Alias[] = [];
    public authorsNotes: AuthorsNote[] = [];
    public authorsNoteDepth: number = 0;
    public allowRegeneration: boolean = false;
    public allowDeletion: boolean = false;
    public overrides: CharacterSettingsOverride[] = [];
    public users: string[] = [];

    constructor(room: Room) {
        this._id = room._id;
        this.name = room.name;
        this.description = room.description;
        this.createdBy = room.createdBy;
        this.channelId = room.channelId;
        this.guildId = room.guildId;
        this.isPrivate = room.isPrivate;
        this.isLocked = room.isLocked;
        this.createdAt = room.createdAt;
        this.lastModified = room.lastModified;
        this.messages = room.messages;
        this.bannedUsers = room.bannedUsers;
        this.bannedPhrases = room.bannedPhrases;
        this.whitelistUsers = room.whitelistUsers;
        this.characters = room.characters;
        this.aliases = room.aliases;
        this.authorsNotes = room.authorsNotes;
        this.authorsNoteDepth = room.authorsNoteDepth;
        this.allowRegeneration = room.allowRegeneration;
        this.allowDeletion = room.allowDeletion;
        this.overrides = room.overrides;
        this.users = room.users;
    }

    updateLastModified(): void {
        this.lastModified = new Date();
    }

    addRoomMessage(roomMessage: RoomMessage): void {
        this.messages.push(roomMessage);
        this.updateLastModified();
    }

    processDiscordMessage(message: Message): RoomMessage {
        const alias = this.aliases.find(alias => alias.userId === message.author.id);
        const roomMessage: RoomMessage = {
            _id: message.id,
            timestamp: message.createdTimestamp,
            attachments: message.attachments.toJSON(),
            embeds: message.embeds,
            discordChannelId: message.channel.id,
            discordGuildId: message.guild?.id || '',
            message: {
                userId: message.author.id,
                fallbackName: alias?.name || message.author.username,
                swipes: [message.cleanContent],
                currentIndex: 0,
                role: 'User' as Role,
                thought: false
            }
        }
        this.addRoomMessage(roomMessage);
        return roomMessage;
    }

    getRoomMessage(messageId: string): RoomMessage | undefined {
        return this.messages.find(message => message._id === messageId);
    }

    getRoomMessageIndex(messageId: string): number {
        return this.messages.findIndex(message => message._id === messageId);
    }

    getRoomMessageByIndex(index: number): RoomMessage | undefined {
        return this.messages[index];
    }

    replaceCharacter(newCharacterId: string): void {
        this.characters = [newCharacterId];
        this.updateLastModified();
    }

    addCharacter(newCharacterId: string): void {
        this.characters.push(newCharacterId);
        this.updateLastModified();
    }

    removeCharacter(characterId: string): void {
        this.characters = this.characters.filter(id => id !== characterId);
        this.updateLastModified();
    }

    clearAllCharacters(): void {
        this.characters = [];
        this.updateLastModified();
    }

    addAlias(alias: Alias): void {
        this.aliases.push(alias);
        this.updateLastModified();
    }

    removeAlias(aliasId: string): void {
        this.aliases = this.aliases.filter(alias => alias.userId !== aliasId);
        this.updateLastModified();
    }

    createAlias(userId: string, personaId: string, name?: string, avatarUrl?: string): Alias {
        const alias: Alias = {
            userId,
            personaId,
            name,
            avatarUrl
        }
        this.addAlias(alias);
        return alias;
    }

    getAlias(aliasId: string): Alias | undefined {
        return this.aliases.find(alias => alias.userId === aliasId);
    }

    roomMessagesToChatMessages(): ChatMessage[] {
        return this.messages.map(message => message.message);
    }

    toRoom(): Room {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            createdBy: this.createdBy,
            channelId: this.channelId,
            guildId: this.guildId,
            isPrivate: this.isPrivate,
            isLocked: this.isLocked,
            createdAt: this.createdAt,
            lastModified: this.lastModified,
            messages: this.messages,
            bannedUsers: this.bannedUsers,
            bannedPhrases: this.bannedPhrases,
            whitelistUsers: this.whitelistUsers,
            characters: this.characters,
            aliases: this.aliases,
            authorsNotes: this.authorsNotes,
            authorsNoteDepth: this.authorsNoteDepth,
            allowRegeneration: this.allowRegeneration,
            allowDeletion: this.allowDeletion,
            overrides: this.overrides,
            users: this.users
        }
    }

    saveToFile(): void {
        try {
            fs.writeFileSync(path.join(roomsPath, `${this._id}.json`), JSON.stringify(this.toRoom(), null, 4));
        } catch (error) {
            console.error('Failed to save room to file:', error);
        }
    }

    public static loadFromFile(roomId: string): RoomPipeline {
        if (!fs.existsSync(path.join(roomsPath, `${roomId}.json`))) {
            throw new Error(`Room not found: ${roomId}`);
        }
        const room = JSON.parse(fs.readFileSync(path.join(roomsPath, `${roomId}.json`), 'utf8')) as Room;
        return new RoomPipeline(room);
    }

    public static doesRoomExist(roomId: string): boolean {
        if (!fs.existsSync(path.join(roomsPath, `${roomId}.json`))) {
            return false;
        } else {
            return true;
        }
    }

    public static doesRoomExistByChannelId(channelId: string): boolean {
        const roomFiles = fs.readdirSync(roomsPath);
        const rooms = [];
        for(const fileName of roomFiles) {
            const room = JSON.parse(fs.readFileSync(path.join(roomsPath, fileName), 'utf8')) as Room;
            rooms.push(room);
        }
        const room = rooms.find(room => room.channelId === channelId);
        if (room) {
            return true;
        } else {
            return false;
        }
    }

    public static getRoomByChannelId(channelId: string): RoomPipeline | undefined {
        const roomFiles = fs.readdirSync(roomsPath);
        const rooms = [];
        for(const fileName of roomFiles) {
            const room = JSON.parse(fs.readFileSync(path.join(roomsPath, fileName), 'utf8')) as Room;
            rooms.push(room);
        }
        const room = rooms.find(room => room.channelId === channelId);
        if (room) {
            return new RoomPipeline(room);
        } else {
            return undefined;
        }
    }

    getStopList(): string[] {
        const stopList: string[] = [];
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i];
            if(!stopList.includes(`${message.message.fallbackName}:`)){
                stopList.push(`${message.message.fallbackName}:`);
            }
        }
        return stopList;
    }

    async generateResponse(roomMessage: RoomMessage, characterId: string): Promise<RoomMessage> {
        const messages = this.messages;
        if(!this.messages.includes(roomMessage)){
            messages.push(roomMessage);
            this.addRoomMessage(roomMessage);
        }
        const processedMessages = [];
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            const alias = this.aliases.find(alias => alias.userId === message.message.userId);
            message.message.fallbackName = alias?.name || message.message.fallbackName;
            processedMessages.push(message);
        }
        this.messages = processedMessages;
        const requestMessages = this.roomMessagesToChatMessages();
        const character = await fetchCharacterById(characterId);
        if (!character) {
            throw new Error(`Character not found: ${characterId}`);
        }
        const characterSettingsOverride = this.overrides.find(override => override.characterId === characterId);
        const completionRequest: CompletionRequest = {
            messages: requestMessages,
            character: characterId,
            args: characterSettingsOverride?.args || undefined
        }
        let tries = 0;
        let unfinished = true;
        let value = '';
        let refinedResponse = '';
        while(unfinished && tries <= 3){
            try {
                const unparsedResponse = await handleCompletionRequest(completionRequest);
                if(unparsedResponse === null){
                    throw new Error('Failed to generate response');
                }
                console.log(unparsedResponse);
                if(unparsedResponse?.choices[0]?.text === undefined){
                    throw new Error('Failed to generate response');
                }
                value = unparsedResponse?.choices[0]?.text.trim();
                refinedResponse = breakUpCommands(character.name, value, roomMessage.message.fallbackName, this.getStopList(), false);
                tries++;
                if(refinedResponse !== ''){
                    unfinished = false;
                }
            } catch (error) {
                console.error('Error during response generation:', error);
                tries++;
            }
        }
        if(refinedResponse === ''){
            throw new Error('Failed to generate response');
        }
        const characterResponse: RoomMessage = {
            _id: new Date().getTime().toString(),
            timestamp: new Date().getTime(),
            attachments: [],
            embeds: [],
            discordChannelId: this.channelId,
            discordGuildId: this.guildId,
            message: {
                userId: character._id,
                fallbackName: character.name,
                swipes: [refinedResponse],
                currentIndex: 0,
                role: 'Assistant' as Role,
                thought: false,
            }
        };
        this.addRoomMessage(characterResponse);
        this.saveToFile();
        return characterResponse;
    }
    
    public createSystemMessage(message: string): RoomMessage {
        const systemMessage: RoomMessage = {
            _id: new Date().getTime().toString(),
            timestamp: new Date().getTime(),
            attachments: [],
            embeds: [],
            discordChannelId: this.channelId,
            discordGuildId: this.guildId,
            message: {
                userId: 'system',
                fallbackName: 'System',
                swipes: [message],
                currentIndex: 0,
                role: 'System' as Role,
                thought: false,
            }
        };
        this.addRoomMessage(systemMessage);
        this.saveToFile();
        return systemMessage;
    }

    public getUsageArgumentsForCharacter(characterId: string): UsageArguments | undefined {
        const characterSettingsOverride = this.overrides.find(override => override.characterId === characterId);
        if(!characterSettingsOverride){
            return;
        }
        const args = characterSettingsOverride.args;
        if(!args){
            return;
        }
        return args;
    }

    public async addOrChangeAlias(alias: Alias){
        const existingAlias = this.aliases.find(existingAlias => existingAlias.userId === alias.userId);
        if(existingAlias){
            existingAlias.name = alias.name;
            existingAlias.avatarUrl = alias.avatarUrl;
            existingAlias.personaId = alias.personaId;
        } else {
            this.aliases.push(alias);
        }
        this.updateLastModified();
        await this.saveToFile();
    }

    clearMessages(): void {
        this.messages = [];
        this.updateLastModified();
        this.saveToFile();
    }
}
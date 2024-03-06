import { Message } from "discord.js";
import { RoomPipeline } from "../services/discordBot/roomPipeline.js";
import { DiscordBotService } from "../services/discordBot.js";
import { fetchCharacterById } from "./characters.js";
import { getGlobalConfig } from "./discordConfig.js";
import { Request, Response, Application, NextFunction, Router } from "express";
import { CharacterInterface } from "../typings/types.js";
import { Alias, RoomMessage } from "../typings/discordBot.js";

const activePipelines: RoomPipeline[] = [];

const activeDiscordClient: DiscordBotService = new DiscordBotService()
let isProcessing = false;

export async function processMessage(){
    if(!activeDiscordClient?.isLoggedIntoDiscord()){
        return;
    }
    // wait 2 seconds before processing the next message
    await new Promise(resolve => setTimeout(resolve, 2000));
    isProcessing = true;
    try {
        const message = activeDiscordClient.messageQueue.shift();
        if(!message) return;
        let roomPipeline = activePipelines.find(pipeline => pipeline.channelId === message.channel.id);
        if(!roomPipeline){
            const newPipeline = RoomPipeline.getRoomByChannelId(message.channel.id);
            if(!newPipeline){
                return;
            }
            roomPipeline = newPipeline;
            activePipelines.push(newPipeline);
        }
        if(!activeDiscordClient?.isLoggedIntoDiscord()) return isProcessing = false;
        if(message.content.startsWith('.') && !message.content.startsWith('...')) return isProcessing = false;
        const roomMessage = roomPipeline.processDiscordMessage(message);
        if(!roomMessage) return isProcessing = false;
        roomPipeline.saveToFile();
        activeDiscordClient.removeMessageFromQueue(message);
        if(message.content.startsWith('-')) return isProcessing = false;
        if(activeDiscordClient?.messageQueue[activeDiscordClient.messageQueue.length - 1]?.channel.id === message.channel.id) return isProcessing = false;
        await handleMessageProcessing(roomPipeline, roomMessage, message);
    } catch (error) {
        console.error('Error during message processing:', error);
    } finally {
        isProcessing = false;
        if(activeDiscordClient?.messageQueue.length > 0){
            processMessage();
        }
    }
}

async function handleMessageProcessing(room: RoomPipeline, message: RoomMessage, discordMessage: Message){
    const characters: CharacterInterface[] = [];
    for(let i = 0; i < room.characters.length; i++){
        const characterId = room.characters[i];
        const character = await fetchCharacterById(characterId);
        if(!character) continue;
        characters.push(character);
    }
    let roster: CharacterInterface[] = characters;
    // shuffle the roster
    roster = roster.sort(() => Math.random() - 0.5);
    activeDiscordClient.sendTyping(discordMessage)
    while(roster.length > 0){
        const character = roster.shift();
        if(!character) continue;
        const usageArgs = room.getUsageArgumentsForCharacter(character._id);
        if(!usageArgs){
            roster = roster.filter((char) => {
                return char._id !== character._id;
            });
            const response = await room.generateResponse(message, character._id);
            if(!response) break;
            const responseMessage = response.message.swipes[response.message.currentIndex];
            await activeDiscordClient?.sendMessageAsCharacter(room.channelId, character, responseMessage);
        }
    }
    isProcessing = false;
    processMessage();
}

async function generateDiscordResponse(room: RoomPipeline, message: RoomMessage){
    if(!activeDiscordClient?.isLoggedIntoDiscord()) return isProcessing = false;
    isProcessing = true;
    const characters: CharacterInterface[] = [];
    for(let i = 0; i < room.characters.length; i++){
        const characterId = room.characters[i];
        const character = await fetchCharacterById(characterId);
        if(!character) continue;
        characters.push(character);
    }
    let roster: CharacterInterface[] = characters;
    // shuffle the roster
    roster = roster.sort(() => Math.random() - 0.5);
    while(roster.length > 0){
        const character = roster.shift();
        if(!character) continue;
        const usageArgs = room.getUsageArgumentsForCharacter(character._id);
        if(!usageArgs){
            roster = roster.filter((char) => {
                return char._id !== character._id;
            });
            activeDiscordClient.sendTypingByChannelId(room.channelId);
            const response = await room.generateResponse(message, character._id);
            if(!response) break;
            const responseMessage = response.message.swipes[response.message.currentIndex];
            await activeDiscordClient?.sendMessageAsCharacter(room.channelId, character, responseMessage);
        }
    }
    isProcessing = false;
}

export async function startDiscordRoutes(){
    const globalConfig = getGlobalConfig();
    if(globalConfig.autoRestart){
        await activeDiscordClient.start().catch(console.error);
    }
}

const isDiscordRunning = (req: Request, res: Response, next: NextFunction) => {
    if(!activeDiscordClient?.isLoggedIntoDiscord()){
        res.status(500).send('Discord is not running');
        return;
    }
    next();
}

export function clearRoomMessages(roomId: string){
    let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
    if(!roomPipeline) roomPipeline = RoomPipeline.loadFromFile(roomId);
    if(!roomPipeline) return;
    roomPipeline.clearMessages();
}

export async function addOrChangeAliasForUser(alias: Alias, roomId: string){
    let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
    if(!roomPipeline) roomPipeline = RoomPipeline.loadFromFile(roomId);
    if(!roomPipeline) return;
    await roomPipeline.addOrChangeAlias(alias);
    roomPipeline.saveToFile();
}

export async function addSystemMessageAndGenerateResponse(roomId: string, message: string){
    let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
    if(!roomPipeline) roomPipeline = RoomPipeline.loadFromFile(roomId);
    if(!roomPipeline) return;
    const newMessage = roomPipeline.createSystemMessage(message);
    roomPipeline.addRoomMessage(newMessage);
    roomPipeline.saveToFile();
    await generateDiscordResponse(roomPipeline, newMessage);
}

export async function continueGenerateResponse(roomId: string){
    let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
    if(!roomPipeline) roomPipeline = RoomPipeline.loadFromFile(roomId);
    if(!roomPipeline) return;
    const newMessage = await roomPipeline.continueChat();
    activeDiscordClient.sendTypingByChannelId(roomPipeline.channelId);
    const character = await fetchCharacterById(newMessage.message.userId);
    if(!newMessage || !character) return;
    await activeDiscordClient?.sendMessageAsCharacter(roomPipeline.channelId, character, newMessage.message.swipes[newMessage.message.currentIndex]);
}

export const DiscordManagementRouter = Router();

export function removeRoomFromActive(id: string){
    const index = activePipelines.findIndex(pipeline => pipeline._id === id);
    if(index >= 0){
        activePipelines.splice(index, 1);
    }
}

export function updateRoomFromFile(id: string){
    const index = activePipelines.findIndex(pipeline => pipeline._id === id);
    if(index >= 0){
        activePipelines[index] = RoomPipeline.loadFromFile(id);
    }
}

export async function sendCharacterGreeting(roomId: string, characterId: string){
    let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
    if(!roomPipeline){
        if(!RoomPipeline.loadFromFile(roomId)) return console.error('Room not found');
        roomPipeline = RoomPipeline.loadFromFile(roomId);
    }
    const character = await fetchCharacterById(characterId);
    if(!character) return console.error('Character not found');
    const greeting = character.first_mes;
    if(!greeting) return console.error('Character has no greeting');
    roomPipeline.createRoomMessageFromChar(greeting, characterId);
    activeDiscordClient.sendMessageAsCharacter(roomPipeline.channelId, character, greeting);
}

export async function clearWebhooks(channelId: string){
    await activeDiscordClient.clearWebhooksFromChannel(channelId);
}

DiscordManagementRouter.post('/start', async (req, res) => {
    let config;
    if(req.body.config){
        config = req.body.config;
    }
    await activeDiscordClient?.start(config).catch(console.error);
    res.send(activeDiscordClient?.isLoggedIntoDiscord());
});

DiscordManagementRouter.post('/refreshProfile', isDiscordRunning, async (req, res) => {
    let config;
    if(req.body.config){
        config = req.body.config;
    }
    await activeDiscordClient?.setNameAndAvatar(config);
    res.send(activeDiscordClient?.isLoggedIntoDiscord());
});

DiscordManagementRouter.get('/isConnected', (req, res) => {
    res.send(activeDiscordClient?.isLoggedIntoDiscord());
});

DiscordManagementRouter.get('/isProcessing', isDiscordRunning, (req, res) => {
    res.send(activeDiscordClient?.processingQueue);
});

DiscordManagementRouter.post('/stop', isDiscordRunning, async (req, res) => {
    await activeDiscordClient?.stop();
    res.send(activeDiscordClient?.isLoggedIntoDiscord());
});

DiscordManagementRouter.post('/guilds', isDiscordRunning, async (req, res) => {
    const guilds = activeDiscordClient?.getGuilds();
    res.send(guilds);
});

DiscordManagementRouter.post('/channels', isDiscordRunning, async (req, res) => {
    if(!req.body.guildId){
        res.status(400).send('Missing guildId');
        return;
    }
    const channels = activeDiscordClient?.getChannels(req.body.guildId);
    res.send(channels);
});

DiscordManagementRouter.post('/users/all', isDiscordRunning, async (req, res) => {
    const users = activeDiscordClient?.getAllUsers();
    res.send(users);
});

DiscordManagementRouter.post('/channels/all', isDiscordRunning, async (req, res) => {
    const channels = activeDiscordClient?.getAllChannels();
    res.send(channels);
});
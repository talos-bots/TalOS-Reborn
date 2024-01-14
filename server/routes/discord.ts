import { Message } from "discord.js";
import { RoomPipeline } from "../services/discordBot/roomPipeline.js";
import { DiscordBotService } from "../services/discordBot.js";
import { fetchCharacterById } from "./characters.js";
import { getGlobalConfig } from "./discordConfig.js";
import { Request, Response, Application, NextFunction, Router } from "express";
import { CharacterInterface } from "../typings/types.js";

const activePipelines: RoomPipeline[] = [];

const activeDiscordClient: DiscordBotService = new DiscordBotService();
let isProcessing = false;

export async function processMessage(){
    if(!activeDiscordClient?.isLoggedIntoDiscord() || isProcessing){
        return;
    }
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
        await handleMessageProcessing(roomPipeline, message);
    } catch (error) {
        console.error('Error during message processing:', error);
    } finally {
        isProcessing = false;
        if(activeDiscordClient?.messageQueue.length > 0){
            processMessage();
        }
    }
}

async function handleMessageProcessing(room: RoomPipeline, message: Message){
    if(!activeDiscordClient?.isLoggedIntoDiscord()) return isProcessing = false;
    if(message.content.startsWith('.') && !message.content.startsWith('...')) return isProcessing = false;
    const roomMessage = room.processDiscordMessage(message);
    if(!roomMessage) return isProcessing = false;
    room.saveToFile();
    activeDiscordClient.removeMessageFromQueue(message);
    if(roomMessage.message.swipes[0].startsWith('-')) return isProcessing = false;
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
    activeDiscordClient.sendTyping(message)
    while(roster.length > 0){
        const character = roster.shift();
        if(!character) continue;
        const usageArgs = room.getUsageArgumentsForCharacter(character._id);
        if(!usageArgs){
            roster = roster.filter((char) => {
                return char._id !== character._id;
            });
            const response = await room.generateResponse(roomMessage, character._id);
            if(!response) continue;
            const responseMessage = response.message.swipes[response.message.currentIndex];
            await activeDiscordClient?.sendMessageAsCharacter(room.channelId, character, responseMessage);
        }
    }
    isProcessing = false;
    processMessage();
}

export async function startDiscordRoutes(){
    const globalConfig = getGlobalConfig();
    if(globalConfig.autoRestart){
        await activeDiscordClient.start()
    }
}

const isDiscordRunning = (req: Request, res: Response, next: NextFunction) => {
    if(!activeDiscordClient?.isLoggedIntoDiscord()){
        res.status(500).send('Discord is not running');
        return;
    }
    next();
}

export const DiscordManagementRouter = Router();

DiscordManagementRouter.post('/start', async (req, res) => {
    let config;
    if(req.body.config){
        config = req.body.config;
    }
    await activeDiscordClient?.start(config);
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
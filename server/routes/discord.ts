import { Message } from "discord.js";
import { RoomPipeline } from "../services/discordBot/roomPipeline.js";
import { DiscordBotService } from "../services/discordBot.js";
import { fetchCharacterById } from "./characters.js";
import { getGlobalConfig } from "./discordConfig.js";
import { Request, Response, Application, NextFunction, Router } from "express";
import { CharacterInterface, defaultCharacterObject } from "../typings/types.js";
import { Alias, RoomMessage } from "../typings/discordBot.js";

const activePipelines: RoomPipeline[] = [];

const activeDiscordClient: DiscordBotService = new DiscordBotService()
let isProcessing = false;

export async function processMessage() {
  if (!activeDiscordClient?.isLoggedIntoDiscord()) {
    return;
  }
  // wait 2 seconds before processing the next message
  isProcessing = true;
  try {
    const message = activeDiscordClient.messageQueue.shift();
    if (!message) return;
    if (message.content.startsWith('.') && !message.content.startsWith('...')) return isProcessing = false;
    let roomPipeline = activePipelines.find(pipeline => pipeline.channelId === message.channel.id);
    if (!roomPipeline) {
      const newPipeline = RoomPipeline.getRoomByChannelId(message.channel.id);
      if (!newPipeline) {
        return;
      }
      roomPipeline = newPipeline;
      activePipelines.push(newPipeline);
    }
    if (!activeDiscordClient?.isLoggedIntoDiscord()) return isProcessing = false;
    const roomMessage = roomPipeline.processDiscordMessage(message);
    if (!roomMessage) return isProcessing = false;
    roomPipeline.saveToFile();
    activeDiscordClient.removeMessageFromQueue(message);
    if (message.content.startsWith('-')) return isProcessing = false;
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (activeDiscordClient?.messageQueue[activeDiscordClient.messageQueue.length - 1]?.channel.id === message.channel.id) return isProcessing = false;
    await handleMessageProcessing(roomPipeline, roomMessage, message);
  } catch (error) {
    console.error('Error during message processing:', error);
  } finally {
    isProcessing = false;
    if (activeDiscordClient?.messageQueue.length > 0) {
      processMessage();
    }
  }
}

async function handleMessageProcessing(room: RoomPipeline, message: RoomMessage, discordMessage: Message) {
  const characters: CharacterInterface[] = [];
  for (let i = 0; i < room.characters.length; i++) {
    const characterId = room.characters[i];
    const character = await fetchCharacterById(characterId);
    if (!character) continue;
    characters.push(character);
  }
  let roster: CharacterInterface[] = characters;
  // shuffle the roster
  let toGo: string[] = [];
  if (containsName(message.message.swipes[message.message.currentIndex], characters)) {
    let id = containsName(message.message.swipes[message.message.currentIndex], characters);
    if (id !== false) {
      //determine if the character should respond, by using the character's response rate to user mentions
      let char = roster.find((char) => {
        return char._id === id;
      });
      if (char) {
        let responseRate = char.response_settings?.reply_to_user_mention ?? defaultCharacterObject?.response_settings?.reply_to_user_mention ?? 100;
        // get random number between 0 and 100
        let random = Math.floor(Math.random() * 101);
        if (random <= responseRate) {
          toGo.push(char._id);
          console.log('Mentioned Character should respond:', char.name);
        }
      }
    }
  } else {
    console.log('No character mentioned');
    //determine if the character should respond, by using the character's response rate to users without mention
    for (let i = 0; i < roster.length; i++) {
      let responseRate = roster[i].response_settings?.reply_to_user ?? defaultCharacterObject?.response_settings?.reply_to_user ?? 0;
      // get random number between 0 and 100
      let random = Math.floor(Math.random() * 101);
      if (random <= responseRate) {
        console.log('Character should respond:', roster[i].name);
        toGo.push(roster[i]._id);
      }
    }
  }

  const generateNewMessage = async (character: CharacterInterface) => {
    activeDiscordClient.sendTyping(discordMessage);
    roster = roster.filter((char) => {
      return char._id !== character._id;
    });
    const response = await room.generateResponse(message, character._id);
    if (!response) return;
    const responseMessage = response.message.swipes[response.message.currentIndex];
    await activeDiscordClient?.sendMessageAsCharacter(room.channelId, character, responseMessage);
    let name = containsName(responseMessage, characters);
    if (name && name !== character._id) {
      const char = roster.find((char) => {
        return char._id === name;
      });
      if (char) {
        //determine if the character should respond, by using the character's response rate to bots
        let responseRate = char.response_settings?.reply_to_bot_mention ?? defaultCharacterObject?.response_settings?.reply_to_bot_mention ?? 70;
        // get random number between 0 and 100
        let random = Math.floor(Math.random() * 101);
        if (random <= responseRate) {
          toGo.push(char._id);
        }
      }
      return;
    }
    //determine if the character should respond, by using the character's response rate to bots without mention
    let responseRate = character.response_settings?.reply_to_bot ?? defaultCharacterObject?.response_settings?.reply_to_bot ?? 50;
    // get random number between 0 and 100
    let random = Math.floor(Math.random() * 101);
    if (random <= responseRate) {
      toGo.push(character._id);
    }
    message = response;
  }

  while (toGo.length > 0) {
    let id = toGo.shift();
    let char = roster.find((char) => {
      return char._id === id;
    });
    if (char) {
      await generateNewMessage(char);
    }
  }

  isProcessing = false;
  processMessage();
}

function containsName(message: string, chars: CharacterInterface[]) {
  for (let i = 0; i < chars.length; i++) {
    if (isMentioned(message, chars[i])) {
      return chars[i]._id;
    }
  }
  return false;
}

function isMentioned(message: string, char: CharacterInterface) {
  if ((message.toLowerCase().trim().includes(char.name.toLowerCase().trim()) && char.name !== '')) {
    console.log('Name found:', char.name);
    console.log('Message:', message);
    return true;
  } else if (char.nicknames) {
    for (let i = 0; i < char.nicknames.length; i++) {
      console.log('Checking nickname:', char.nicknames[i]);
      if (message.toLowerCase().trim().includes(char.nicknames[i].toLowerCase().trim()) && char.nicknames[i].trim() !== '') {
        console.log('Nickname found:', char.nicknames[i]);
        console.log('Message:', message);
        return true;
      }
    }
  }
  return false;
}

async function generateDiscordResponse(room: RoomPipeline, message: RoomMessage) {
  if (!activeDiscordClient?.isLoggedIntoDiscord()) return isProcessing = false;
  isProcessing = true;
  const characters: CharacterInterface[] = [];
  for (let i = 0; i < room.characters.length; i++) {
    const characterId = room.characters[i];
    const character = await fetchCharacterById(characterId);
    if (!character) continue;
    characters.push(character);
  }
  let roster: CharacterInterface[] = characters;
  // shuffle the roster
  roster = roster.sort(() => Math.random() - 0.5);
  while (roster.length > 0) {
    const character = roster.shift();
    if (!character) continue;
    const usageArgs = room.getUsageArgumentsForCharacter(character._id);
    if (!usageArgs) {
      roster = roster.filter((char) => {
        return char._id !== character._id;
      });
      activeDiscordClient.sendTypingByChannelId(room.channelId);
      const response = await room.generateResponse(message, character._id);
      if (!response) break;
      const responseMessage = response.message.swipes[response.message.currentIndex];
      await activeDiscordClient?.sendMessageAsCharacter(room.channelId, character, responseMessage);
    }
  }
  isProcessing = false;
}

export async function startDiscordRoutes() {
  const globalConfig = getGlobalConfig();
  if (globalConfig.autoRestart) {
    await activeDiscordClient.start().catch(console.error);
  }
}

const isDiscordRunning = (req: Request, res: Response, next: NextFunction) => {
  if (!activeDiscordClient?.isLoggedIntoDiscord()) {
    res.status(500).send('Discord is not running');
    return;
  }
  next();
}

export function clearRoomMessages(roomId: string) {
  let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
  if (!roomPipeline) roomPipeline = RoomPipeline.loadFromFile(roomId);
  if (!roomPipeline) return;
  roomPipeline.clearMessages();
}

export async function addOrChangeAliasForUser(alias: Alias, roomId: string) {
  let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
  if (!roomPipeline) roomPipeline = RoomPipeline.loadFromFile(roomId);
  if (!roomPipeline) return;
  await roomPipeline.addOrChangeAlias(alias);
  roomPipeline.saveToFile();
}

export async function setMultiline(roomId: string, multiline: boolean) {
  let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
  if (!roomPipeline) roomPipeline = RoomPipeline.loadFromFile(roomId);
  if (!roomPipeline) return console.error('Room not found');
  console.log('Setting multiline:', multiline);
  await roomPipeline.setMultiline(multiline);
}

export async function addSystemMessageAndGenerateResponse(roomId: string, message: string) {
  let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
  if (!roomPipeline) roomPipeline = RoomPipeline.loadFromFile(roomId);
  if (!roomPipeline) return;
  const newMessage = roomPipeline.createSystemMessage(message);
  roomPipeline.addRoomMessage(newMessage);
  roomPipeline.saveToFile();
  await generateDiscordResponse(roomPipeline, newMessage);
}

export async function continueGenerateResponse(roomId: string) {
  let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
  if (!roomPipeline) roomPipeline = RoomPipeline.loadFromFile(roomId);
  if (!roomPipeline) return;
  const newMessage = await roomPipeline.continueChat();
  activeDiscordClient.sendTypingByChannelId(roomPipeline.channelId);
  const character = await fetchCharacterById(newMessage.message.userId);
  if (!newMessage || !character) return;
  await activeDiscordClient?.sendMessageAsCharacter(roomPipeline.channelId, character, newMessage.message.swipes[newMessage.message.currentIndex]);
}

export const DiscordManagementRouter = Router();

export function removeRoomFromActive(id: string) {
  const index = activePipelines.findIndex(pipeline => pipeline._id === id);
  if (index >= 0) {
    activePipelines.splice(index, 1);
  }
}

export function updateRoomFromFile(id: string) {
  const index = activePipelines.findIndex(pipeline => pipeline._id === id);
  if (index >= 0) {
    activePipelines[index] = RoomPipeline.loadFromFile(id);
  }
}

export async function sendCharacterGreeting(roomId: string, characterId: string) {
  let roomPipeline = activePipelines.find(pipeline => pipeline._id === roomId);
  if (!roomPipeline) {
    if (!RoomPipeline.loadFromFile(roomId)) return console.error('Room not found');
    roomPipeline = RoomPipeline.loadFromFile(roomId);
  }
  const character = await fetchCharacterById(characterId);
  if (!character) return console.error('Character not found');
  const greeting = character.first_mes;
  if (!greeting) return console.error('Character has no greeting');
  roomPipeline.createRoomMessageFromChar(greeting, characterId);
  activeDiscordClient.sendMessageAsCharacter(roomPipeline.channelId, character, greeting);
}

export async function clearWebhooks(channelId: string) {
  await activeDiscordClient.clearWebhooksFromChannel(channelId);
}

export async function deleteRoom(roomId: string) {
  removeRoomFromActive(roomId);
  RoomPipeline.deleteRoom(roomId);
}

DiscordManagementRouter.post('/start', async (req, res) => {
  let config;
  if (req.body.config) {
    config = req.body.config;
  }
  await activeDiscordClient?.start(config).catch(console.error);
  res.send(activeDiscordClient?.isLoggedIntoDiscord());
});

DiscordManagementRouter.post('/refreshProfile', isDiscordRunning, async (req, res) => {
  let config;
  if (req.body.config) {
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
  if (!req.body.guildId) {
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
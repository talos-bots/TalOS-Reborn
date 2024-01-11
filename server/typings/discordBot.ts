import { CommandInteraction, Message } from "discord.js";

export type Alias = {
    discordAuthorId: string;
    userId: string;
    roomId: string;
    personaId: string;
    name?: string;
    avatarUrl?: string;
}

export type AuthorsNote = {
    _id: string;
    note: string;
    location: string;
}

export type ChannelConfigInterface = {
    _id: string;
    guildId: string;
    characters: string[];
    aliases: Alias[];
    authorsNotes: AuthorsNote[];
    authorsNoteDepth: number;
}

export interface SlashCommandOption {
    name: string;
    description: string;
    type: number;  // Changed this from 'STRING' | 'INTEGER' ... to number
    required?: boolean;
    choices?: { name: string; value: string | number }[];
}

export interface SlashCommand {
    name: string;
    description: string;
    options?: SlashCommandOption[];
    execute: (interaction: CommandInteraction) => void | Promise<void>;
}

export type ValidStatus = 'online' | 'dnd' | 'idle' | 'invisible';

export type RoomMessage = {
    _id: string;
    text: string;
    timestamp: number;
    attachments: any[];
    embeds: any[];
    discordMessageId: string;
    discordChannelId: string;
    discordGuildId: string;
    userId: string;
}

export interface Room {
    _id: string;
    name: string;
    description: string;
    createdBy: string;
    channelId: string;
    guildId: string;
    isPrivate: boolean;
    isLocked: boolean;
    createdAt: Date;
    lastModified: Date;
    messages: RoomMessage[];
    bannedUsers: string[];
    bannedPhrases: string[];
    whitelistUsers: string[];
    characters: string[];
    aliases: Alias[];
    authorsNotes: AuthorsNote[];
    authorsNoteDepth: number;
    allowRegeneration: boolean;
    allowDeletion: boolean;
}
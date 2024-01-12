import { CommandInteraction, Message } from "discord.js";
import { Role } from "../routes/connections.js";

export type Alias = {
    userId: string;
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
    type: number; // 1 = subcommand, 2 = subcommand group, 3 = string, 4 = integer, 5 = boolean, 6 = user, 7 = channel, 8 = role, 9 = mentionable, 10 = number
    required?: boolean;
    choices?: { name: string; value: string | number }[];
}

export interface SlashCommand {
    name: string;
    description: string;
    requiresAdmin: boolean;
    options?: SlashCommandOption[];
    execute: (interaction: CommandInteraction) => void | Promise<void>;
}

export type ValidStatus = 'online' | 'dnd' | 'idle' | 'invisible';

export type ChatMessage = {
    userId: string;
    fallbackName: string;
    swipes: string[];
    currentIndex: number;
    role: Role;
    thought: boolean;
};

export type RoomMessage = {
    _id: string;
    timestamp: number;
    attachments: any[];
    embeds: any[];
    discordChannelId: string;
    discordGuildId: string;
    message: ChatMessage;
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
    users: string[];
    overrides: CharacterSettingsOverride[];
}

export interface CharacterSettingsOverride {
    characterId: string;
    settingsId?: string;
    connectionId?: string;
    model?: string;
}
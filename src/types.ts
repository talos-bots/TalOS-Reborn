import { saveRoom } from "./api/roomAPI";
import { UserPersona } from "./global_classes/Character";

export type DiscordBotApplicationDetails = {
    id: string;
    key: string;
    app: string;
    name: string;
}

export type GenericCompletionConnectionTemplate = {
    id: string;
    key?: string;
    url?: string;
    model?: string;
    name?: string;
    legacy?: boolean;
    type?: EndpointType;
}

export type DiffusionType = 'Dalle' | 'Auto1111' | 'SDAPI' | 'Reborn' | 'Google' | 'Stability' | 'NovelAI'
export const diffusionTypes: DiffusionType[] = ["Dalle", "Auto1111", "SDAPI", "Reborn", "Google", "Stability", "NovelAI"]
export type DiffusionCompletionConnectionTemplate = {
    id: string;
    key?: string;
    url?: string;
    model?: string;
    name?: string;
    type?: DiffusionType;
}

export type DalleModels = "dall-e-2" | "dall-e-3"
export const dalleModels: DalleModels[] = ["dall-e-2", "dall-e-3"]
export type DalleSize3 = '1024x1024' | '1792x1024' | '1024x1792'
export const dalleSizes3: DalleSize3[] = ["1024x1024", "1792x1024", "1024x1792"]
export type DalleSize2 = '256x256' | '512x512' | '1024x1024'
export const dalleSizes2: DalleSize2[] = ["256x256", "512x512", "1024x1024"]
export type DalleStyle = "vivid" | "natural";
export const dalleStyles: DalleStyle[] = ["vivid", "natural"];

export type DiffusionResponseObject = {
    url: string;
    revisedPrompt: string;
}

export type SettingsInterface = {
    id: string;
    name: string;
    rep_pen: number;
    rep_pen_range: number;
    rep_pen_slope: number;
    temperature: number;
    sampler_order: number[];
    top_k: number;
    top_p: number;
    top_a: number;
    min_p: number;
    presence_penalty: number;
    frequency_penalty: number;
    tfs: number;
    typical: number;
    singleline: boolean;
    sampler_full_determinism: boolean;
    min_tokens: number;
    context_length: number;
    max_tokens: number;
    mirostat_mode: number;
    mirostat_tau: number;
    mirostat_eta: number;
    instruct_mode: InstructMode;
}

export type CharacterInterface = {
    _id: string;
    name: string;
    avatar: string;
    description: string;
    personality: string;
    mes_example: string;
    creator_notes: string;
    system_prompt: string;
    post_history_instructions: string;
    tags: string[];
    creator: string;
    visual_description: string;
    thought_pattern: string;
    first_mes: string;
    alternate_greetings: string[];
    scenario: string;
}

export type Role = "System" | "Assistant" | "User";

export type InstructMode = "Alpaca" | "Vicuna" | "None" | "Metharme" | "Pygmalion";

export type Message = {
    userId: string;
    fallbackName: string;
    swipes: string[];
    currentIndex: number;
    role: Role;
    thought: boolean;
};

export type CompletionRequest = {
    lorebookid?: string;
    connectionid?: string | null;
    character: CharacterInterface | string;
    settingsid?: string | null;
    messages: Message[];
    persona?: UserPersona;
    args?: UsageArguments;
}

export interface UsageArguments {
    overrideSettings: string | null;
    overrideConnection: string | null;
    overrideInstruct: InstructMode | null;
    humanReplyChance: number | null;
    humanMentionReplyChance: number | null;
    botReplyChance: number | null;
    botMentionReplyChance: number | null;
    doThoughts: boolean | null;
    doSelfies: boolean | null;
    doEmotions: boolean | null;
    doSprites: boolean | null;
    doBackgrounds: boolean | null;
    doAnimations: boolean | null;
    doSounds: boolean | null;
    badWords: string[] | null;
    modelOverride: string | null;
    floatingGuidance: string | null;
}

export type TokenType = 'SentencePiece' | 'GPT';

export type EndpointType = 'Kobold' | 'OAI' | 'Horde' | 'P-Claude' | 'P-AWS-Claude' | 'PaLM' | 'OAI-Compliant-API' | 'Mancer' | 'OpenRouter'

export type CompletionType = 'Chat' | 'Text';

export interface DiscordConfig {
    id: string;
    apiKey: string;
    applicationId: string;
    photoUrl: string;
    name: string;
    configChannelId: string;
    logChannelId: string;
    sendLogMessages: boolean;
    sendReadyMessages: boolean;
    sendReminderMessages: boolean;
    allowDiffusion: boolean;
    allowChannelManagement: boolean;
    allowRoleManagement: boolean;
    allowUserManagement: boolean;
    allowDirectMessages: boolean;
    adminUsers: string[];
    adminRoles: string[];
    bannedUsers: string[];
    bannedRoles: string[];
    sendIsTyping: boolean;
    allowMultiCharacter: boolean;
    defaultCharacter: string;
}

export interface DiscordGlobalConfig {
    currentConfig: string;
    autoRestart: boolean;
}

export type tagCategory = 'formatting' | 'gender' | 'species' | 'personality' | 'physical' | 'role' | 'fandom' | 'setting' | 'fetish' | 'pov' | 'plot' | 'genre' | 'other' | 'none' | 'job' | 'relationship' | 'chatiness';

export type Tag = {
    name: string;
    description: string;
    category: tagCategory;
}

export const characterTags: Tag[] = [
    { name: "Human", description: "Human characters", category: "species" },
    { name: "Anthro", description: "Anthropomorphic characters", category: "species" },
    { name: "Neko", description: "Catgirls and catboys", category: "species" },
    { name: "First Person", description: "Characters who speak in first person", category: "pov" },
    { name: "Second Person", description: "Characters who speak in second person", category: "pov" },
    { name: "Third Person", description: "Characters who speak in third person", category: "pov" },
    { name: "Female", description: "Female characters", category: "gender" },
    { name: "Heroic", description: "Characters with heroic qualities", category: "personality" },
    { name: "Tall", description: "Characters who are notably tall", category: "physical" },
    { name: "Villain", description: "Characters serving as antagonists", category: "role" },
    { name: "Sci-Fi", description: "Characters from science fiction", category: "genre" },
    { name: "Horror", description: "Characters from horror", category: "genre" },
    { name: "Comedy", description: "Characters from comedy", category: "genre" },
    { name: "Romance", description: "Characters from romance", category: "genre" },
    { name: "Action", description: "Characters from action", category: "genre" },
    { name: "Adventure", description: "Characters from adventure", category: "genre" },
    { name: "Fantasy", description: "Characters from fantasy", category: "genre" },
    { name: "Urban", description: "Characters suited for urban settings", category: "setting" },
    { name: "Mystery", description: "Characters involved in mystery plots", category: "genre" },
    { name: "Fantasy", description: "Characters from fantasy genres", category: "genre" },
    { name: "Time-Traveler", description: "Characters capable of time travel", category: "other" },
    { name: "Historical", description: "Characters from historical settings", category: "setting" },
    { name: "Magical", description: "Characters with magical abilities", category: "other" },
    { name: "Furry", description: "Characters with animal features", category: "species" },
    { name: "Short", description: "Characters who are notably short", category: "physical" },
    { name: "Motherly", description: "Characters who are motherly", category: "personality" },
    { name: "Fatherly", description: "Characters who are fatherly", category: "personality" },
    { name: "Sisterly", description: "Characters who are sisterly", category: "personality" },
    { name: "Brotherly", description: "Characters who are brotherly", category: "personality" },
    { name: "Maid", description: "Characters who are maids", category: "job" },
    { name: "Butler", description: "Characters who are butlers", category: "job" },
    { name: "Nurse", description: "Characters who are nurses", category: "job" },
    { name: "Doctor", description: "Characters who are doctors", category: "job" },
    { name: "Teacher", description: "Characters who are teachers", category: "job" },
]

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

export type RoomMessage = {
    _id: string;
    timestamp: number;
    attachments: any[];
    embeds: any[];
    discordChannelId: string;
    discordGuildId: string;
    message: Message;
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
    args: UsageArguments;
}

export const NovelAIModels = ['nai-diffusion', 'safe-diffusion', 'nai-diffusion-furry', 'kandinsky-vanilla', 'nai-diffusion-2', 'nai-diffusion-3']
export type SamplerAlgorithim = "k_lms" | "k_euler" | "k_euler_ancestral" | "k_heun" | "plms" | "ddim" | "nai_smea" | "nai_smea_dyn" | "k_dpmpp_2m" | "k_dpmpp_2s_ancestral" | "k_dpmpp_sde" | "k_dpm_2" | "k_dpm_2_ancestral" | "k_dpm_adaptive" | "k_dpm_fast";
export const samplersArray = ["k_lms", "k_euler", "k_euler_ancestral", "k_heun", "plms", "ddim", "nai_smea", "nai_smea_dyn", "k_dpmpp_2m", "k_dpmpp_2s_ancestral", "k_dpmpp_sde", "k_dpm_2", "k_dpm_2_ancestral", "k_dpm_adaptive", "k_dpm_fast"];

export type AspectRatio = 'square' | 'landscape' | 'portrait';

export type Size = 'large' | 'small' | 'normal' | 'wallpaper';

export type SizePreset = {
    width: number;
    height: number;
    ratio: AspectRatio;
    size: Size;
    serviceName: string;
}

export const sizePresets: SizePreset[] = [
    { width: 832, height: 1216, ratio: 'portrait', size: 'normal', serviceName: 'NovelAI' },
    { width: 1216, height: 832, ratio: 'landscape', size: 'normal', serviceName: 'NovelAI' },
    { width: 1024, height: 1024, ratio: 'square', size: 'normal', serviceName: 'NovelAI' },
    { width: 1920, height: 1088, ratio: 'landscape', size: 'wallpaper', serviceName: 'NovelAI' },
    { width: 1088, height: 1920, ratio: 'portrait', size: 'wallpaper', serviceName: 'NovelAI' },
    { width: 1024, height: 1536, ratio: 'portrait', size: 'large', serviceName: 'NovelAI' },
    { width: 1536, height: 1024, ratio: 'landscape', size: 'large', serviceName: 'NovelAI' },
    { width: 1472, height: 1472, ratio: 'square', size: 'large', serviceName: 'NovelAI' },
    { width: 512, height: 768, ratio: 'portrait', size: 'small', serviceName: 'NovelAI' },
    { width: 768, height: 512, ratio: 'landscape', size: 'small', serviceName: 'NovelAI' },
    { width: 640, height: 640, ratio: 'square', size: 'small', serviceName: 'NovelAI' },
]

export type NovelAIUndesiredContentPreset = {
    value: number;
    name: string;
}

export const novelAIUndesiredContentPresets: NovelAIUndesiredContentPreset[] = [
    {
        value: 0,
        name: 'Heavy',
    },
    {
        value: 1,
        name: 'Light',
    },
    {
        value: 2,
        name: 'Human Focus'
    },
    {
        value: 3,
        name: 'None'
    },
];

export interface NovelAIRequest {
    prompt: string | null, 
    connectionId: string, 
    negative_prompt?: string, 
    height?: number, 
    width?: number, 
    guidance?: number, 
    sampler?: string, 
    steps?: number, 
    number_of_samples?: number,
    seed?: number,
    ucPreset?: number,
    model?: string,
}
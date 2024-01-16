import { ChatMessage } from "./discordBot.js";

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

export type CompletionRequest = {
    lorebookid?: string;
    connectionid?: string | null;
    character: CharacterInterface | string;
    settingsid?: string | null;
    messages: ChatMessage[];
    persona?: UserPersona;
    args?: UsageArguments;
}

export type TokenType = 'SentencePiece' | 'GPT';

export type EndpointType = 'Kobold' | 'OAI' | 'Horde' | 'P-Claude' | 'P-AWS-Claude' | 'PaLM' | 'OAI-Compliant-API' | 'Mancer' | 'OpenRouter'

export type CompletionType = 'Chat' | 'Text';

export type GenericCompletionConnectionTemplate = {
    id: string;
    key?: string;
    url?: string;
    model?: string;
    name?: string;
    legacy?: boolean;
    type?: EndpointType;
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

export type MancerSettingsInterface = {
    max_tokens: number;
    min_tokens: number;
    stream: boolean;
    temperature: number;
    top_p: number;
    top_k: number;
    top_a: number;
    typical_p: number;
    tff: number;
    repetition_penalty: number;
    ban_eos_token: boolean;
    frequency_penalty: number;
    presence_penalty: number;
    mirostat_mode: number;
    mirostat_tau: number;
    mirostat_eta: number;
}

export type OpenAIRole = 'system' | 'assistant' | 'system';

export interface OpenAIMessage {
    role: OpenAIRole;
    content: string;    
}

export type Role = "System" | "Assistant" | "User";

export type InstructMode = "Alpaca" | "Vicuna" | "None" | "Metharme" | "Pygmalion";

export class UserPersona{
    _id: string = (new Date().getTime()).toString();
    name: string = '';
    avatar: string = '';
    description: string = '';
    importance: 'high' | 'low' = 'high';

    constructor(name: string, avatar: string, description: string, importance: 'high' | 'low'){
        this.name = name;
        this.avatar = avatar;
        this.description = description;
        this.importance = importance;
    }

    toJSON(): any {
        return {
            _id: this._id,
            name: this.name,
            avatar: this.avatar,
            description: this.description,
            importance: this.importance,
        };
    }
}

export interface AppSettingsInterface {
    defaultConnection: string;
    defaultSettings: string;
    admins: string[];
    enableCaptioning: boolean;
    enableEmbedding: boolean;
    enableQuestionAnswering: boolean;
    enableZeroShotClassification: boolean;
    enableYesNoMaybe: boolean;
    defaultDiffusionConnection: string;
    jwtSecret: string;
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
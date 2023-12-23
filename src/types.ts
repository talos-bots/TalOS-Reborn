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

export type InstructMode = "Alpaca" | "Vicuna" | "None" | "Metharme";

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

export type EndpointType = 'Kobold' | 'OAI' | 'Horde' | 'P-Claude' | 'P-AWS-Claude' | 'PaLM' | 'OAI-Compliant-API' | 'Mancer'

export type CompletionType = 'Chat' | 'Text';
/* eslint-disable linebreak-style */
/* eslint-disable eol-last */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable linebreak-style */
/* eslint-disable indent */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line object-curly-spacing

import {Character} from "./Character.js";
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
    model: string;
    lorebookid: string;
    character: Character | string;
    preset: string;
    messages: Message[];
    persona: UserPersona;
}

export type BetaKeyConfig = {
    key: string;
    creator: string;
    created: Date;
    registeredUser: string;
    requests: number;
}

export class BetaKey implements BetaKeyConfig{
    constructor(
        public key: string = generateNewKey(),
        public creator: string = "",
        public created: Date = new Date(),
        public registeredUser: string = "",
        public requests: number = 0,
    ){}

    public toJSON(): BetaKeyConfig {
        return {
            key: this.key,
            creator: this.creator,
            created: this.created,
            registeredUser: this.registeredUser,
            requests: this.requests,
        };
    }
}

function generateNewKey(){
    const key = `wc-${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`;
    return key;
}
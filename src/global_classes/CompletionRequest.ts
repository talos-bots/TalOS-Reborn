/* eslint-disable linebreak-style */
/* eslint-disable eol-last */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable linebreak-style */
/* eslint-disable indent */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line object-curly-spacing

import {Character} from "./Character";

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
}
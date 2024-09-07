import { UsageArguments } from "../types";
import { Character, UserPersona } from "./Character";

export type Role = "System" | "Assistant" | "User";
export type InstructMode = "Alpaca" | "Vicuna" | "Mistral" | "None" | "Metharme";
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
  character: Character | string;
  settingsid?: string | null;
  messages: Message[];
  persona?: UserPersona;
  args?: UsageArguments;
}
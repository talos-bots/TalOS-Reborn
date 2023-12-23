import { Message, Role } from "../types";

export type CharacterMap = {
    characterId: string;
    connectionId: string;
    model: string;
    settingsId: string;
    role: Role;
}

export class Dataset{
    constructor(
        public name: string = "",
        public description: string = "",
        public messages: Message[] = [],
        public badWords: string[] = [""],
        public characters: CharacterMap[] = [],
        public systemPrompts: string[] = [""],
        public retries: number = 0,
        public badWordsGenerated: number = 0,
    ){}

    public static fromJson(json: any): Dataset{
        return new Dataset(
            json.name,
            json.description,
            json.messages,
            json.badWords,
            json.characters,
            json.systemPrompts,
            json.retries,
            json.badWordsGenerated,
        );
    }

    public toJson(): any{
        return {
            name: this.name,
            description: this.description,
            messages: this.messages,
            badWords: this.badWords,
            characters: this.characters,
            systemPrompts: this.systemPrompts,
            retries: this.retries,
            badWordsGenerated: this.badWordsGenerated,
        }
    }

    public static fromJsonArray(jsonArray: any[]): Dataset[]{
        return jsonArray.map(json => Dataset.fromJson(json));
    }

    public static toJsonArray(datasets: Dataset[]): any[]{
        return datasets.map(dataset => dataset.toJson());
    }

    public static fromJsonString(jsonString: string): Dataset[]{
        return Dataset.fromJsonArray(JSON.parse(jsonString));
    }

    setBadWords(badWords: string[]): void{
        this.badWords = badWords;
    }

    setMessages(messages: Message[]): void{
        this.messages = messages;
    }

    setCharacters(characters: CharacterMap[]): void{
        this.characters = characters;
    }

    setSystemPrompts(systemPrompts: string[]): void{
        this.systemPrompts = systemPrompts;
    }

    setRetries(retries: number): void{
        this.retries = retries;
    }

    setBadWordsGenerated(badWordsGenerated: number): void{
        this.badWordsGenerated = badWordsGenerated;
    }

    addBadWord(badWord: string): void{
        this.badWords.push(badWord);
    }

    addMessage(message: Message): void{
        this.messages.push(message);
    }

    addCharacter(character: CharacterMap): void{
        this.characters.push(character);
    }

    addSystemPrompt(systemPrompt: string): void{
        this.systemPrompts.push(systemPrompt);
    }

    removeBadWord(badWord: string): void{
        this.badWords = this.badWords.filter(word => word !== badWord);
    }

    removeMessage(message: Message): void{
        this.messages = this.messages.filter(msg => msg !== message);
    }

    removeCharacter(character: CharacterMap): void{
        this.characters = this.characters.filter(char => char !== character);
    }

    removeSystemPrompt(systemPrompt: string): void{
        this.systemPrompts = this.systemPrompts.filter(prompt => prompt !== systemPrompt);
    }

    getBadWords(): string[]{
        return this.badWords;
    }

    getMessages(): Message[]{
        return this.messages;
    }

    getCharacters(): CharacterMap[]{
        return this.characters;
    }

    getSystemPrompts(): string[]{
        return this.systemPrompts;
    }

    getRetries(): number{
        return this.retries;
    }

    getBadWordsGenerated(): number{
        return this.badWordsGenerated;
    }
}
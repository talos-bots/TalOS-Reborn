/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Character, UserPersona } from "./Character";
import { CompletionRequest, Message, Role } from "./CompletionRequest";
import { addStoredChatLog } from "../api/chatLogDB";

export class StoredChatLog {
    _id: string = new Date().getTime().toString();
    messages: StoredChatMessage[] = [];
    characters: string[] = [];
    firstMessageDate: number = new Date().getTime();
    lastMessageDate: number = new Date().getTime();
    name: string = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    userID: string = '';

    constructor(_id?: string, messages?: StoredChatMessage[], characters?: string[], firstMessageDate?: number, lastMessageDate?: number, name?: string, userID?: string) {
        this._id = _id || new Date().getTime().toString();
        this.messages = messages || [];
        this.characters = characters || [];
        this.firstMessageDate = firstMessageDate || new Date().getTime();
        this.lastMessageDate = lastMessageDate || new Date().getTime();
        this.name = name || `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        this.userID = userID || '';
    }

    addMessage(message: StoredChatMessage): void {
        if(!this.characters.includes(message.userId) && message.role === 'Assistant'){
            this.addCharacter(message.userId);
        }
        this.messages.push(message);
        this.lastMessageDate = message.timestamp;
    }

    addCharacter(character: string): void {
        this.characters.push(character);
    }

    getCharacters(): string[] {
        return this.characters;
    }

    getMessages(): StoredChatMessage[] {
        return this.messages;
    }

    getFirstMessageDate(): number {
        return this.firstMessageDate;
    }

    getLastMessageDate(): number {
        return this.lastMessageDate;
    }

    getCharacterCount(): number {
        return this.characters.length;
    }

    getMessageCount(): number {
        return this.messages.length;
    }

    getMessagesByRole(role: Role): StoredChatMessage[] {
        return this.messages.filter((message) => message.role === role);
    }

    getThoughtCount(): number {
        return this.messages.filter((message) => message.thought).length;
    }

    getThoughts(): StoredChatMessage[] {
        return this.messages.filter((message) => message.thought);
    }

    addSwipeToLastMessage(swipe: string): void {
        this.messages[this.messages.length - 1].addSwipe(swipe);
    }

    removeLastSwipeFromLastMessage(): void {
        this.messages[this.messages.length - 1].removeLastSwipe();
    }

    getLastMessage(): StoredChatMessage {
        return this.messages[this.messages.length - 1];
    }

    getUserFirstMessage(): StoredChatMessage {
        return this.messages[1];
    }

    toCompletionRequest(model: string = "mythomax", lorebook: string = "", preset: string = "StoryWriter"): CompletionRequest {
        return {
            model: model,
            lorebookid: lorebook,
            character: this.characters[0],
            preset: preset,
            messages: this.messages.map((message) => message.toMessage())
        }
    }

    async continueChatLogFromNewMessage(persona: UserPersona, message: string, character: Character){
        // if(!this.characters.includes(character._id)){
        //     this.addCharacter(character._id);
        // }
        // const preset = localStorage.getItem('preset') || 'storywriter';
        // const newUserMessage = StoredChatMessage.fromUserPersonaAndString(persona, message);
        // this.addMessage(newUserMessage);
        // const unparsedResponse = await sendCompletionRequest(model, this.messages, character, preset, 'lorebookid').then((response) => {
        //     console.log(response);
        //     return response;
        // }).catch((error) => {
        //     console.log(error);
        // });
        // if(unparsedResponse === null){
        //     return null;
        // }
        // const value = unparsedResponse?.completion?.choices[0]?.text.trim();
        // console.log(value);
        // const refinedResponse = breakUpCommands(character.name, value, persona?.name ?? auth.currentUser?.displayName, null, false);
        // const assistantResponse: Message = {
        //     userId: character._id,
        //     fallbackName: character.name,
        //     swipes: [refinedResponse],
        //     currentIndex: 0,
        //     role: 'Assistant',
        //     thought: false,
        // };
        // const storedAssistantResponse = StoredChatMessage.fromMessage(assistantResponse);
        // this.addMessage(storedAssistantResponse);
        // return this.toStoredChatLog();
    }

    public addSwipeByIndex(index: number, swipe: string): void {
        this.messages[index].addSwipe(swipe);
    }

    public async generateNewSwipe(persona: UserPersona, character: Character) {
        // const model = localStorage.getItem('modelid') || 'mythomax';
        // const preset = localStorage.getItem('preset') || 'storywriter';
        
        // // Reverse a copy of the array to search from the end
        // const reversedMessages = [...this.messages].reverse();
        // const reversedIndex = reversedMessages.findIndex((message) => message.role === 'Assistant' && message.userId === character._id);
        
        // // Adjust the index to map to the original array
        // const lastAssistantMessageIndex = reversedIndex !== -1 ? this.messages.length - 1 - reversedIndex : -1;
    
        // if (lastAssistantMessageIndex === -1) {
        //     // Handle the case where no matching message is found
        //     return null;
        // }
    
        // const messagesBeforeAssistant = this.messages.slice(0, lastAssistantMessageIndex + 1);
        // const unparsedResponse = await sendCompletionRequest(model, messagesBeforeAssistant, character, preset, 'lorebookid').then((response) => {
        //     console.log(response);
        //     return response;
        // }).catch((error) => {
        //     console.log(error);
        // });
    
        // if (unparsedResponse === null) {
        //     return null;
        // }
    
        // const value = unparsedResponse?.completion?.choices[0]?.text.trim();
        // console.log(value);
        // const refinedResponse = breakUpCommands(character.name, value, persona.name, null, false);
        // this.addSwipeByIndex(lastAssistantMessageIndex, refinedResponse);
        // return this.toStoredChatLog();
    }    

    public toStoredChatLog(): StoredChatLog {
        return new StoredChatLog(this._id, this.messages, this.characters, this.firstMessageDate, this.lastMessageDate);
    }

    toJSON(): any {
        return {
            _id: this._id,
            messages: this.messages.map((message) => message.toJSON()),
            characters: this.characters,
            firstMessageDate: this.firstMessageDate,
            lastMessageDate: this.lastMessageDate
        }
    }

    async saveToDB(): Promise<void> {
        try {
            await addStoredChatLog(this);
            console.log('ChatLog saved to the database successfully.');
        } catch (error) {
            console.error('Error saving ChatLog to the database:', error);
        }
    }

    public static fromJSON(json: any): StoredChatLog {
        const storedChatMessages = json?.messages?.map((message: any) => StoredChatMessage.fromJSON(message));
        return new StoredChatLog(json?._id, storedChatMessages, json?.characters, json?.firstMessageDate, json?.lastMessageDate, json?.name, json?.userID);
    }
}

export class StoredChatMessage implements Message{
    public userId: string;
    public fallbackName: string;
    public swipes: string[];
    public currentIndex: number;
    public role: Role;
    public thought: boolean;
    public timestamp: number = new Date().getTime();

    constructor(userId: string, fallbackName: string, swipes: string[], currentIndex: number, role: Role, thought: boolean) {
        this.userId = userId;
        this.fallbackName = fallbackName;
        this.swipes = swipes;
        this.currentIndex = currentIndex;
        this.role = role;
        this.thought = thought;
    }

    public static fromMessage(message: Message): StoredChatMessage {
        return new StoredChatMessage(message.userId, message.fallbackName, message.swipes, message.currentIndex, message.role, message.thought);
    }

    public toMessage(): Message {
        return {
            userId: this.userId,
            fallbackName: this.fallbackName,
            swipes: this.swipes,
            currentIndex: this.currentIndex,
            role: this.role,
            thought: this.thought
        }
    }

    public addSwipe(swipe: string): void {
        this.swipes.push(swipe);
        this.currentIndex++;
    }

    public removeLastSwipe(): void {
        this.swipes.pop();
        this.currentIndex--;
    }

    public getCurrentSwipe(): string {
        return this.swipes[this.currentIndex];
    }

    public swipeLeft(): void {
        if (this.currentIndex === 0) {
            return;
        }
        this.currentIndex--;
    }

    public swipeRight(): void {
        if (this.currentIndex === this.swipes.length - 1) {
            return;
        }
        this.currentIndex++;
    }

    public static fromUserPersonaAndString(persona: UserPersona | null, message: string, thought: boolean = false): StoredChatMessage {
        if(!persona?._id){
            return new StoredChatMessage('display-name', 'Test User', [message], 0, 'User', thought);
        }else{
            return new StoredChatMessage(persona._id, persona.name, [message], 0, 'User', thought);
        }
    }

    replacePlaceholders(name: string){
        this.swipes = this.swipes.map((swipe) => {
            return swipe.replaceAll('{{user}}', `${name}`).replaceAll('{{char}}', `${this.fallbackName}`)
        });

        return this;
    }

    toJSON(): any {
        return {
            userId: this.userId,
            fallbackName: this.fallbackName,
            swipes: this.swipes,
            currentIndex: this.currentIndex,
            role: this.role,
            thought: this.thought,
            timestamp: this.timestamp
        }
    }

    public static fromJSON(json: any): StoredChatMessage {
        return new StoredChatMessage(json?.userId, json?.fallbackName, json?.swipes, json?.currentIndex, json?.role, json?.thought);
    }
}
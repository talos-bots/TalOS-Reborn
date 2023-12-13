/* eslint-disable @typescript-eslint/no-explicit-any */
import { StoredChatMessage } from "./StoredChatLog";
import { VerificationInformation } from "./VerificationStatus";

export type Origin = 'Koios' | 'WyvernChat' | 'Discord';

export type gender = 'Male' | 'Female' | 'Non-Binary' | 'Other';
export class Character{
    constructor(
        public _id: string = (new Date().getTime()).toString(),
        public name: string = '',
        public avatar: string = '',
        public description: string = '',
        public personality: string = '',
        public mes_example: string = '',
        public creator_notes: string = '',
        public system_prompt: string = '',
        public post_history_instructions: string = '',
        public tags: string[] = [],
        public creator: string = '',
        public visual_description: string = '',
        public thought_pattern: string = '',
        public first_mes: string = '',
        public alternate_greetings: string[] = [],
        public scenario: string = '',
    ){}
    toCharacter(): Character {
        return this;
    }

    addTag(tag: string){
        this.tags.push(tag);
    }

    removeTag(tag: string){
        this.tags = this.tags.filter(t => t !== tag);
    }

    public createGreetingStoredMessage(): StoredChatMessage | null {
        if(this.first_mes.length > 0){
            if(this.alternate_greetings.length > 0){
                return new StoredChatMessage(this._id, this.name, [this.alternate_greetings[Math.floor(Math.random() * this.alternate_greetings.length)]], 0, 'Assistant', false);
            }else{
                return new StoredChatMessage(this._id, this.name, [this.first_mes], 0, 'Assistant', false);
            }
        }
        return null;
    }

    hasGreetings(): boolean {
        let hasFirstMes = false;
        if(this.first_mes.trim().length > 1){
            hasFirstMes = true;
        }
        let hasAlternateGreetings = false;
        if(this.alternate_greetings.length > 0 && this.alternate_greetings[0].trim().length > 1){
            hasAlternateGreetings = true;
        }
        return hasFirstMes || hasAlternateGreetings;
    }

    toJSON(): any {
        return {
            _id: this._id,
            name: this.name? this.name : '',
            avatar: this.avatar,
            description: this.description,
            personality: this.personality,
            mes_example: this.mes_example,
            creator_notes: this.creator_notes,
            system_prompt: this.system_prompt,
            post_history_instructions: this.post_history_instructions,
            tags: this.tags,
            creator: this.creator,
            visual_description: this.visual_description,
            thought_pattern: this.thought_pattern,
            first_mes: this.first_mes,
            alternate_greetings: this.alternate_greetings,
            scenario: this.scenario
        };
    }

    setName(name: string){
        this.name = name;
    }

    setAvatar(avatar: string){
        this.avatar = avatar;
    }

    setDescription(description: string){
        this.description = description;
    }

    setPersonality(personality: string){
        this.personality = personality;
    }

    setMesExample(mes_example: string){
        this.mes_example = mes_example;
    }

    setCreatorNotes(creator_notes: string){
        this.creator_notes = creator_notes;
    }

    setSystemPrompt(system_prompt: string){
        this.system_prompt = system_prompt;
    }

    setPostHistoryInstructions(post_history_instructions: string){
        this.post_history_instructions = post_history_instructions;
    }

    setTags(tags: string[]){
        this.tags = tags;
    }

    setCreator(creator: string){
        this.creator = creator;
    }

    setVisualDescription(visual_description: string){
        this.visual_description = visual_description;
    }

    setThoughtPattern(thought_pattern: string){
        this.thought_pattern = thought_pattern;
    }

    setFirstMes(first_mes: string){
        this.first_mes = first_mes;
    }

    setAlternateGreetings(alternate_greetings: string[]){
        this.alternate_greetings = alternate_greetings;
    }

    setScenario(scenario: string){
        this.scenario = scenario;
    }

    async save(): Promise<boolean> {
        // const character = this.toCharacter();
        // const isUpdate = await updateCharacter(character);
        return true;
    }
}

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
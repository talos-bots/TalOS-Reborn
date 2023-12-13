/* eslint-disable linebreak-style */
/* eslint-disable indent */
/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable space-before-blocks */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

    addTag(tag: string){
    this.tags.push(tag);
    }

    removeTag(tag: string){
    this.tags = this.tags.filter((t) => t !== tag);
    }

    toJSON(): any {
    return {
        _id: this._id,
        name: this.name? this.name : "",
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
        first_mes: this.first_mes,
        alternate_greetings: this.alternate_greetings,
        scenario: this.scenario,
    };
    }
}

export function getCharacterPromptFromConstruct(character: Character) {
    let prompt = '';
    if(character.description.trim().length > 0){
        prompt = character.description;
    }
    if(character.personality.trim().length > 0){
        prompt += character.personality;
    }
    if(character.mes_example.trim().length > 0){
        prompt += character.mes_example;
    }
    if(character.scenario.trim().length > 0){
        prompt += character.scenario;
    }
    return prompt;
}
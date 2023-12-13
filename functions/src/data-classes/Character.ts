/* eslint-disable linebreak-style */
/* eslint-disable indent */
/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable space-before-blocks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {VerificationInformation} from "./VerificationStatus.js";
import * as admin from 'firebase-admin';

export type Origin = 'Koios' | 'WyvernChat' | 'Discord';
export type gender = "Male" | "Female" | "Non-Binary" | "Other";
export class Character{
    constructor(
        public _id: string = (new Date().getTime()).toString(),
        public name: string = "",
        public avatar: string = "",
        public description: string = "",
        public personality: string = "",
        public species: string = "Human",
        public eye_color: string = "",
        public hair_color: string = "",
        public height: string = "",
        public weight: string = "",
        public skin_color: string = "",
        public gender: gender = "Other",
        public sexuality: string = "",
        public ethnicity: string = "",
        public family_description: string = "",
        public face_description: string = "",
        public body_description: string = "",
        public clothing_description: string = "",
        public mes_example: string = "",
        public creator_notes: string = "",
        public system_prompt: string = "",
        public post_history_instructions: string = "",
        public tags: string[] = [],
        public creator: string = "",
        public verification_info: VerificationInformation = new VerificationInformation(),
        public journalEntries: number = 0,
        public tagline: string = "",
        public firstName: string = "",
        public lastName: string = "",
        public middleName: string = "",
        public backgroundURL: string = "",
        public grade: number = 0,
        public visual_description: string = "",
        public thought_pattern: string = "",
        public ooc_blurbs: string[] = [],
        public canon: boolean = false,
        public votes: string[] = [],
        public first_mes: string = "",
        public alternate_greetings: string[] = [],
        public scenario: string = "",
        public nsfw: boolean = false,
        public origin: Origin = 'Koios',
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
        species: this.species? this.species : "Human",
        eye_color: this.eye_color,
        hair_color: this.hair_color,
        height: this.height,
        weight: this.weight,
        skin_color: this.skin_color,
        gender: this.gender,
        sexuality: this.sexuality,
        ethnicity: this.ethnicity,
        family_description: this.family_description,
        face_description: this.face_description,
        body_description: this.body_description,
        clothing_description: this.clothing_description,
        mes_example: this.mes_example,
        creator_notes: this.creator_notes,
        system_prompt: this.system_prompt,
        post_history_instructions: this.post_history_instructions,
        tags: this.tags,
        creator: this.creator,
        verification_info: this.verification_info instanceof VerificationInformation ? this.verification_info.toJSON() : this.verification_info as object,
        journalEntries: this.journalEntries,
        tagline: this.tagline,
        firstName: this.firstName,
        lastName: this.lastName,
        middleName: this.middleName,
        backgroundURL: this.backgroundURL,
        grade: this.grade,
        visual_description: this.visual_description,
        thought_pattern: this.thought_pattern,
        ooc_blurbs: this.ooc_blurbs,
        canon: this.canon,
        votes: this.votes,
        first_mes: this.first_mes,
        alternate_greetings: this.alternate_greetings,
        scenario: this.scenario,
        origin: this.origin,
    };
    }
}

export async function getCharacter(id: string): Promise<Character | null> {
    const db = admin.firestore();
    const characterCollection = await db.collection('characters').get()
    const characterDoc = characterCollection.docs.find((doc) => doc.data()._id === id);
    if(characterDoc.exists){
        const retrievedCharacter = new Character(
            characterDoc.data()._id,
            characterDoc.data().name,
            characterDoc.data().avatar,
            characterDoc.data().description,
            characterDoc.data().personality,
            characterDoc.data().species ? characterDoc.data().species : 'Human',
            characterDoc.data().eye_color,
            characterDoc.data().hair_color,
            characterDoc.data().height,
            characterDoc.data().weight,
            characterDoc.data().skin_color,
            characterDoc.data().gender,
            characterDoc.data().sexuality,
            characterDoc.data().ethnicity,
            characterDoc.data().family_description,
            characterDoc.data().face_description,
            characterDoc.data().body_description,
            characterDoc.data().clothing_description,
            characterDoc.data().mes_example,
            characterDoc.data().creator_notes,
            characterDoc.data().system_prompt,
            characterDoc.data().post_history_instructions,
            characterDoc.data().tags,
            characterDoc.data().creator,
            characterDoc.data().verification_info,
            characterDoc.data().journalEntries,
            characterDoc.data().tagline,
            characterDoc.data().firstName,
            characterDoc.data().lastName,
            characterDoc.data().middleName,
            characterDoc.data().backgroundURL,
            characterDoc.data().grade,
            characterDoc.data().visual_description,
            characterDoc.data().thought_pattern,
            characterDoc.data().ooc_blurbs,
            characterDoc.data().canon,
            characterDoc.data().votes,
            characterDoc.data().first_mes,
            characterDoc.data().alternate_greetings,
            characterDoc.data().scenario,
        );
        return retrievedCharacter;
    }else{
        return null;
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
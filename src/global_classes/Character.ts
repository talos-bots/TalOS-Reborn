/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuth } from "firebase/auth";
import { updateCharacter } from "../firebase_api/characterAPI";
import { StoredChatMessage } from "./StoredChatLog";
import { VerificationInformation } from "./VerificationStatus";
import { firebaseApp } from "../firebase-config";

export type Origin = 'Koios' | 'WyvernChat' | 'Discord';

export type gender = 'Male' | 'Female' | 'Non-Binary' | 'Other';
export class Character{
    constructor(
        public _id: string = (new Date().getTime()).toString(),
        public name: string = '',
        public avatar: string = '',
        public description: string = '',
        public personality: string = '',
        public species: string = 'Human',
        public eye_color: string = '',
        public hair_color: string = '',
        public height: string = '',
        public weight: string = '',
        public skin_color: string = '',
        public gender: gender = 'Other',
        public sexuality: string = '',
        public ethnicity: string = '',
        public family_description: string = '',
        public face_description: string = '',
        public body_description: string = '',
        public clothing_description: string = '',
        public mes_example: string = '',
        public creator_notes: string = '',
        public system_prompt: string = '',
        public post_history_instructions: string = '',
        public tags: string[] = [],
        public creator: string = '',
        public verification_info: VerificationInformation = new VerificationInformation(),
        public journalEntries: number = 0,
        public tagline: string = '',
        public firstName: string = '',
        public lastName: string = '',
        public middleName: string = '',
        public backgroundURL: string = '',
        public grade: number = 0,
        public visual_description: string = '',
        public thought_pattern: string = '',
        public ooc_blurbs: string[] = [],
        public canon: boolean = false,
        public votes: string[] = [],
        public first_mes: string = '',
        public alternate_greetings: string[] = [],
        public scenario: string = '',
        public nsfw: boolean = false,
        public origin: Origin = 'WyvernChat',
        public votesCount: number = 0,
    ){
        this.votesCount = votes?.length;
    }
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
            species: this.species? this.species : 'Human',
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
            nsfw: this.nsfw,
            origin: this.origin,
            votesCount: this.votesCount,
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

    setSpecies(species: string){
        this.species = species;
    }

    setEyeColor(eye_color: string){
        this.eye_color = eye_color;
    }

    setHairColor(hair_color: string){
        this.hair_color = hair_color;
    }

    setHeight(height: string){
        this.height = height;
    }

    setWeight(weight: string){
        this.weight = weight;
    }

    setFamilyDescription(family_description: string){
        this.family_description = family_description;
    }

    setFaceDescription(face_description: string){
        this.face_description = face_description;
    }

    setBodyDescription(body_description: string){
        this.body_description = body_description;
    }

    setClothingDescription(clothing_description: string){
        this.clothing_description = clothing_description;
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

    setVerificationInfo(verification_info: VerificationInformation){
        this.verification_info = verification_info;
    }

    setJournalEntries(journalEntries: number){
        this.journalEntries = journalEntries;
    }

    setTagline(tagline: string){
        this.tagline = tagline;
    }

    setFirstName(firstName: string){
        this.firstName = firstName;
    }

    setLastName(lastName: string){
        this.lastName = lastName;
    }

    setMiddleName(middleName: string){
        this.middleName = middleName;
    }

    setBackgroundURL(backgroundURL: string){
        this.backgroundURL = backgroundURL;
    }

    setGrade(grade: number){
        this.grade = grade;
    }

    setVisualDescription(visual_description: string){
        this.visual_description = visual_description;
    }

    setThoughtPattern(thought_pattern: string){
        this.thought_pattern = thought_pattern;
    }

    setOOCBlurbs(ooc_blurbs: string[]){
        this.ooc_blurbs = ooc_blurbs;
    }

    setCanon(canon: boolean){
        this.canon = canon;
    }

    setVotes(votes: string[]){
        this.votes = votes;
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

    setNSFW(nsfw: boolean){
        this.nsfw = nsfw;
    }

    setOrigin(origin: Origin){
        this.origin = origin;
    }

    setEthnicity(ethnicity: string){
        this.ethnicity = ethnicity
    }

    setSkinColor(skinColor: string){
        this.skin_color = skinColor;
    }

    setGender(gender: gender){
        this.gender = gender;
    }

    setSexuality(sexuality: string){
        this.sexuality = sexuality;
    }

    async save(): Promise<boolean> {
        const auth = getAuth(firebaseApp);
        if(auth.currentUser === null){
            return Promise.reject('No user logged in');
        }
        const character = this.toCharacter();
        if(character.creator === ''){
            character.creator = auth.currentUser.uid;
        }
        const isUpdate = await updateCharacter(character);
        return isUpdate;
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
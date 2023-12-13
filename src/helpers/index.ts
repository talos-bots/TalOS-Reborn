/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryDocumentSnapshot } from "firebase/firestore";
import { Character } from "../global_classes/Character";
import { StoredChatLog, StoredChatMessage } from "../global_classes/StoredChatLog";

export function resizeImage(file: File) {
    return new Promise((resolve, reject) => {
        const maxWidth = 256;
        const maxHeight = 256;
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate the new dimensions
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Draw the resized image
            ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(blob => {
                    const resizedFile = new File([blob], file.name, {
                        type: 'image/png',
                        lastModified: Date.now()
                    });
                    resolve(resizedFile);
                }, 'image/png');
            };
            img.src = event.target.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function firestoreDocToCharacter(doc: QueryDocumentSnapshot) {
    const data = doc.data();
    const retrievedCharacter = new Character(
        data._id,
        data.name,
        data.avatar,
        data.description,
        data.personality,
        data.mes_example,
        data.creator_notes,
        data.system_prompt,
        data.post_history_instructions,
        data.tags,
        data.creator,
        data.visual_description,
        data.thought_pattern,
        data.first_mes,
        data.alternate_greetings,
        data.scenario,
    );
    return retrievedCharacter;
}

export async function getCurrentEngine(){
    const model = localStorage.getItem('modelid') || 'mytholite';
    return model;
}

export function getCurrentPreset(){
    const preset = localStorage.getItem('preset') || 'storywriter';
    return preset;
}

export function setNewLogicEngine(model: string){
    if(model === 'mythomax' || model === 'weaver-alpha' || model === 'synthia-70b' || model === 'goliath-120b' || model === 'mythalion'){
        localStorage.setItem('modelid', model);
    }else {
        localStorage.setItem('modelid', 'mythomax');
    }
}

export function setPreset(preset: string){
    localStorage.setItem('preset', preset);
}

export function determineModel(model: string){
    switch(model){
        case "weaver-alpha":
            return {
                'instruct': 'Alpaca',
                'token_limit': 8000,
            }
        case "synthia-70b":
            return {
                'instruct': 'Vicuna',
                'token_limit': 8192,
            }
        case "mythomax":
            return {
                'instruct': 'Alpaca',
                'token_limit': 8192,
            }
        case "goliath-120b":
            return {
                'instruct': 'Vicuna',
                'token_limit': 6144,
            }
        case "mythalion":
            return {
                'instruct': 'Metharme',
                'token_limit': 8192,
            }
        default:
            return {
                'instruct': 'None',
                'token_limit': 4096,
            }
    }
}

export function firestoreDocToChat(doc: QueryDocumentSnapshot) {
    const data = doc.data();
    const retrievedChat = new StoredChatLog(
        data._id,
        data.messages.map((message: any) => {
            return StoredChatMessage.fromJSON(message);
        }),
        data.characters,
        data.firstMessageDate,
        data.lastMessageDate,
        data.name,
        data.userID,    
    );
    return retrievedChat;
}

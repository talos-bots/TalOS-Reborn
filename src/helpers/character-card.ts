/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import exifr from 'exifr'
// @ts-ignore
import extract from 'png-chunks-extract';
// @ts-ignore
import PNGtext from 'png-chunk-text';
// @ts-ignore
import { encode } from 'png-chunk-text';
// @ts-ignore
import encodePng from 'png-chunks-encode';
import { Character } from '../global_classes/Character';
import { useEffect, useState } from 'react';

export const useWindowSize = () => {
    const [size, setSize] = useState([0, 0]);
    useEffect(() => {
        const updateSize = () => {
            setSize([window.innerWidth, window.innerHeight]);
        };
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
};

export const importTavernCharacter = (file: File): Promise<Character> => {
    return new Promise((resolve, reject) => {
        console.log("Parsing Tavern Card");

        exifr.parse(file).then(async (metadata) => {
            console.log("Tavern Card Parsed");
            if (metadata) {
                const isCardV2 = metadata.chara;
                if (isCardV2) {
                    console.log("New Tavern Card Detected");
                    const decodedString = atob(metadata.chara);
                    const cardSpec = JSON.parse(decodedString);
                    let characterData;
                    if (cardSpec?.data !== undefined) {
                        characterData = cardSpec.data;
                    } else {
                        console.log("Old Tavern Card Detected");
                        characterData = cardSpec;
                    }
                    console.log(characterData);
                    const construct = await processCharacterData(characterData, );
                    resolve(construct);
                } else {
                    tryParseOldCard(file).then((construct) => {
                        if (construct) {
                            resolve(construct);
                        } else {
                            reject(new Error("Failed to parse old card"));
                        }
                    });
                }
            }
        }).catch((error) => {
            console.log("Tavern Card Parse Failed", error);
            tryParseOldCard(file).then((construct) => {
                console.log("Exif parser failure. Trying old parser");
                if (construct) {
                    resolve(construct);
                } else {
                    reject(new Error("Failed to parse old card"));
                }
            }).catch((error) => {
                console.log("Old Tavern Card Parse Failed", error);
                reject(error);
            });
        });
    });
};


async function processCharacterData(characterData: any): Promise<Character> {
    console.log(characterData);
    if(characterData?.data !== undefined){
        characterData = characterData.data;
    }
    const construct = new Character();
    construct.name = (characterData.name || '').replaceAll('\r', '');
    construct.scenario = (characterData.scenario || '').replaceAll('\r', '');

    // Construct personality field by filtering out empty or null parts
    const personalityParts = [
        characterData.personality,
        characterData.mes_example,
        characterData.description
    ].filter(part => part && part.trim().length > 0);
    construct.personality = personalityParts.join('\n').replaceAll('\r', '');

    if (characterData.first_mes && characterData.first_mes.trim().length > 0) {
        construct.setFirstMes(characterData.first_mes.replaceAll('\r', ''));
    }

    if (characterData.alternate_greetings && characterData.alternate_greetings.length > 0) {
        characterData.alternate_greetings.forEach((greeting: string) => {
            construct.alternate_greetings.push(greeting.replaceAll('\r', ''));
        });
    }
    if(characterData.thought_pattern && characterData.thought_pattern.trim().length > 0){
        construct.thought_pattern = characterData.thought_pattern.replaceAll('\r', '')
    }

    if(characterData.visual_description && characterData.visual_description.trim().length > 0){
        construct.visual_description = characterData.visual_description.replaceAll('\r', '')
    }

    if(characterData.system_prompt && characterData.system_prompt.trim().length > 0){
        construct.system_prompt = characterData.system_prompt.replaceAll('\r', '')
    }
    return construct;
}
interface Chunk {
    name: string;
    data: any; // Replace 'any' with a more specific type if possible
}

const tryParseOldCard = (file: File): Promise<Character | void> => {
    console.log("Old Tavern Card Detected");
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            if (event.target && event.target.result instanceof ArrayBuffer) {
                const arrayBuffer = event.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                const chunks: Chunk[] = extract(uint8Array);
                
                const textChunks = chunks.filter((chunk: Chunk) => chunk.name === 'tEXt').map((chunk: Chunk) => {
                    return PNGtext.decode(chunk.data);
                });
                
                if (textChunks.length > 0) {
                    try {
                        const decodedString = decodeBase64(textChunks[0].text);
                        const _json = JSON.parse(decodedString);
                        const construct = await processCharacterData(_json);
                        resolve(construct);
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        reject(error);
                    }
                } else {
                    reject();
                }
            }
        };
      
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            reject(error);
        };
      
        reader.readAsArrayBuffer(file);
    });
};

const decodeBase64 = (base64String: string) => {
    const text = atob(base64String);
    return decodeURIComponent(escape(text));
};

export async function createTavernCardV2(construct: Character): Promise<any> {
    const data = {
        name: construct.name,
        description: "",
        personality: construct.personality,
        scenario: construct.scenario,
        first_mes: construct.first_mes,
        thought_pattern: construct.thought_pattern || "",
        visual_description: construct.visual_description || "",
        mes_example: construct.mes_example || "",
        creator_notes: construct.creator_notes || "",
        system_prompt: construct.system_prompt || "",
        post_history_instructions: construct.post_history_instructions || "",
        alternate_greetings: construct.alternate_greetings || [],
        character_book: undefined,
        tags: construct.tags || [],
        creator: construct.creator || "",
        character_version: "2",
        extensions: {},
    };

    return {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data,
    };
}

export async function saveTavernCardAsImage(construct: Character) {
    const tavernCardV2 = await createTavernCardV2(construct);
    const jsonString = JSON.stringify(tavernCardV2);
    const base64String = btoa(unescape(encodeURIComponent(jsonString)));
  
    // Convert data URI to Blob
    const imageBlob = await fetch(construct.avatar).then((r) => r.blob());

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await imageBlob.arrayBuffer();

    // Convert ArrayBuffer to Uint8Array
    const int8Array = new Uint8Array(arrayBuffer);

    // Extract existing chunks from the PNG
    let chunks = extract(int8Array);
  
    // Check if the last chunk is the IEND chunk
    let iendChunk;
    if (chunks[chunks.length - 1].name === 'IEND') {
        iendChunk = chunks.pop();
    } else {
        throw new Error("PNG Decode Error: PNG ended prematurely, missing IEND header");
    }
    chunks = chunks.filter((chunk: Chunk) => chunk.name !== 'tEXt');

    // Create a new text chunk
    const textChunk = await encode('chara', base64String);
    chunks.push(textChunk);
    // Re-add the IEND chunk
    if (iendChunk) {
        chunks.push(iendChunk);
    }
  
    // Recompile the PNG with the new chunks
    const newData = await encodePng(chunks);
  
    // Convert the new data to a Blob
    const newBlob = new Blob([newData], { type: 'image/png' });
  
    // Save the Blob to a file
    const download = URL.createObjectURL(newBlob);
    return download;
}
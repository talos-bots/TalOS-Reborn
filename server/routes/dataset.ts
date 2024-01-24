import express from 'express';
import fs from "fs";
import path from "path";
import { datasetsPath } from '../server.js';
import { CharacterInterface, CompletionRequest, DatasetInterface, UserPersona } from '../typings/types.js';
import { Message } from '../typings/types.js';
import { fetchCharacterById } from './characters.js';
import { handleCompletionRequest } from './llms.js';
import { breakUpCommands, getRandomSystemPrompt } from '../helpers/index.js';
export const datasetsRouter = express.Router();

// get all datasets from the ../data/datasets/ folder
function fetchAllDatasets(): DatasetInterface[] {
    const datasetFolderPath = path.join(datasetsPath);
    const datasetFiles = fs.readdirSync(datasetFolderPath);
    const datasetData = datasetFiles.map((file) => {
        if(!file.endsWith(".json")) return;
        const filePath = path.join(datasetFolderPath, file);
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    });
    return datasetData;
}

datasetsRouter.get('/datasets', (req, res) => {
    const datasetData = fetchAllDatasets();
    res.send(datasetData);
});

// save a dataset to the ../data/datasets/ folder
function saveDataset(dataset: DatasetInterface) {
    const datasetFolderPath = path.join(datasetsPath);
    const filePath = path.join(datasetFolderPath, `${dataset.id}.json`);
    const datasetJson = JSON.stringify(dataset, null, 4); // Pretty print the JSON
    fs.writeFileSync(filePath, datasetJson, "utf-8");
}

datasetsRouter.post('/save/dataset', (req, res) => {
    const dataset = req.body;
    saveDataset(dataset);
    res.send({ message: "Dataset saved successfully!" });
});

// get a dataset by id from the ../data/datasets/ folder
function fetchDatasetById(id: string): DatasetInterface | null {
    const datasetFolderPath = path.join(datasetsPath);
    const filePath = path.join(datasetFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    } else {
        return null; // or handle the error as needed
    }
}

datasetsRouter.get('/datasets/:id', (req, res) => {
    const id = req.params.id;
    const dataset = fetchDatasetById(id);
    if (dataset) {
        res.send(dataset);
    } else {
        res.status(404).send({ message: "Dataset not found" });
    }
});

//remove a dataset by id from the ../data/datasets/ folder
function removeDatasetById(id: string) {
    const datasetFolderPath = path.join(datasetsPath);
    const filePath = path.join(datasetFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    } else {
        return null; // or handle the error as needed
    }
}

datasetsRouter.delete('/datasets/:id', (req, res) => {
    const id = req.params.id;
    removeDatasetById(id);
    res.send({ message: "Dataset removed successfully!" });
});

function compareMessageSets(a: Message[], b: Message) {
    // find out if the content of the message already exists in the dataset
    const aMessages = a.map((message) => {
        return message.swipes[0];
    });
    const bMessages = b.swipes[0];
    return aMessages.includes(bMessages);
}

async function generateData(dataset: DatasetInterface): Promise<DatasetInterface | undefined>{
    try {
        let newDataset = dataset;
        console.log('Generating data for dataset');
        const messages: Message[] = newDataset.messages as Message[];
        console.log('Fetching characters');
        let characters: CharacterInterface[] = [];
        for(let i = 0; i < newDataset.characters.length; i++){
            console.log(`Fetching character ${newDataset.characters[i].characterId}`);
            await fetchCharacterById(newDataset.characters[i].characterId).then((character) => {
                if(character)
                characters.push(character);
            });
        }
        console.log('Generating responses');
        const badWords = newDataset.badWords.filter((word) => {
            return word !== '';
        });
        let retries = newDataset.retries;
        let badWordsGenerated = newDataset.badWordsGenerated;
        let messagesCount = newDataset.messages.length;
        const stopList = [];
        for(let i = 0; i < characters.length; i++){
            stopList.push(`${characters[i].name}:`);
        }
        if(messagesCount !== 0){
            const lastMessage = messages[messagesCount - 1];
            // if the last message is from the first character, reverse the order of the characters
            if(lastMessage.userId === characters[0]._id){
                characters = characters.reverse();
            }
        }
        for(let i = 0; i < characters.length; i++){
            const character = characters[i];
            const characterMap = newDataset.characters.find((characterMap) => {
                return characterMap.characterId === character._id;
            });
            if(!characterMap) continue;
            console.log(`Generating responses for ${character.name}`);
            //get the next character in the list or the first one if we're at the end
            const nextCharacter = characters[(i + 1) % characters.length];
            const completionRequest: CompletionRequest = {
                character: character,
                messages: messages,
                settingsid: characterMap.settingsId,
                connectionid: characterMap.connectionId,
                persona: {
                    name: nextCharacter.name,
                    description: '',
                    _id: nextCharacter._id,
                    importance: 'low',
                    avatar: nextCharacter.avatar,
                } as UserPersona,
                args: {
                    modelOverride: newDataset.characters[i].model,
                    floatingGuidance: newDataset.systemPrompts[Math.floor(Math.random() * newDataset.systemPrompts.length)],
                }
            };
            let tries = 0;
            let unfinished = true;
            let value = '';
            let refinedResponse = '';
            while(unfinished && tries <= 3){
                try {
                    const unparsedResponse = await handleCompletionRequest(completionRequest);
                    if(unparsedResponse === null){
                        throw new Error('Failed to generate response');
                    }
                    console.log(unparsedResponse);
                    if(unparsedResponse?.choices[0]?.text === undefined){
                        throw new Error('Failed to generate response');
                    }
                    value = unparsedResponse?.choices[0]?.text.trim();
                    refinedResponse = breakUpCommands(character.name, value, nextCharacter.name, stopList, false);
                    tries++;
                    for(let i = 0; i < badWords.length; i++){
                        if(refinedResponse.toLowerCase().includes(badWords[i].trim().toLowerCase())){
                            refinedResponse = '';
                            tries = 0;
                            badWordsGenerated++;
                            retries++;
                        }
                    }
                    if(refinedResponse !== ''){
                        unfinished = false;
                    }
                } catch (error) {
                    console.error('Error during response generation:', error);
                    tries++;
                }
            }
            if(refinedResponse === ''){
                throw new Error('Failed to generate response');
            }
            const message: Message = {
                userId: character._id,
                fallbackName: character.name,
                swipes: [refinedResponse],
                currentIndex: 0,
                role: characterMap.role,
                thought: false,
            };
            if(compareMessageSets(messages, message)){
                tries = 0;
                unfinished = true;
                retries++;
                refinedResponse = '';
            } else {
                messages.push(message);
                messagesCount = messages.length;
            }
        }
        newDataset = {...newDataset, messages: messages};
        newDataset = {...newDataset, retries: retries};
        newDataset = {...newDataset, badWordsGenerated: badWordsGenerated};
        saveDataset(dataset);
        return dataset;
    } catch (error) {
        console.error('Error generating data for dataset:', error);
    }
}

datasetsRouter.post('/generate/dataset', async (req, res) => {
    const dataset = req.body.dataset;
    const batches = req.body.batches;
    let generatedDataset = dataset;
    for(let i = 0; i < batches; i++){
        // if the batches are greater than 5, if the current batch is divisible by 5, insert a system note
        if(batches > 5 && i % 5 === 0){
            const systemNote: Message = {
                userId: 'system',
                fallbackName: 'System',
                swipes: [`[${getRandomSystemPrompt()}]`],
                currentIndex: 0,
                role: 'System',
                thought: false,
            };
            generatedDataset.messages.push(systemNote);
        }
        const newData = await generateData(generatedDataset);
        if(!newData){
            res.status(500).send({ message: "Failed to generate data for dataset" });
            return;
        }
        generatedDataset = newData;
    }   
    res.send(generatedDataset);
});
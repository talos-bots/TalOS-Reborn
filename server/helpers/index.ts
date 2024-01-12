import axios from "axios";
import { uploadsPath } from "../server.js";
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { Message } from "discord.js";
import { RoomMessage } from "../typings/discordBot.js";
import { Role } from "../routes/connections.js";

export async function base642Buffer(base64: string): Promise<string| Buffer> {
	let buffer: Buffer;
	// Check if the input is in data URL format
	if(base64.includes('/images')){
		base64= await getImageFromURL(base64);
	}
	const match = base64.match(/^data:image\/[^;]+;base64,(.+)/);

	if (match) {
		// Extract the actual base64 string
		const actualBase64 = match[1];
		// Convert the base64 string into a Buffer
		buffer = Buffer.from(actualBase64, 'base64');
	} else {
		// If the input is not in data URL format, assume it is already a plain base64 string
		try {
			buffer = Buffer.from(base64, 'base64');
		} catch (error) {
			// Handle errors (e.g., invalid base64 string)
			console.error('Invalid base64 string:', error);
			return base64;
		}
	}

	// Create form data
	const form = new FormData();
	form.append('file', buffer, {
		filename: 'file.png', // You can name the file whatever you like
		contentType: 'image/png', // Be sure this matches the actual file type
	});

	try {
		// Upload file to file.io
		const response = await axios.post('https://file.io', form, {
		headers: {
			...form.getHeaders()
		}
		});
		if (response.status !== 200) {
		// Handle non-200 responses
		console.error('Failed to upload file:', response.statusText);
		return buffer;
		}
		return response.data.link;
	} catch (error) {
		// Handle errors (e.g., upload failed)
		console.error('Failed to upload file:', error);
		return buffer;
	}
}

export async function getImageFromURL(url: string): Promise<string> {
    const filePath = path.join(uploadsPath, url.split('/images/')[1]);
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const buffer = await fs.promises.readFile(filePath);
    return buffer.toString('base64');
}

export function convertDiscordMessageToRoomMessage(message: Message): RoomMessage {
    return {
        _id: message.id,
        timestamp: message.createdTimestamp,
        attachments: message.attachments.toJSON(),
        embeds: message.embeds,
        discordChannelId: message.channel.id,
        discordGuildId: message.guild?.id || '',
        message: {
            userId: message.author.id,
            fallbackName: message.author.username,
            swipes: [message.cleanContent],
            currentIndex: 0,
            role: 'User',
            thought: false
        }
    }
}


export function breakUpCommands(charName: string, commandString: string, user = 'You', stopList: string[] = [], doMultiLine: boolean = false): string {
    const lines = commandString.split('\n').filter((line) => {
        return line.trim() !== '';
    });
    const formattedCommands = [];
    let currentCommand = '';
    let isFirstLine = true;
    
    if (doMultiLine === false){
        let command = lines.join(' ');
        if(command.trim() === ''){
            if(lines.length > 1){
                command = lines[1];
            }
        }
        return command.replaceAll('<start>', '').replaceAll('<end>', '').replaceAll('###', '').replaceAll('<user>', '').replaceAll('user:', '').replaceAll('USER:', '').replaceAll('ASSISTANT:', '').replaceAll('<|user|>', '').replaceAll('<|model|>', '').replaceAll(`${charName}: `, '');
    }
    
    for (let i = 0; i < lines.length; i++) {
        // If the line starts with a colon, it's the start of a new command
        const lineToTest = lines[i].toLocaleLowerCase();
        
        if (lineToTest.startsWith(`${user.toLocaleLowerCase()}:`) || lineToTest.startsWith('you:') || lineToTest.startsWith('<start>') || lineToTest.startsWith('<end>') || lineToTest.startsWith('<user>') || lineToTest.toLocaleLowerCase().startsWith('user:')) {
          break;
        }
        
        if (stopList !== null) {
            for(let j = 0; j < stopList.length; j++){
                if(lineToTest.startsWith(`${stopList[j].toLocaleLowerCase()}`)){
                    break;
                }
            }
        }
        
        if (lineToTest.startsWith(`${charName}:`)) {
            isFirstLine = false;
            if (currentCommand !== '') {
                // Push the current command to the formattedCommands array
                currentCommand = currentCommand.replaceAll(`${charName}:`, '')
                formattedCommands.push(currentCommand.trim());
            }
            currentCommand = lines[i];
        } if(lineToTest.includes(':') && i >= 1){ // if the line has a colon, it's a new message from a different user. Return commands up to this point
            return formattedCommands.join('\n');
        } else {
            if (currentCommand !== '' || isFirstLine){
                currentCommand += (isFirstLine ? '' : '\n') + lines[i];
            }
            if (isFirstLine) isFirstLine = false;
        }
    }
    
    // Don't forget to add the last command
    if (currentCommand !== '') {
        formattedCommands.push(currentCommand.replaceAll(`${charName}:`, ''));
    }
    const removedEmptyLines = formattedCommands.filter((command) => {
        return command.trim() !== '';
    });
    const final = removedEmptyLines.join('\n');
    return final.replaceAll('<start>', '').replaceAll('<end>', '').replaceAll('###', '').replaceAll('<user>', '').replaceAll('user:', '').replaceAll('USER:', '').replaceAll('ASSISTANT:', '').replaceAll('<|user|>', '').replaceAll('<|model|>', '').replaceAll(`${charName}: `, '');
}
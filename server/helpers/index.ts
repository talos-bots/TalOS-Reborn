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
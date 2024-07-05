import axios from "axios";
import { uploadsPath } from "../server.js";
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { Message } from "discord.js";
import { RoomMessage } from "../typings/discordBot.js";
import JSZip from 'jszip';

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

export function removeSymbolsBasedOnFirstOccurrence(input: string): string {
    const firstAsteriskIndex = input.indexOf('*');
    const firstQuoteIndex = input.indexOf('"');

    if (firstAsteriskIndex === -1 && firstQuoteIndex === -1) {
        return input; // Return the original string if neither symbol is found
    }

    if ((firstAsteriskIndex !== -1 && firstQuoteIndex === -1) || (firstAsteriskIndex < firstQuoteIndex)) {
        // If asterisk is found first or quotes are not found, remove all quotes
        return input.replace(/"/g, '');
    } else {
        // If quote is found first or asterisks are not found, remove all asterisks
        return input.replace(/\*/g, '');
    }
}

//create a function that removes any html tags from a string
export function removeHTMLTags(input: string): string {
    return input.replace(/<[^>]*>?/gm, '');
}

export function removeBrackets(input: string): string {
    return input.replace(/\[.*?\]/g, '');
}

export function removeCodeBlocks(input: string): string {
    return input.replace(/```.*?```/g, "");
}

function processTextForItalics(text: string) {
    const lines = text.split('\n');
  
    const processedLines = lines.map((line) => {
      // Check if the line starts with an asterisk and doesn't end with one
      if (/^\s*\*/.test(line) && !/\*$/.test(line)) {
        // Attempt to find the last bit of text to wrap in asterisks
        // This will add an asterisk at the end of the line, assuming that's the intent
        return line + '*';
      }
      return line;
    });
  
    // Reassemble the processed lines into a single string
    return processedLines.join('\n');
}

//process text for bold

export function processTextForBold(text: string) {
    const lines = text.split('\n');

    const processedLines = lines.map((line) => {
        // Check if the line starts with two asterisks and doesn't end with two
        if (/^\s*\*\*/.test(line) && !/\*\*$/.test(line)) {
        // Attempt to find the last bit of text to wrap in asterisks
        // This will add an asterisk at the end of the line, assuming that's the intent
        return line + '**';
        }
        return line;
    });

    // Reassemble the processed lines into a single string
    return processedLines.join('\n');
}

export function processTextForQoutes(text: string){
const lines = text.split('\n');

const processedLines = lines.map((line) => {
    // Check if the line starts with a quote and doesn't end with one
    if (/^\s*"/.test(line) && !/"/.test(line)) {
    // Attempt to find the last bit of text to wrap in quotes
    // This will add a quote at the end of the line, assuming that's the intent
    return line + '"';
    }
    return line;
});

// Reassemble the processed lines into a single string
return processedLines.join('\n');
}

export function removeLastLineLeaks(input: string, potential_leaks: string[]): string {
const lines = input.split('\n');
const lastLine = lines[lines.length - 1];
// Check if the last line (trimmed) is in the potential_leaks array or is 'You'
if (potential_leaks.includes(lastLine.trim()) || lastLine.trim() === 'You') {
    return lines.slice(0, -1).join('\n');
} else {
    // check if the last line is less than 10 characters
    if (lastLine.trim().length < 10) {
    return lines.slice(0, -1).join('\n');
    }
    return input;
}
}

export function transformText(text: string): string {
    // Split the text into lines
    const lines = text.split('\n');

    // Function to transform a single line
    const transformLine = (line: string): string => {
        // New regex to exclude {{user}}: and {{char}}: placeholders from being wrapped
        const regex = /(\{\{user\}\}:|\{\{char\}\}:)|\*([^\*]+)\*|([^*]+)/g;
        let transformedLine = '';
        let match: RegExpExecArray | null;

        while ((match = regex.exec(line)) !== null) {
        // If the match is a {{user}}: or {{char}}: placeholder
        if (match[1]) {
            transformedLine += match[1] + ' ';
        // If the match is an action
        } else if (match[2]) {
            transformedLine += match[2] + ' ';
        // If the match is dialogue
        } else if (match[3]) {
            // Add condition to skip wrapping if match is preceded by a placeholder which is handled in previous condition
            transformedLine += `"${match[3].trim()}" `;
        }
        }
        transformedLine.replaceAll(`"" `, '')
        return transformedLine.trim();
    };

    // Transform each line and join them back together
    return lines.map(line => transformLine(line)).join('\n');
}

export function novelToMarkdown(text: string): string {
    // Split the text into lines
    const lines = text.split('\n');

    // Function to revert transformations on a single line
    const revertLineTransformation = (line: string): string => {
        // Regex to identify quoted dialogue, preserving placeholders and plaintext
        const regex = /(\{\{user\}\}:|\{\{char\}\}:)|"([^"]+)"|([^\{\}"]+)/g;
        let revertedLine = '';
        let match: RegExpExecArray | null;
        
        while ((match = regex.exec(line)) !== null) {
        // If the match is a {{user}}: or {{char}}: placeholder
        if (match[1]) {
            revertedLine += match[1] + ' ';
        // If the match is quoted dialogue
        } else if (match[2]) {
            revertedLine += match[2] + ' ';
        // If the match is plaintext (potentially an action)
        } else if (match[3]) {
            // We need to identify actions here; this simple case wraps all non-placeholder text in asterisks
            // More complex logic might be required depending on the specificity of action identification
            revertedLine += `*${match[3].trim()}* `;
        }
        }

        return revertedLine.trim();
    };

    // Transform each line and join them back together
    return lines.map(line => revertLineTransformation(line)).join('\n');
}
  
export function breakUpCommands(
  charName: string,
  commandString: string,
  user = "You",
  stopList: string[] = [],
  doMultiLine: boolean = true,
  ban_brackets: boolean = false,
  ban_html: boolean = false,
  ban_code: boolean = false
): string {
  if (doMultiLine === false) {
    const lines = commandString.split("\n");
    // filter out any empty lines
    const newlines = lines.filter((line) => line.trim() !== "");
    let command = newlines[0].replaceAll(`${charName}:`, "").trim();
    // remove any line that is just the character name, or the user name
    command = command
      .replaceAll("<start>", "")
      .replaceAll("<end>", "")
      .replaceAll("###", "")
      .replaceAll("<user>", "")
      .replaceAll("user:", "")
      .replaceAll("USER:", "")
      .replaceAll("ASSISTANT:", "")
      .replaceAll("<|user|>", "")
      .replaceAll("<|model|>", "")
      .replaceAll(`${charName}: `, "")
      .replaceAll(`${user}: `, "")
      .replaceAll(`<BOT>`, charName)
      .replaceAll(`<bot>`, charName)
      .replaceAll(`<CHAR>`, charName)
      .replaceAll("</s>", "")
      .replaceAll("<s>", "")
      .replaceAll(`Instruction:`, "")
      .replaceAll(`\nInstruction`, "")
      .replaceAll(`/bit `, "")
    if(ban_brackets){
      command = removeBrackets(command);
    }
    if(ban_html){
      command = removeHTMLTags(command);
    }
    if(ban_code){
      command = removeCodeBlocks(command);
    }
    command = command.replaceAll(`${charName}: `, ``)
    command = processTextForBold(command);
    command = processTextForItalics(command);
    command = processTextForQoutes(command);
    command = removeLastLineLeaks(command, [charName, user]);
    const asterisks = command.match(/\*/g);
    if (asterisks && asterisks.length % 2 !== 0) {
      // remove the last asterisk
      command = command.substring(0, command.lastIndexOf("*"));
    }
    return command;
  }
  let lines = commandString.split("\n\n");
  if (lines.length === 1) {
    lines = lines[0].split("\n");
  }
  const formattedCommands = [];
  let currentCommand = "";
  let isFirstLine = true;
  for (let i = 0; i < lines.length; i++) {
    // If the line starts with a colon, it's the start of a new command
    const lineToTest = lines[i].toLocaleLowerCase();

    if (
      (lineToTest.startsWith(`${user.toLocaleLowerCase()}:`) ||
      lineToTest.startsWith("you:") ||
      lineToTest.startsWith("<start>") ||
      lineToTest.startsWith("<end>") ||
      lineToTest.startsWith("<user>") ||
      lineToTest.toLocaleLowerCase().startsWith("user:")) && 
      !isFirstLine
    ) {
      break;
    }
    let isStopListed = false;
    if (stopList !== null) {
      for (let j = 0; j < stopList.length; j++) {
        if (lineToTest.startsWith(`${stopList[j].toLocaleLowerCase()}`)) {
          isStopListed = true;
          break;
        }
      }
    }
    if (isStopListed) {
      break;
    }

    if (lineToTest.startsWith(`${charName}:`)) {
      isFirstLine = false;
      if (currentCommand !== "") {
        // Push the current command to the formattedCommands array
        formattedCommands.push(currentCommand);
      }
    } else {
      if (currentCommand !== "" || isFirstLine) {
        currentCommand += (isFirstLine ? "" : "\n") + lines[i];
      }
      if (isFirstLine) {
        isFirstLine = false;
        currentCommand += "\n";
      }
    }
  }
  let final = "";
  // Don't forget to add the last command
  if (currentCommand !== "") {
    formattedCommands.push(currentCommand);
  }
  let removedEmptyLines = formattedCommands.filter((command) => {
    return command.trim() !== "";
  });
  //remove any lines that are just, the character name, or the user name
  removedEmptyLines = removedEmptyLines.filter((command) => {
    return !command.trim().startsWith(user) && !command.trim().startsWith("You");
  });
  final = removedEmptyLines.join("\n");
  final = final.replaceAll("<start>", "")
    .replaceAll("<end>", "")
    .replaceAll("###", "")
    .replaceAll("<user>", "")
    .replaceAll("user:", "")
    .replaceAll("USER:", "")
    .replaceAll("ASSISTANT:", "")
    .replaceAll("<|user|>", "")
    .replaceAll("<|model|>", "")
    .replaceAll(`${user}: `, "")
    .replaceAll(`<BOT>`, charName)
    .replaceAll(`<bot>`, charName)
    .replaceAll(`<CHAR>`, charName)
    .replaceAll("</s>", "")
    .replaceAll("<s>", "")
    .replaceAll(`[INST`, "")
    .replaceAll(`Instruction:`, "")
    .replaceAll(`\nInstruction`, "")
    .replaceAll(`/bit `, "")
  if(ban_brackets){
    final = removeBrackets(final);
  }
  if(ban_html){
    final = removeHTMLTags(final);
  }
  if(ban_code){
    final = removeCodeBlocks(final);
  }
  final = final.replaceAll(`${charName}: `, ``)
  final = processTextForBold(final);
  final = processTextForItalics(final);
  final = processTextForQoutes(final);
  final = removeLastLineLeaks(final, [charName, user]);
  // are there an odd number of asterisks in the string?
  const asterisks = final.match(/\*/g);
  if (asterisks && asterisks.length % 2 !== 0) {
    // remove the last asterisk
    final = final.substring(0, final.lastIndexOf("*"));
  }
  return final;
}

/**
 * Extracts a file with given extension from an ArrayBuffer containing a ZIP archive.
 * @param {ArrayBuffer} archiveBuffer Buffer containing a ZIP archive
 * @param {string} fileExtension File extension to look for
 * @returns {Promise<Buffer>} Buffer containing the extracted file
 */
export async function extractFileFromZipBuffer(archiveBuffer: ArrayBuffer, fileExtension: string): Promise<Buffer> {
    const zip = new JSZip();
    await zip.loadAsync(archiveBuffer);
    
    for (const [filename, file] of Object.entries(zip.files)) {
        if (filename.endsWith(fileExtension) && !file.dir) {
            console.log(`Extracting ${filename}`);
            return await file.async('nodebuffer');
        }
    }
    
    throw new Error(`No file with extension ${fileExtension} found in the archive.`);
}

/**
 * Extracts files with a given extension from an ArrayBuffer containing a ZIP archive.
 * @param {ArrayBuffer} archiveBuffer Buffer containing a ZIP archive
 * @param {string} fileExtension File extension to look for
 * @returns {Promise<Buffer[]>} Array of Buffers containing the extracted files
 */
export async function extractFilesFromZipBuffer(archiveBuffer: ArrayBuffer, fileExtension: string): Promise<Buffer[]> {
    const zip = new JSZip();
    await zip.loadAsync(archiveBuffer);
    
    const files: Buffer[] = [];
    
    for (const [filename, file] of Object.entries(zip.files)) {
        if (filename.endsWith(fileExtension) && !file.dir) {
            console.log(`Extracting ${filename}`);
            const content = await file.async('nodebuffer');
            files.push(content);
        }
    }
    
    return files;
}

export function writeBase64ToPNGFile(base64: string){
    try {
        const buffer = Buffer.from(base64, 'base64');
        // create a random file name with no special characters
        const fileName = `temp-${Math.random().toString(36).substring(7)}.png`;
        const filePath = path.join(uploadsPath, fileName);
        // write the file to disk
        fs.writeFileSync(filePath, buffer);
        return `/images/${fileName}`;
    } catch (e) {
        console.error(e);
        return;
    }
}

export const randomSystemPrompts = [
    'Continue the conversation.',
    'Keep the conversation going.',
    'Say something else.',
    'Keep talking.',
    'And then...',
    'Suddenly...',
    'And so the adventures moved onward to...',
    'Continue the story.',
    'Continue',
    'Then she remembered...',
    'And then he said...',
    'And then she said...',
    'Engage sex mode.',
];

export function getRandomSystemPrompt(){
    return randomSystemPrompts[Math.floor(Math.random() * randomSystemPrompts.length)];
}
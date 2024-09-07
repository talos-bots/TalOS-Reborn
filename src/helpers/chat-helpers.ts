/* eslint-disable @typescript-eslint/no-unused-vars */
import { sendCompletionRequest } from "../api/connectionAPI";
import { Character } from "../global_classes/Character";
import { Message } from "../global_classes/CompletionRequest";
import { CharacterInterface, InstructMode } from "../types";

export async function continueConversation(messages: Message[], character: Character) {
  const unparsedResponse = await sendCompletionRequest(messages, character).then((response) => {
    console.log(response);
    return response;
  }).catch((error) => {
    console.log(error);
  });
  if (unparsedResponse === null) {
    return null;
  }
  const value = unparsedResponse?.completion?.choices[0]?.text.trim();
  console.log(value);
  const refinedResponse = breakUpCommands(character.name, value, 'You', null, false);
  const assistantResponse: Message = {
    userId: character._id,
    fallbackName: character.name,
    swipes: [refinedResponse],
    currentIndex: 0,
    role: 'Assistant',
    thought: false,
  };
  return assistantResponse;
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

export function breakUpCommands(charName: string, commandString: string, user = 'You', stopList: string[] = [], doMultiLine: boolean = true): string {
  const lines = commandString.split('\n');
  const formattedCommands = [];
  let currentCommand = '';
  let isFirstLine = true;

  if (doMultiLine === false) {
    let command = lines[0];
    if (command.trim() === '') {
      if (lines.length > 1) {
        command = lines[1];
      }
    }
    return removeHTMLTags(command.replaceAll('<start>', '')
      .replaceAll('<end>', '').replaceAll('###', '')
      .replaceAll('<user>', '').replaceAll('user:', '')
      .replaceAll('USER:', '').replaceAll('ASSISTANT:', '')
      .replaceAll('<|user|>', '').replaceAll('<|model|>', '')
      .replaceAll(`${charName}: `, '')
      .replaceAll(`${user}: `, '')
      .replaceAll(`<BOT>`, charName)
      .replaceAll(`<bot>`, charName)
      .replaceAll(`<CHAR>`, charName)).replaceAll('</s>', '').replaceAll('<s>', '');
  }

  for (let i = 0; i < lines.length; i++) {
    // If the line starts with a colon, it's the start of a new command
    const lineToTest = lines[i].toLocaleLowerCase();

    if (lineToTest.startsWith(`${user.toLocaleLowerCase()}:`) || lineToTest.startsWith('you:') || lineToTest.startsWith('<start>') || lineToTest.startsWith('<end>') || lineToTest.startsWith('<user>') || lineToTest.toLocaleLowerCase().startsWith('user:')) {
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
      if (currentCommand !== '') {
        // Push the current command to the formattedCommands array
        formattedCommands.push(currentCommand);
      }
    } else {
      if (currentCommand !== '' || isFirstLine) {
        currentCommand += (isFirstLine ? '' : '\n') + lines[i]
      }
      if (isFirstLine) {
        isFirstLine = false;
        currentCommand += '\n'
      }
    }
  }
  let final = '';
  // Don't forget to add the last command
  if (currentCommand !== '') {
    formattedCommands.push(currentCommand);
  }
  // if(!get1PP()){
  const removedEmptyLines = formattedCommands.filter((command) => {
    return command.trim() !== '';
  });
  final = removedEmptyLines.join('\n\n');
  // }else {
  //     final = formattedCommands.join('\n');
  // }
  return removeHTMLTags(final.replaceAll('<start>', '').replaceAll('<end>', '')
    .replaceAll('###', '').replaceAll('<user>', '')
    .replaceAll('user:', '').replaceAll('USER:', '')
    .replaceAll('ASSISTANT:', '').replaceAll('<|user|>', '')
    .replaceAll('<|model|>', '').replaceAll(`${user}: `, '').replaceAll(`<BOT>`, charName)
    .replaceAll(`<bot>`, charName).replaceAll(`<CHAR>`, charName)).replaceAll('</s>', '').replaceAll('<s>', '');
}

function getNamesFromMessages(messages: Message[]): string[] {
  const names: string[] = [];
  messages.forEach((message) => {
    if (!names.includes(message.fallbackName)) {
      names.push(message.fallbackName);
    }
  });
  return names;
}

export function breakUpStringToMessages(string: string, messages: Message[], stopList: string[], character: CharacterInterface): Message[] {
  const lines = string.split('\n').filter(line => line.trim() !== '');
  const names = getNamesFromMessages(messages);
  const formattedMessages: Message[] = [];
  let currentMessage = '';
  let isFirstLine = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLocaleLowerCase();

    // Check if line is in stop list
    if (stopList.some(stop => lineLower.startsWith(stop.toLocaleLowerCase()))) {
      break;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      currentMessage += (isFirstLine ? '' : '\n') + line;
      isFirstLine = false;
      continue;
    }

    const potentialName = line.substring(0, colonIndex);
    if (names.includes(potentialName)) {
      if (currentMessage) {
        formattedMessages.push(createMessage(currentMessage, character._id, potentialName));
      }
      currentMessage = line.substring(colonIndex + 1).trim();
      isFirstLine = true;
    } else {
      // Stop processing if the line before the colon is not a name and is less than 32 characters
      if (colonIndex < 32) {
        break;
      }
      currentMessage += (isFirstLine ? '' : '\n') + line;
      isFirstLine = false;
    }
  }

  if (currentMessage) {
    formattedMessages.push(createMessage(currentMessage, character._id, names[0])); // Default to the first name if no match found
  }

  return formattedMessages;
}

function createMessage(text: string, userId: string, fallbackName: string): Message {
  const swipeText = removeHTMLTags(text.trim().replaceAll('<start>', '').replaceAll('<end>', '')
    .replaceAll('###', '').replaceAll('<user>', '')
    .replaceAll('user:', '').replaceAll('USER:', '')
    .replaceAll('ASSISTANT:', '').replaceAll('<|user|>', '')
    .replaceAll('<|model|>', '').replaceAll('</s>', '')
    .replaceAll('<s>', ''));
  return {
    userId: userId,
    fallbackName: fallbackName,
    swipes: [swipeText],
    currentIndex: 0,
    role: 'Assistant',
    thought: false,
  };
}
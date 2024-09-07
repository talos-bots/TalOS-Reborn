/* eslint-disable @typescript-eslint/no-explicit-any */
import { Character } from "../global_classes/Character";
import { StoredChatLog, StoredChatMessage } from "../global_classes/StoredChatLog";
import { CharacterInterface } from "../types";

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

export async function getCurrentEngine() {
  const model = localStorage.getItem('modelid') || 'mytholite';
  return model;
}

export function getCurrentPreset() {
  const preset = localStorage.getItem('preset') || 'storywriter';
  return preset;
}

export function setNewLogicEngine(model: string) {
  if (model === 'mythomax' || model === 'weaver-alpha' || model === 'synthia-70b' || model === 'goliath-120b' || model === 'mythalion') {
    localStorage.setItem('modelid', model);
  } else {
    localStorage.setItem('modelid', 'mythomax');
  }
}

export function setPreset(preset: string) {
  localStorage.setItem('preset', preset);
}

export function determineModel(model: string) {
  switch (model) {
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

export function convertDiscordLogToMessageLog(discordLog: any, character: CharacterInterface): StoredChatLog {
  const messageLog: StoredChatLog = new StoredChatLog();
  messageLog._id = discordLog.channel.id
  messageLog.characters = [character._id]
  messageLog.messages = []
  messageLog.name = discordLog.channel.name
  messageLog.firstMessageDate = discordLog.messages[0].id
  messageLog.lastMessageDate = discordLog.messages[discordLog.messages.length - 1].id

  const firstMessager = discordLog.messages[1].author.id
  for (const message of discordLog.messages) {
    const newMessage = new StoredChatMessage(
      message.author.id === firstMessager ? "0" : character._id,
      message.author.id === firstMessager ? 'Sen' : character.name,
      [message.content],
      0,
      message.author.id === firstMessager ? 'User' : "Assistant",
      false,
    );
    messageLog.messages.push(newMessage);
  }
  return messageLog;
}
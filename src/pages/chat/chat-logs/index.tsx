/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Character } from "../../../global_classes/Character";
import React, { useEffect, useState } from "react";
import { StoredChatLog } from "../../../global_classes/StoredChatLog";
import { deleteStoredChatLog, getAllStoredChatLogs, getAllStoredChatLogsWithCharacter } from "../../../api/chatLogDB";
import { emitCloseSides, emitNewChatLog, emitSelectedChatLogChanged, useChatLogChangedListener } from "../../../helpers/events";
import { Check, CloudOff, Trash, UploadCloud } from "lucide-react";
import { confirmModal } from "../../../components/shared/confirm-modal";
import { convertDiscordLogToMessageLog } from "../../../helpers";

interface ChatLogsProps {
  character: Character | null;
  showCharacterPopup: (character?: Character) => void;
}

const ChatLogs = (props: ChatLogsProps) => {
  const { character, showCharacterPopup } = props;
  const [chatLogs, setChatLogs] = useState<StoredChatLog[]>([]);

  const init = async () => {
    if (character === null) return;
    const chatLogs = await getAllStoredChatLogsWithCharacter(character?._id);
    setChatLogs(chatLogs);
  }

  const updateLogs = async () => {
    const chatLogs = await getAllStoredChatLogsWithCharacter(character?._id);
    setChatLogs(chatLogs);
  }

  useChatLogChangedListener(() => {
    updateLogs();
  });

  useEffect(() => {
    init();
  }, [character]);

  if (character === null) return null;

  const handleChatLogClick = (chatLog: StoredChatLog) => {
    emitCloseSides();
    emitSelectedChatLogChanged(chatLog);
  }

  const handleDeleteChatLog = async (chatLog: StoredChatLog) => {
    if (!await confirmModal("Are you sure you want to delete this chat log?", "This action cannot be undone.")) return;
    deleteStoredChatLog(chatLog._id).then(() => {
      emitNewChatLog();
    }).catch((err) => {
      console.log(err);
    });
  }

  const uploadJsonLogs = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.onchange = async (e) => {
      if (fileInput.files === null) return;
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (reader.result === null) return;
        const logs = JSON.parse(reader.result.toString());
        const log = convertDiscordLogToMessageLog(logs, character);
        await log.saveToDB();
        updateLogs();
      }
      reader.readAsText(file);
    }
    fileInput.click();
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-scroll gap-2 p-2">
      {character?.name && (
        <button className="dy-btn dy-btn-accent dy-btn-sm" onClick={() => {
          emitNewChatLog();
        }}>New Chat with {character?.name}</button>
      )}
      {/* <button className="dy-btn dy-btn-accent dy-btn-sm" onClick={() => {
                uploadJsonLogs();
            }}><UploadCloud/> Upload JSON Logs</button> */}
      {chatLogs.sort(
        (a, b) => {
          if (a.messages.length === 0) return 1;
          if (b.messages.length === 0) return -1;
          return b.messages[b.messages.length - 1].timestamp - a.messages[a.messages.length - 1].timestamp;
        }
      ).map((chatLog: StoredChatLog, index: number) => {
        return (
          <div className="rounded-box bg-base-200 p-2 flex flex-row gap-1 items-center" key={index}>
            <div className="flex flex-col gap-2">
              <div className="flex flex-row justify-between items-center">
                <div className="text-xs text-ellipsis">{character?.name}</div>
                <div className="font-bold text-sm">{chatLog?.name}</div>
              </div>
              <div className="text-xs text-left bg-base-100 rounded-box p-2 line-clamp-2 text-ellipsis overflow-y-scroll"><i>{chatLog?.messages[chatLog?.messages.length - 1].fallbackName}</i>: {chatLog?.messages[chatLog?.messages.length - 1]?.swipes[chatLog?.messages[chatLog?.messages.length - 1]?.currentIndex]}</div>
            </div>
            <div className="flex flex-col w-fit h-full items-center gap-1 flex-grow justify-center">
              <button className="dy-btn dy-btn-accent dy-btn-sm" onClick={() => handleChatLogClick(chatLog)}><Check /></button>
              <button className="dy-btn dy-btn-error dy-btn-sm" onClick={() => handleDeleteChatLog(chatLog)}><Trash /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
export default ChatLogs;
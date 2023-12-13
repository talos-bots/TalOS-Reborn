/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Character } from "../../../global_classes/Character";
import React, { useEffect, useState } from "react";
import { StoredChatLog } from "../../../global_classes/StoredChatLog";
import { deleteStoredChatLog, getAllStoredChatLogs, getAllStoredChatLogsWithCharacter } from "../../../api/chatLogDB";
import { emitCloseSides, emitNewChatLog, emitSelectedChatLogChanged, useChatLogChangedListener } from "../../../helpers/events";
import { Check, CloudOff, Trash, UploadCloud } from "lucide-react";
import { confirmModal } from "../../../components/shared/confirm-modal";

interface ChatLogsProps {
    character: Character | null;
    showCharacterPopup: (character?: Character) => void;
}

const ChatLogs = (props: ChatLogsProps) => {
    const { character, showCharacterPopup } = props;
    const [chatLogs, setChatLogs] = useState<StoredChatLog[]>([]);

    const init = async () => {
        // if(character === null) return;
        // const finalLogs: StoredChatLog[] = [];
        // const chatLogs = await getAllStoredChatLogsWithCharacter(character?._id);
        // const cloudChatLogs = await getChatsWithCharacter(character?._id);
        // cloudChatLogs.forEach((cloudChatLog) => {
        //     const chatLog = chatLogs.find((chatLog) => chatLog._id === cloudChatLog._id);
        //     if(chatLog) {
        //         chatLog.messages = cloudChatLog.messages;
        //         chatLog.name = cloudChatLog.name;
        //         chatLog.lastMessageDate = cloudChatLog.lastMessageDate;
        //         chatLog.characters = cloudChatLog.characters;
        //         finalLogs.push(chatLog);
        //     } else {
        //         finalLogs.push(cloudChatLog);
        //     }
        // });
        // setChatLogs(finalLogs);
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

    if(character === null) return null;

    const handleChatLogClick = (chatLog: StoredChatLog) => {
        emitCloseSides();
        emitSelectedChatLogChanged(chatLog);
    }
    
    const handleDeleteChatLog = async (chatLog: StoredChatLog) => {
        if(!await confirmModal("Are you sure you want to delete this chat log?", "This action cannot be undone.")) return;
        deleteStoredChatLog(chatLog._id).then(() => {
            emitNewChatLog();
        }).catch((err) => {
            console.log(err);
        });
    }

    return (
        <div className="flex flex-col h-full w-full overflow-y-scroll gap-2 p-2">
            {character?.name && (
                <button className="dy-btn dy-btn-accent dy-btn-sm" onClick={() => {
                    emitNewChatLog();
                }}>New Chat with {character?.name}</button>
            )}
            {chatLogs.sort(
                (a, b) => {
                    if(a.messages.length === 0) return 1;
                    if(b.messages.length === 0) return -1;
                    return b.messages[b.messages.length-1].timestamp - a.messages[a.messages.length-1].timestamp;
                }
            ).map((chatLog: StoredChatLog, index: number) => {
                return (
                    <div className="rounded-box bg-base-200 p-2 flex flex-row gap-1 items-center" key={index}>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row justify-between items-center">
                                <div className="text-xs text-ellipsis">{character?.name}</div>
                                <div className="font-bold text-sm">{chatLog?.name}</div>
                            </div>
                            <div className="text-xs text-left bg-base-100 rounded-box p-2 line-clamp-2 text-ellipsis overflow-y-scroll"><i>{chatLog?.messages[chatLog?.messages.length-1].fallbackName}</i>: {chatLog?.messages[chatLog?.messages.length-1]?.swipes[chatLog?.messages[chatLog?.messages.length-1]?.currentIndex]}</div>
                        </div>
                        <div className="flex flex-col w-fit h-full items-center gap-1 flex-grow justify-center">
                            <button className="dy-btn dy-btn-accent dy-btn-sm" onClick={() => handleChatLogClick(chatLog)}><Check/></button>
                            <button className="dy-btn dy-btn-error dy-btn-sm" onClick={() => handleDeleteChatLog(chatLog)}><Trash/></button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
export default ChatLogs;
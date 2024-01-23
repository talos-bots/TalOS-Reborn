/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ArrowLeft, ArrowRight, Cog, Contact, Play, Plus, Smile, Trash } from "lucide-react";
import { Character, UserPersona } from "../../../global_classes/Character";
import { useEffect, useRef, useState } from "react";
import { StoredChatLog, StoredChatMessage } from "../../../global_classes/StoredChatLog";
// @ts-ignore
import ReactAnimatedEllipsis from 'react-animated-ellipsis';
import ReactMarkdown from 'react-markdown';
import { useNewChatLogListener, useSelectedChatLogChangedListener } from '../../../helpers/events';
import { TEAlert } from 'tw-elements-react';
import { useDataset } from '../../../components/dataset/DatasetProvider';
import { generateBatchForDataset, saveDataset } from '../../../api/datasetAPI';

interface ChatWindowProps {
    character: Character | null;
    persona: UserPersona | null;
    toggleLeftDrawer: () => void;
    toggleRightDrawer: () => void;
    showCharacterPopup: (character?: Character) => void;
}

const chatWindow = (props: ChatWindowProps) => {
    const { character, persona } = props;
    const { dataset, setDataset } = useDataset();
    const [chatLog, setChatLog] = useState<StoredChatLog | null>(null);
    const [chatMessages, setChatMessages] = useState<StoredChatMessage[]>([]);
    const [messageText, setMessageText] = useState<string>('');
    const [showTypingIndicator, setShowTypingIndicator] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
    const [numBatches, setNumBatches] = useState<number>(1);

    const isDesktop = window.innerWidth > 768;

    const endOfChatRef = React.useRef<HTMLDivElement>(null);

    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useSelectedChatLogChangedListener((newChatLog) => {
        if(newChatLog === null) return;
        setChatMessages([])
        setChatLog(newChatLog);
        setChatMessages(newChatLog.getMessages());
    });

    useEffect(() => {
        const handleResize = () => {
            const keyboardVisible = window.innerHeight < window.outerHeight / 2;
            setIsKeyboardVisible(keyboardVisible);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if(endOfChatRef.current !== null){
            endOfChatRef?.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    useEffect(() => {
        // Check if chatLog is not null
        if (chatLog) {
            if(!chatLog) return;
            if(!character) return;
            if(!chatLog.characters.includes(character?._id)) return;
            setChatMessages(chatLog.getMessages());
        } else {
            // If chatLog is null, clear the messages
            setChatMessages([]);
        }
    }, [chatLog]);
    
    const handleSendMessage = async (newMessageText: string) => {
        if(character === null) return;
        setMessageText('');
        const newMessage = StoredChatMessage.fromUserPersonaAndString(persona, newMessageText);
        setChatMessages([...chatMessages, newMessage]);
        setShowTypingIndicator(true);
        const returnedLog: StoredChatLog = await chatLog.continueChatLogFromNewMessage(newMessageText, character, persona).then((returnedLog) => {
            return returnedLog;
        }).catch((error) => {
            console.log(error);
            setShowError(true);
            return null;
        });
        setShowTypingIndicator(false);
        if(!returnedLog) return;
        setChatLog(returnedLog);
        await returnedLog.saveToDB();
    }

    useNewChatLogListener(() => {
        setChatMessages([]);
        const newChat = new StoredChatLog();
        if(character.hasGreetings()){
            newChat.addMessage(character.createGreetingStoredMessage().replacePlaceholders(persona?.name ?? 'You'));
        }
        setMessageText('');
        setShowError(false);
        setShowTypingIndicator(false);
        setChatLog(newChat);
    });

    useEffect(() => {
        setChatMessages([]);
        const currentLog: StoredChatLog = new StoredChatLog();
        if(!character) return;
        if(currentLog.messages.length === 0){
            if(character.hasGreetings()){
                currentLog.addMessage(character.createGreetingStoredMessage().replacePlaceholders(persona?.name ?? 'You'));
            }
        }
        setChatLog(currentLog);
    }, [character]);

    const findLastAssistantMessage = () => {
        for(let i = chatMessages.length - 1; i >= 0; i--){
            if(chatMessages[i].role === 'Assistant'){
                return chatMessages[i];
            }
        }
        return null;
    }

    useEffect(() => {
        const message = findLastAssistantMessage();
        if(message === null) return;
        const emotion = message.getEmotion();
    }, [chatMessages]);

    const chatContainerStyle = isKeyboardVisible ? { maxHeight: '40vh', overflow: 'scroll' } : null;

    const handleCharacterInfoClick = () => {
        if(character === null) return;
        props.showCharacterPopup(character);
    }

    const toggleMessageBox = () => {
        setIsMessageBoxOpen(!isMessageBoxOpen);
        // Other logic for toggling the message box
    };

    const disableBodyScroll = (shouldDisable) => {
        if (shouldDisable) {
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.scrollY}px`;
        } else {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    };

    const handleMessageBarFocus = () => {
        if(isDesktop) return;
        if(endOfChatRef.current !== null){
            endOfChatRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        console.log('focus');
        toggleMessageBox();
    }

    const handleMessageBarBlur = () => {
        if(isDesktop) return;
        console.log('blur');
        toggleMessageBox();
    }
    
    useEffect(() => {
        disableBodyScroll(isMessageBoxOpen);
    }, [isMessageBoxOpen]);
    
    useEffect(() => {
        const handleTouchMove = (e) => {
            if (isMessageBoxOpen) {
                e.preventDefault();
            }
        };
    
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
    
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isMessageBoxOpen]);    

    const generateData = async () => {
        let currentDataset = dataset;
        for(let i = 0; i < numBatches; i++){
            await generateBatchForDataset(currentDataset).then((newDataset) => {
                setDataset(newDataset);
                currentDataset = newDataset;
                saveDataset(newDataset);
            }).catch((error) => {
                console.log(error);
                setShowError(true);
            });
        }
    }

    const clearMessages = () => {
        const newDataset = dataset;
        newDataset.messages = [];
        setDataset(newDataset);
        saveDataset(newDataset);
    }

    return (
        <div className="col-span-full md:col-span-7 md:rounded-box bg-base-300 md:p-4 md:max-h-[90vh] flex flex-col gap-2 p-2" style={chatContainerStyle}>
            <TEAlert dismiss delay={5000} open={showError} autohide onClose={
                () => {
                    setShowError(false);
                    setShowTypingIndicator(false);
                }
            } className='rounded-box bg-error text-error-content z-[1000]'>
                <strong>Error Generating Reply!</strong>
                <span className="ml-1">
                    Please try again later.
                </span>
            </TEAlert>
            <h3 className={"font-bold text-center flex flex-row gap-2 justify-between md:justify-center items-center"}>
                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm md:hidden" onClick={() => clearMessages()}>
                    <Trash/>
                </button>
                <div className="flex flex-row gap-2 justify-center items-center">
                    <span className="text-xl">Number of Batches</span>
                </div>
                <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm" onClick={() => generateData()}>
                    <Play/>
                </button>
                <input type="number" className="dy-input dy-input-bordered dy-input-sm" value={numBatches} onChange={(e) => setNumBatches(parseInt(e.target.value))} min={1} max={2000}/>
            </h3>
            <div className={"w-full bg-base-100 rounded-box overflow-y-scroll pl-2 pt-2 max-h-[calc(92.5vh-180px)] min-h-[calc(92.5vh-180px)]"}>
                {Array.isArray(dataset.messages) && dataset.messages.map((message, index) => {
                    return (
                        <div key={index} className={"dy-chat " + (message.role !== 'User' ? 'dy-chat-start' : 'dy-chat-end')}>
                            <div className="dy-chat-header">
                                {message.fallbackName ?? 'None'}
                            </div>
                            <div className={(message.role !== 'User' ? 'dy-chat-bubble dy-chat-bubble-secondary' : 'dy-chat-bubble')}>
                                <ReactMarkdown 
                                    components={{
                                        em: ({ node, ...props }) => <i {...props} />,
                                        b: ({ node, ...props }) => <b {...props} />,
                                        code: ({ node, ...props }) => <code {...props} />,
                                    }}
                                >
                                    {message.swipes[message.currentIndex]}
                                </ReactMarkdown>
                            </div>
                        </div>
                    );
                })}
                {showTypingIndicator && 
                    <div className="dy-chat dy-chat-start">
                        <div className="dy-chat-header">
                            {character?.name? character?.name : 'Them'}
                        </div>
                        <div className="dy-chat-bubble dy-chat-bubble-secondary">
                            <ReactAnimatedEllipsis />
                        </div>
                    </div>
                }
                <div ref={endOfChatRef}></div>
            </div>
            <div className={`flex flex-row gap-2 justify-center min-h-[115px] max-h-[115px] md:max-h-none md:min-h-[60px] md:flex-grow`}>
                <textarea
                    disabled={character === null || showError}
                    className="dy-textarea w-full h-full overflow-y-scroll resize-none"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onFocus={(e) => {
                        handleMessageBarFocus();
                        e.currentTarget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onBlur={(e) => {
                        handleMessageBarBlur();
                        e.currentTarget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            e.preventDefault();
                            if(e.shiftKey){
                                setMessageText(messageText + '\n');
                                return;
                            }
                            if(showTypingIndicator) return;
                            if(messageText.trim() === '') return;
                            handleSendMessage(messageText);
                        }
                    }}
                />
                <button
                    disabled={character === null || showError || showTypingIndicator}
                    className="dy-btn dy-btn-accent flex-grow h-full"
                    onClick={(e) => {
                        if(showTypingIndicator) return;
                        e.preventDefault();
                        if(messageText.trim() === '') return;
                        handleSendMessage(messageText);
                    }}
                >
                    <ArrowRight/>
                </button>
            </div>
        </div>
    );
}
export default chatWindow
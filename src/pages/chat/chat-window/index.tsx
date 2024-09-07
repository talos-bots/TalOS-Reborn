/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ArrowLeft, ArrowRight, Cog, Contact, Plus, Smile } from "lucide-react";
import { Character, UserPersona } from "../../../global_classes/Character";
import { useEffect, useRef, useState } from "react";
import { StoredChatLog, StoredChatMessage } from "../../../global_classes/StoredChatLog";
// @ts-ignore
import ReactAnimatedEllipsis from 'react-animated-ellipsis';
import ReactMarkdown from 'react-markdown';
import { useNewChatLogListener, useSelectedChatLogChangedListener } from '../../../helpers/events';
import { TEAlert } from 'tw-elements-react';
import Sprite from '../../../components/shared/sprite';
import { Emotion } from '../../../helpers/constants';

interface ChatWindowProps {
  character: Character | null;
  persona: UserPersona | null;
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  theme: any;
  showCharacterPopup: (character?: Character) => void;
  theaterMode: boolean;
  setTheaterMode: (theaterMode: boolean) => void;
  background: string | null;
  setBackground: (background: string | null) => void;
}

const chatWindow = (props: ChatWindowProps) => {
  const { character, persona, theme, theaterMode, setTheaterMode, background, setBackground } = props;
  const [chatLog, setChatLog] = useState<StoredChatLog | null>(null);
  const [chatMessages, setChatMessages] = useState<StoredChatMessage[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [showTypingIndicator, setShowTypingIndicator] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);

  const isDesktop = window.innerWidth > 768;

  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  const [currentPosition, setCurrentPosition] = useState<'left' | 'right' | 'center'>('center');

  const endOfChatRef = React.useRef<HTMLDivElement>(null);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useSelectedChatLogChangedListener((newChatLog) => {
    if (newChatLog === null) return;
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
    if (endOfChatRef.current !== null) {
      endOfChatRef?.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    // Check if chatLog is not null
    if (chatLog) {
      if (!chatLog) return;
      if (!character) return;
      if (!chatLog.characters.includes(character?._id)) return;
      setChatMessages(chatLog.getMessages());
    } else {
      // If chatLog is null, clear the messages
      setChatMessages([]);
    }
  }, [chatLog]);

  const handleSendMessage = async (newMessageText: string) => {
    if (character === null) return;
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
    if (!returnedLog) return;
    setChatLog(returnedLog);
    await returnedLog.saveToDB();
  }

  useNewChatLogListener(() => {
    setChatMessages([]);
    const newChat = new StoredChatLog();
    if (character.hasGreetings()) {
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
    if (!character) return;
    if (currentLog.messages.length === 0) {
      if (character.hasGreetings()) {
        currentLog.addMessage(character.createGreetingStoredMessage().replacePlaceholders(persona?.name ?? 'You'));
      }
    }
    setChatLog(currentLog);
  }, [character]);

  const findLastAssistantMessage = () => {
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      if (chatMessages[i].role === 'Assistant') {
        return chatMessages[i];
      }
    }
    return null;
  }

  useEffect(() => {
    const message = findLastAssistantMessage();
    if (message === null) return;
    const emotion = message.getEmotion();
  }, [chatMessages]);

  const chatContainerStyle = isKeyboardVisible ? { maxHeight: '40vh', overflow: 'scroll' } : null;

  const handleCharacterInfoClick = () => {
    if (character === null) return;
    props.showCharacterPopup(character);
  }

  const toggleMessageBox = () => {
    setIsMessageBoxOpen(!isMessageBoxOpen);
    // Other logic for toggling the message box
  };

  const handleMessageBarFocus = () => {
    if (isDesktop) return;
    if (endOfChatRef.current !== null) {
      endOfChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    console.log('focus');
    toggleMessageBox();
  }

  const handleMessageBarBlur = () => {
    if (isDesktop) return;
    console.log('blur');
    toggleMessageBox();
  }

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

  return (
    <div className="col-span-full md:col-span-8 md:rounded-box bg-base-300 md:p-4 md:max-h-[90vh] flex flex-col gap-2 p-2" style={chatContainerStyle}>
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
        <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm md:hidden" onClick={props.toggleLeftDrawer}>
          <Contact />
        </button>
        <div className="flex flex-row gap-2 justify-center items-center">
          <img
            src={character?.avatar}
            className={"avatar object-cover object-top w-10 h-10 " + (character === null && 'hidden')}
            onClick={handleCharacterInfoClick}
            onTouchStart={
              (e) => {
                e.currentTarget.click();
              }
            }
          />
          <span className="text-xl">{character?.name ?? 'None'}</span>
        </div>
        <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm md:hidden" onClick={props.toggleRightDrawer}>
          <Cog />
        </button>
      </h3>
      <div
        className={'w-full border-4 border-base-200 inset-4 bg-base-100 rounded-box overflow-y-scroll flex flex-col items-end justify-center flex-grow theater-window max-h-[calc(65vh-80px)] min-h-[calc(65vh-80px)] ' + (!theaterMode && 'hidden')}
        style={{ backgroundImage: `url(./backgrounds/${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <Sprite character={character?._id} emotion={currentEmotion} position={currentPosition} />
      </div>
      <div className={"w-full bg-base-100 rounded-box overflow-y-scroll overflow-x-hidden pl-2 pt-2 " + (theaterMode ? `max-h-[calc(25vh-80px)] min-h-[calc(25vh-80px)]` : 'max-h-[calc(92.5vh-180px)] min-h-[calc(92.5vh-180px)]')}>
        {chatMessages.slice(
          Math.max(chatMessages.length - 200, 0)
        ).map((message, index) => {
          return (
            <div key={index} className={"dy-chat " + (message.role !== 'User' ? 'dy-chat-start' : 'dy-chat-end')}>
              <div className="dy-chat-header">
                {message.role !== 'User' ? (character?.name ? character?.name : 'none') : persona?.name ?? 'You'}
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
              {character?.name ? character?.name : 'Them'}
            </div>
            <div className="dy-chat-bubble dy-chat-bubble-secondary">
              <ReactAnimatedEllipsis />
            </div>
          </div>
        }
        <div ref={endOfChatRef}></div>
      </div>
      <div className={`flex flex-row gap-2 justify-center min-h-[115px] max-h-[115px] md:max-h-none md:min-h-[60px] md:flex-grow`}>
        {/* <button className="dy-btn dy-btn-accent h-full" disabled={character === null}>
                    <Plus/>
                </button> */}
        {/* <button className="dy-btn dy-btn-secondary h-full" disabled={character === null || showError || showTypingIndicator}>
                    <Smile/>
                </button> */}
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
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) {
                setMessageText(messageText + '\n');
                return;
              }
              if (showTypingIndicator) return;
              if (messageText.trim() === '') return;
              handleSendMessage(messageText);
            }
          }}
        />
        <button
          disabled={character === null || showError || showTypingIndicator}
          className="dy-btn dy-btn-accent flex-grow h-full"
          onClick={(e) => {
            if (showTypingIndicator) return;
            e.preventDefault();
            if (messageText.trim() === '') return;
            handleSendMessage(messageText);
          }}
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
export default chatWindow
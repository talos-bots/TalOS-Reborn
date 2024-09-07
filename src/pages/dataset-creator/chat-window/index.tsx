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
import { Message } from '../../../types';
import { fetchCharacterById } from '../../../api/characterAPI';

interface ChatWindowProps {
  character: Character | null;
  persona: UserPersona | null;
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  showCharacterPopup: (character?: Character) => void;
}

const chatWindow = (props: ChatWindowProps) => {
  const { dataset, setDataset } = useDataset();
  const [chatLog, setChatLog] = useState<StoredChatLog | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [showTypingIndicator, setShowTypingIndicator] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [numBatches, setNumBatches] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentCharacters, setCurrentCharacters] = useState<Character[]>([]);
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);

  const isDesktop = window.innerWidth > 768;

  const endOfChatRef = React.useRef<HTMLDivElement>(null);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useSelectedChatLogChangedListener((newChatLog) => {
    if (newChatLog === null) return;
    setChatMessages([])
    setChatLog(newChatLog);
    setChatMessages(newChatLog.getMessages());
  });

  const init = async () => {
    if (dataset === null) return console.log('Dataset is null');
    setChatMessages(dataset.messages);
    const newCharacters: Character[] = [];
    for (let i = 0; i < dataset.characters.length; i++) {
      const character = dataset.characters[i];
      await fetchCharacterById(character.characterId).then((character) => {
        if (!character) return;
        newCharacters.push(character);
      }).catch((error) => {
        console.log(error);
      });
    }
    setCharacterIds(dataset.characters.map((char) => char.characterId));
    setCurrentCharacters(newCharacters);
    if (dataset.characters.length > 0 && dataset.messages.length === 0) {
      if (!sendGreetingFromCharacter(newCharacters[0])) {
        sendGreetingFromCharacter(newCharacters[1]);
      }
    }
  }

  const sendGreetingFromCharacter = async (character: Character) => {
    if (character.hasGreetings) {
      const message = character.createGreetingStoredMessage();
      // find a character who is not the current character
      const ch = currentCharacters.find((char) => char._id !== character._id);
      if (!ch) return false;
      if (!message) return false;
      message.role = dataset.characters.find((char) => char.characterId === character._id)?.role ?? 'User';
      message.replacePlaceholders(ch.name);
      const newDataset = dataset;
      newDataset.messages.push(message);
      setChatMessages(newDataset.messages);
      setDataset(newDataset);
      saveDataset(newDataset);
      return true;
    }
    return false;
  }

  useEffect(() => {
    init();
  }, [dataset]);

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

  const handleSendMessage = async (newMessageText: string) => {
    if (!dataset) return;
    setMessageText('');
    const newMessage: Message = {
      userId: currentCharacter?._id ?? 'System',
      role: dataset.characters.find((char) => char.characterId === currentCharacter?._id)?.role ?? 'System',
      swipes: [newMessageText],
      currentIndex: 0,
      fallbackName: currentCharacter?.name ?? 'System',
      thought: false,
    };
    console.log(newMessage);
    const newDataset = dataset;
    newDataset.messages.push(newMessage);
    setChatMessages(newDataset.messages);
    setDataset(newDataset);
    saveDataset(newDataset);
  }

  const chatContainerStyle = isKeyboardVisible ? { maxHeight: '40vh', overflow: 'scroll' } : null;

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

  useEffect(() => {
    if (endOfChatRef.current !== null) {
      endOfChatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const generateData = async () => {
    let currentDataset = dataset;
    setLoading(true);
    await generateBatchForDataset(currentDataset, numBatches).then((newDataset) => {
      setDataset(newDataset);
      currentDataset = newDataset;
      setChatMessages(newDataset.messages);
      saveDataset(newDataset);
    }).catch((error) => {
      console.log(error);
      setShowError(true);
    });
    setChatMessages(currentDataset.messages);
    setLoading(false);
  }

  const clearMessages = () => {
    const newDataset = dataset;
    setChatMessages([]);
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
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-base-300 rounded-box p-2 md:p-6">
            <div className="flex flex-row justify-center items-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      )}
      <h3 className={"font-bold text-center flex flex-row gap-2 justify-between md:justify-center items-center"}>
        <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm" onClick={() => clearMessages()}>
          <Trash />
        </button>
        <div className="flex flex-row gap-2 justify-center items-center">
          <span className="text-xl">Number of Batches</span>
        </div>
        <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm" onClick={() => generateData()}>
          <Play />
        </button>
        <input type="number" className="dy-input dy-input-bordered dy-input-sm" value={numBatches} onChange={(e) => setNumBatches(parseInt(e.target.value))} min={1} max={2000} />
        <div className='flex flex-col text-sm'>
          <select
            aria-label='Select a character to impersonate as'
            className="dy-select dy-select-bordered"
            value={currentCharacter?._id} onChange={(e) => {
              const character = currentCharacters.find((char) => char._id === e.target.value);
              setCurrentCharacter(character ?? null);
            }}>
            <option value={''}>Impersonate as</option>
            {currentCharacters.map((character, index) => {
              return (
                <option key={index} value={character._id}>{character.name}</option>
              );
            })}
          </select>
        </div>
      </h3>
      <div className={"w-full bg-base-100 rounded-box overflow-y-scroll pl-2 pt-2 max-h-[calc(92.5vh-180px)] min-h-[calc(92.5vh-180px)]"}>
        {Array.isArray(chatMessages) && chatMessages.map((message, index) => {
          return (
            <div key={index} className={"dy-chat " + (message.role !== 'User' ? 'dy-chat-start' : 'dy-chat-end')}>
              <div key={index} className="dy-chat-header">
                {message.fallbackName ?? 'None'}
              </div>
              <div key={index} className={(message.role !== 'User' ? 'dy-chat-bubble dy-chat-bubble-secondary' : 'dy-chat-bubble')}>
                <ReactMarkdown
                  key={index}
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
        <div ref={endOfChatRef}></div>
      </div>
      <div className={`flex flex-row gap-2 justify-center min-h-[115px] max-h-[115px] md:max-h-none md:min-h-[60px] md:flex-grow`}>
        <textarea
          disabled={showError || showTypingIndicator}
          className="dy-textarea w-full h-full overflow-y-scroll resize-none"
          placeholder={`Type a message as ${currentCharacter?.name ?? 'System'}`}
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
          disabled={showError || showTypingIndicator}
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
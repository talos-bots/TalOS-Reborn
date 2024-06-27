/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, MessageCircle, PanelLeft, Save, User } from 'lucide-react';
import './CharacterCRUD.css';
import RequiredInputField, { RequiredSelectField, RequiredTextAreaField } from '../../components/shared/required-input-field';
import { useNavigate, useParams } from 'react-router-dom';
import { confirmModal } from '../../components/shared/confirm-modal';
import { Character, Origin } from '../../global_classes/Character';
import TokenTextarea from '../../components/shared/token-textarea';
import ImgRefresh from '../../components/shared/img-refresh';
import { Alert, initTE } from "tw-elements";
import { TEAlert } from 'tw-elements-react';
import { continueConversation } from '../../helpers/chat-helpers';
import { Message } from '../../global_classes/CompletionRequest';
import { importTavernCharacter, useWindowSize } from '../../helpers/character-card';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import ReactMarkdown from 'react-markdown';
import { uploadFile } from '../../api/fileServer';
import { fetchCharacterById } from '../../api/characterAPI';
import { useUser } from '../../components/shared/auth-provider';
import SpriteManager from '../../components/character/SpriteManager';

initTE({ Alert });

const modelMap = {
    'anime': 'anything-v3',
    'cartoon': 'toonyou',
    '3d': 'droodlyrielv15',
    'hyperrealistic': 'protogen-3.4'
}

type slides = 'chat' | 'sprite';

const CharacterCRUD = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const { id } = useParams<{id: string}>();
    const [avatar, setAvatar] = React.useState('');
    const [name, setName] = React.useState('');
    const [visual_description, setVisualDescription] = React.useState('');
    const [negative_prompt, setNegativePrompt] = React.useState('');
    const [description, setDescription] = useState<string>('');
    const [personality, setPersonality] = useState<string>('');
    const [mes_example, setMesExample] = useState<string>('');
    const [creator_notes, setCreatorNotes] = useState<string>('');
    const [system_prompt, setSystemPrompt] = useState<string>('');
    const [post_history_instructions, setPostHistoryInstructions] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);
    const [creator, setCreator] = useState<string>('');
    const [waitingForImage, setWaitingForImage] = React.useState(false);
    const [notAuthorized, setNotAuthorized] = React.useState(false);
    const [thought_pattern, setThoughtPattern] = useState<string>('');
    const [first_mes, setFirstMes] = useState<string>('');
    const [alternate_greetings, setAlternateGreetings] = useState<string[]>([]);
    const [scenario, setScenario] = useState<string>('');
    const [botReplyChance, setBotReplyChance] = useState<number>(50);
    const [botReplyMentionChance, setBotReplyMentionChance] = useState<number>(70);
    const [userReplyChance, setUserReplyChance] = useState<number>(100);
    const [userReplyMentionChance, setUserReplyMentionChance] = useState<number>(100);
    const [isSuccessful, setIsSuccessful] = useState<boolean>(false);
    const [imageGenerationError, setImageGenerationError] = useState<boolean>(false);
    const [currentSlide, setCurrentSlide] = useState<slides>('chat');

    useEffect(() => {
        if(!user){
            navigate(`/login?redirect=characters/${id}`);
        }
    }, [user, navigate, id]);

    const endOfChatRef = React.useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState<boolean>(false);

    const [width] = useWindowSize();

    const isDesktop = window.innerWidth > 768;

    const [testMessages, setTestMessages] = useState<Message[]>([]);
    const [testMessage, setTestMessage] = useState<string>('');

    const [modelType, setModelType] = useState<string>('anime');
    
    const handleProfilePictureChange = async (files: FileList | null) => {
        if (files === null) return;
        setWaitingForImage(true);
    
        const file = files[0];
        const fileName = await uploadFile(file);
        setAvatar(fileName);
        setWaitingForImage(false);
        //check if file is json
        if(file.type === 'application/json'){
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result;
                if(typeof text === 'string'){
                    const character = JSON.parse(text);
                    if(character !== null){
                        characterToForm(character);
                    }
                }
            }
            reader.readAsText(file);
            return;
        }
        try {
            const newCharacter = await importTavernCharacter(file).then((character) => {
                return character;
            }).catch((error) => {
                console.log(error);
                return null;
            });
            if(!newCharacter) return;
            characterToForm(newCharacter);
        } catch (error) {
            console.error("Error resizing image: ", error);
            // Handle the error appropriately
        }
        setWaitingForImage(false);
    };

    const characterToForm = (character: Character) => {
        if(character !== null){
            setName(character?.name);
            setDescription(character?.description);
            setPersonality(character?.personality);
            setMesExample(character?.mes_example);
            setCreatorNotes(character?.creator_notes);
            setSystemPrompt(character?.system_prompt);
            setPostHistoryInstructions(character?.post_history_instructions);
            setTags(character?.tags);
            setCreator(character?.creator);
            setVisualDescription(character?.visual_description);
            setThoughtPattern(character?.thought_pattern);
            setFirstMes(character?.first_mes);
            setAlternateGreetings(character?.alternate_greetings);
            setScenario(character?.scenario);
            setAvatar(character?.avatar);
            setBotReplyChance(character?.response_settings?.reply_to_bot ?? 50);
            setBotReplyMentionChance(character?.response_settings?.reply_to_bot_mention ?? 70);
            setUserReplyChance(character?.response_settings?.reply_to_user ?? 100);
            setUserReplyMentionChance(character?.response_settings?.reply_to_user_mention ?? 100);
        }
    }

    useEffect(() => {
        if(id?.trim() !== '' && id !== undefined && id !== null && id?.trim() !== 'create'){
            fetchCharacterById(id).then((character) => {
                characterToForm(character);
            }).catch((error) => {
                console.log(error);
            });
            setLoading(false);
        }else{
            setLoading(false);
        }
    }, [id]);

    // State variables to control drawer open/close
    const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
    const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

    // Handlers to toggle drawers
    const toggleLeftDrawer = (e) => {
        e.preventDefault();
        setIsLeftDrawerOpen(!isLeftDrawerOpen)
    };
    
    const toggleRightDrawer = (e) => {
        e.preventDefault();
        setIsRightDrawerOpen(!isRightDrawerOpen)
    };

    const handleSubmit = async () => {
        if((await confirmModal('Are you sure you want to submit this character?', 'The character will be editable by you and anyone the creator of this instance has marked as a moderator after submission, but it will also be publicly viewable by any users of this instance.')) === false) return;
        const newCharacter = new Character();
        if(id !== undefined && id !== null && id !== '' && id !== 'create'){
            newCharacter._id = id;
        }
        if(creator === ''){
            newCharacter.setCreator(user?.id ?? '');
        }else{
            newCharacter.setCreator(creator)
        }
        newCharacter.setName(name);
        newCharacter.setAvatar(avatar);
        newCharacter.setDescription(description);
        newCharacter.setPersonality(personality);
        newCharacter.setMesExample(mes_example);
        newCharacter.setCreatorNotes(creator_notes);
        newCharacter.setSystemPrompt(system_prompt);
        newCharacter.setPostHistoryInstructions(post_history_instructions);
        newCharacter.setTags(tags);
        newCharacter.setVisualDescription(visual_description);
        newCharacter.setThoughtPattern(thought_pattern);
        newCharacter.setFirstMes(first_mes);
        newCharacter.setAlternateGreetings(alternate_greetings);
        newCharacter.setScenario(scenario);
        newCharacter.setBotMentionReplyChance(botReplyMentionChance);
        newCharacter.setBotReplyChance(botReplyChance);
        newCharacter.setUserMentionReplyChance(userReplyMentionChance);
        newCharacter.setUserReplyChance(userReplyChance);
        newCharacter.save().then(() => {
            navigate('/characters');
        }).catch((error) => {
            console.log(error);
        });
    };

    useEffect(() => {
        if(isSuccessful === true){
            clearForm();
        }
    }, [isSuccessful]);

    useEffect(() => {
        if(endOfChatRef.current !== null){
            endOfChatRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [testMessages]);

    const handleNextSlide = () => {
        if(currentSlide === 'chat'){
            setCurrentSlide('sprite');
        }else{
            setCurrentSlide('chat');
        }
    }

    const clearForm = () => {
        setName('');
        setAvatar('');
        setDescription('');
        setPersonality('');
        setMesExample('');
        setCreatorNotes('');
        setSystemPrompt('');
        setPostHistoryInstructions('');
        setTags([]);
        setCreator('');
        setVisualDescription('');
        setThoughtPattern('');
        setFirstMes('');
        setAlternateGreetings([]);
        setScenario('');
    }

    const generateImage = async () => {
        // setWaitingForImage(true);
        // const height = 768;
        // const data = await sendImageRequest(modelMap[modelType], visual_description, negative_prompt, height);
        // console.log(data);
        // if(data === null){
        //     setWaitingForImage(false);
        //     setImageGenerationError(true);
        //     return;
        // }
        // setAvatar(data[0]);
    }
    
    if(testMessages.length > 15){
        setTestMessages([])
    }
    
    const handleFormSubmit = async (event: React.FormEvent) => {
        setIsLeftDrawerOpen(false);
        setIsRightDrawerOpen(false);
        event.preventDefault();
        // Call your submit logic here
        await handleSubmit();
    }

    const handleResponse = async (newMessage: Message) => {
        const newMessages = [...testMessages, newMessage];
        if(testMessages.includes(newMessage)){
            return;
        }
        setTestMessages([...testMessages, newMessage]);
        const newCharacter = new Character();
        if(newMessages.length < 2){
            if(first_mes !== ''){
                const assistantGreeting: Message = {
                    userId: newCharacter._id,
                    fallbackName: name.length > 0 ? name : 'Unnamed Character',
                    swipes: [first_mes],
                    currentIndex: 0,
                    role: 'Assistant',
                    thought: false,
                }
                // make the assistant message the first message in the array
                newMessages.unshift(assistantGreeting);
            }
        }
        newCharacter.name = name;
        newCharacter.avatar = avatar;
        newCharacter.description = description;
        newCharacter.personality = personality;
        newCharacter.mes_example = mes_example;
        newCharacter.creator_notes = creator_notes;
        newCharacter.system_prompt = system_prompt;
        newCharacter.post_history_instructions = post_history_instructions;
        newCharacter.tags = tags;
        newCharacter.creator = creator;
        newCharacter.visual_description = visual_description;
        newCharacter.thought_pattern = thought_pattern;
        newCharacter.first_mes = first_mes;
        newCharacter.alternate_greetings = alternate_greetings;
        newCharacter.scenario = scenario;
        const reply = await continueConversation(newMessages, newCharacter)
        if(reply !== null && reply !== undefined){
            //@ts-ignore
            setTestMessages([...newMessages, reply]);
        }
    }

    useEffect(() => {
        if(creator !== '' && creator !== user?.id.toString()){
            console.log('not authorized');
            console.log(creator);
            console.log(user?.id);
            setNotAuthorized(true);
        }else{
            setNotAuthorized(false);
        }
    }, [creator, user]);

    return (
        <div className='w-full md:h-[92.5vh] md:p-4 flex flex-col text-base-content'>
            {loading && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-base-300 rounded-box p-2 md:p-6">
                        <div className="flex flex-row justify-center items-center">
                            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary">

                            </div>
                        </div>
                    </div>
                </div>
            )}
            {imageGenerationError && (
                <TEAlert dismiss delay={5000} open={true} autohide onClose={
                    () => {
                        setImageGenerationError(false);
                    }
                } className='rounded-box bg-error text-error-content z-[1000]'>
                    <strong>Error Creating Image!</strong>
                    <span className="ml-1">
                    Our image generation service is currently unavailable. Please try again later.
                    </span>
                </TEAlert>
            )}
            <form className='w-full h-full flex flex-col md:flex-row md:gap-4' onSubmit={handleFormSubmit}>
                <div className='w-full md:rounded-box bg-base-300 p-4 max-h-[100%] overflow-y-auto'>
                    <span className='flex flex-row justify-between'>
                        <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm md:hidden" onClick={toggleLeftDrawer}>
                            <PanelLeft/>
                        </button>
                        <h2 className="text-2xl">Character Editor</h2>
                        <button className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm md:hidden" onClick={toggleRightDrawer}>
                            <MessageCircle/>
                        </button>
                    </span>
                    <p className='italic'>Fields marked with an * are required.</p>
                    <h3 className="text-xl">General</h3>
                    <div className='flex flex-col md:flex-row w-full gap-4'>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label="Name"
                                id="name"
                                placeholder="Harry Dresden"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                characterLimit={56}
                                required={true}
                                className={"w-full"}
                            />
                        </div>
                    </div>
                    <h3 className="text-xl">Appearance</h3>
                    <div className='w-full flex flex-col md:flex-row gap-4'>
                        <div className="flex flex-col w-fit">
                            <label className="font-bold w-full text-left">Avatar*</label>
                            <span className="text-sm italic">(Click to upload. Vanilla Images and Character Cards are accepted. JSON is also accepted)</span>
                            <label htmlFor="image-upload" className="relative">
                                <ImgRefresh src={avatar} alt={name} className="character-image" loading={waitingForImage} setLoading={setLoading}/>
                            </label>
                            <input
                                disabled={notAuthorized}
                                type="file" 
                                aria-label="Profile Picture"
                                name="profilePicture"
                                id="image-upload" 
                                className="hidden" 
                                accept=".png, .jpg, .jpeg, .json"
                                onChange={(e) => handleProfilePictureChange(e.target.files)}
                            />
                        </div>
                        {/* <div className='w-full flex flex-col'>
                            <div className="dy-form-control">
                                <label className="font-bold w-full text-left">Visual Style</label>
                                <select className="dy-input dy-input-bordered" title="Logic Engine"
                                    value={modelType}
                                    onChange={(e) => setModelType(e.target.value)}
                                >
                                    <option value="anime">Anime</option>
                                    <option value="cartoon">Cartoon</option>
                                    <option value="3d">3D</option>
                                    <option value="hyperrealistic">Hyperrealistic</option>
                                </select>
                            </div>
                            <RequiredTextAreaField
                                disabled={notAuthorized}
                                type="text"
                                label="Positive Prompt"
                                id="visual_description"
                                placeholder="beautiful, masterpiece, 1girl, long hair, curly bangs, blue eyes, courtyard"
                                value={visual_description}
                                onChange={(e) => setVisualDescription(e.target.value)}
                                characterLimit={256}
                                required={false}
                                className={"w-full h-full"}
                            />
                            <RequiredTextAreaField
                                disabled={notAuthorized}
                                type="text"
                                label="Negative Prompt"
                                id="negative_prompt"
                                placeholder=""
                                value={negative_prompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                characterLimit={256}
                                required={false}
                                className={"w-full h-full"}
                            />
                            <button className="dy-btn dy-btn-secondary w-full" onClick={(e) => {
                                e.preventDefault();
                                generateImage()}
                            } type='button'>Generate</button>
                        </div> */}
                    </div>
                    <h3 className="text-xl">Prompt Information*</h3>
                    <p className='dy-textarea'>Information within this category, is the only information put inside of the prompt sent to the AI, minus the name. All other information is made optional.</p>
                    <div className='flex flex-col w-full gap-4'>
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Description"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={description}
                            onChange={(e) => setDescription(e)}
                            required={false}
                            className={"w-full h-full min-h-fit"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Personality"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={personality}
                            onChange={(e) => setPersonality(e)}
                            required={false}
                            className={"w-full h-full min-h-fit"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Thought Pattern"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={thought_pattern}
                            onChange={(e) => setThoughtPattern(e)}
                            required={false}
                            className={"w-full h-full min-h-fit"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Message Examples"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={mes_example}
                            onChange={(e) => setMesExample(e)}
                            required={false}
                            className={"w-full h-full min-h-fit"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="System Prompt"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={system_prompt}
                            onChange={(e) => setSystemPrompt(e)}
                            required={false}
                            className={"w-full h-full min-h-fit"}
                        />
                        {/* <StringArrayEditorCards
                            label="Alternate Greetings"
                            disabled={notAuthorized}
                            id="alternate_greetings"
                            value={alternate_greetings}
                            onChange={(e) => setAlternateGreetings(e)}
                            className={"w-full h-full"}
                        /> */}
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Scenario"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={scenario}
                            onChange={(e) => setScenario(e)}
                            required={false}
                            className={"w-full h-full min-h-fit"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="First Message"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={first_mes}
                            onChange={(e) => setFirstMes(e)}
                            required={false}
                            className={"w-full h-full"}
                        />
                    </div>
                    <div className='flex flex-col w-full gap-4'>
                        <RequiredTextAreaField
                            disabled={notAuthorized}
                            type="text"
                            label={'Creator Notes'}
                            id="creator_notes"
                            placeholder={'Harry is a wizard, and is a private investigator.'}
                            value={creator_notes}
                            onChange={(e) => setCreatorNotes(e.target.value)}
                            characterLimit={1024}
                            required={false}
                            className={"w-full h-full"}
                        />                            
                    </div>
                    <h3 className="text-xl">Response Settings (Discord)</h3>
                    <div className='flex flex-col w-full gap-4'>
                        <div className="dy-form-control">
                            <label className="font-bold w-full text-left">Character Reply Chance</label>
                            <input
                                disabled={notAuthorized}
                                min={0}
                                max={100}
                                type="number"
                                className="dy-input dy-input-bordered"
                                value={botReplyChance}
                                onChange={(e) => setBotReplyChance(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="dy-form-control">
                            <label className="font-bold w-full text-left">Character Mention Reply Chance</label>
                            <input
                                disabled={notAuthorized}
                                min={0}
                                max={100}
                                type="number"
                                className="dy-input dy-input-bordered"
                                value={botReplyMentionChance}
                                onChange={(e) => setBotReplyMentionChance(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="dy-form-control">
                            <label className="font-bold w-full text-left">User Reply Chance</label>
                            <input
                                disabled={notAuthorized}
                                min={0}
                                max={100}
                                type="number"
                                className="dy-input dy-input-bordered"
                                value={userReplyChance}
                                onChange={(e) => setUserReplyChance(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="dy-form-control">
                            <label className="font-bold w-full text-left">User Mention Reply Chance</label>
                            <input
                                disabled={notAuthorized}
                                min={0}
                                max={100}
                                type="number"
                                className="dy-input dy-input-bordered"
                                value={userReplyMentionChance}
                                onChange={(e) => setUserReplyMentionChance(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Mobile Responsive */}
                <>
                {isDesktop ? (
                    <>
                    <div className='w-36 rounded-box bg-base-300 p-4 flex-col h-full gap-4 flex justify-center items-center'>
                        <button className='dy-btn dy-btn-accent w-full h-28' type='submit'>
                            <Save size={36} />
                        </button>
                        <button className='dy-btn dy-btn-warning w-full h-28' type='button' onClick={async () => {
                            if(await confirmModal('Are you sure you want to leave this page?', 'Any unsaved changes will be lost.')){
                                navigate('/characters')
                            }
                        }} >
                            <ArrowLeft size={36} />
                        </button>
                    </div>
                    </>
                ):(
                    <>
                    <SwipeableDrawer
                        anchor="left"
                        open={isLeftDrawerOpen}
                        onClose={toggleLeftDrawer}
                        onOpen={toggleLeftDrawer}
                        variant="temporary"
                        transitionDuration={250}
                        className="bg-transparent"
                    >
                        <div className='w-36 md:rounded-box bg-base-300 p-4 flex-col h-full gap-4 flex justify-center items-center'>
                            <button className='dy-btn dy-btn-accent w-full h-28' type='submit' onClick={(e)=>{handleFormSubmit(e)}} onTouchStart={(e)=>{handleFormSubmit(e)}}>
                                <Save size={36} />
                            </button>
                            <button className='dy-btn dy-btn-warning w-full h-28' type='button' onClick={async () => {
                                setIsLeftDrawerOpen(false);
                                if(await confirmModal('Are you sure you want to leave this page?', 'Any unsaved changes will be lost.')){
                                    navigate('/characters')
                                }
                            }} >
                                <ArrowLeft size={36} />
                            </button>
                        </div>
                    </SwipeableDrawer>
                    </>
                )}
                </>

                {currentSlide === 'chat' ? (
                    <>
                    {isDesktop ? (
                        <>
                        <div className='w-full rounded-box bg-base-300 p-4 flex-col h-full gap-4 flex'>
                            <h2 className='flex flex-row justify-between flex-grow text-2xl'>                            
                                <div className="flex gap-1">
                                    <button
                                        type='button'
                                        className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm"
                                        onClick={handleNextSlide}
                                    >
                                        <ArrowLeft/>
                                    </button>
                                    <button
                                        type='button'
                                        className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm"
                                        onClick={handleNextSlide}
                                    >
                                        <ArrowRight/>
                                    </button>
                                </div>
                                Chat <span className='text-sm italic'>{testMessages.length} of 15 Test Chats</span></h2>
                            <div className='flex-grow bg-base-100 rounded-box h-[90%] max-h-[90%] overflow-y-auto'>
                                <div className="dy-chat dy-chat-start">
                                    <div className="dy-chat-header">
                                        {name !== '' ? name : 'Harry Dresden'}
                                    </div>
                                    <div className="dy-chat-bubble dy-chat-bubble-secondary">
                                        <ReactMarkdown 
                                            components={{
                                                em: ({ node, ...props }) => <i {...props} />,
                                                b: ({ node, ...props }) => <b {...props} />,
                                                code: ({ node, ...props }) => <code {...props} />,
                                            }}
                                        >
                                            {first_mes !== '' ? first_mes.replaceAll('{{user}}', 'Test User').replaceAll('{{char}}', name) : 'Fuego!'}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                {testMessages.map((message, index) => {
                                    return (
                                        <div className={"dy-chat " + (message.role !== 'User' ? 'dy-chat-start' : 'dy-chat-end')}>
                                            <div className="dy-chat-header">
                                                {message.role !== 'User' ? (name? name : 'Harry Dresden') : 'Test User'}
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
                                    )
                                })}
                                <div className="dy-chat dy-chat-end" ref={endOfChatRef}></div>
                            </div>
                            <div className='flex flex-row justify-between flex-grow gap-2'>
                                <textarea 
                                    className='w-full h-full dy-input' 
                                    placeholder='Type a message...'
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter'){
                                            e.preventDefault();
                                            if(testMessage.trim() === '') return;
                                            handleResponse({
                                                swipes: [testMessage],
                                                currentIndex: 0,
                                                thought: false,
                                                role: 'User',
                                                userId: 'test',
                                                fallbackName: 'Test User',
                                            });
                                            setTestMessage('');
                                        }
                                    }}
                                />
                                <button 
                                role='button'
                                className='dy-btn dy-btn-accent h-full' onClick={(e) => {
                                    e.preventDefault();
                                    if(testMessage.trim() === '') return;
                                    handleResponse({
                                        swipes: [testMessage],
                                        currentIndex: 0,
                                        thought: false,
                                        role: 'User',
                                        userId: 'test',
                                        fallbackName: 'Test User',
                                    });
                                    setTestMessage('');
                                }}>Send</button>
                            </div>
                        </div>
                        </>
                    ):(
                        <SwipeableDrawer
                            anchor="right"
                            open={isRightDrawerOpen}
                            onClose={toggleRightDrawer}
                            onOpen={toggleRightDrawer}
                            variant="temporary"
                            SlideProps={{ 
                                direction: 'left',
                            }}
                            transitionDuration={250}
                            className="bg-transparent"
                        >
                            <div className='w-full bg-base-300 p-2 flex-col h-full gap-4 flex'>
                                <h2 className='flex flex-row justify-between flex-grow text-2xl'>
                                    <div className="flex gap-1">
                                        <button
                                            type='button'
                                            className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm"
                                            onClick={handleNextSlide}
                                        >
                                            <ArrowLeft/>
                                        </button>
                                        <button
                                            type='button'
                                            className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm"
                                            onClick={handleNextSlide}
                                        >
                                            <ArrowRight/>
                                        </button>
                                    </div>
                                    Chat
                                    <span className='text-sm italic'>{testMessages.length} of 15 Test Chats</span>
                                </h2>
                                <div className='flex-grow bg-base-100 rounded-box h-[90%] max-h-[90%] overflow-y-auto'>
                                    <div className="dy-chat dy-chat-start">
                                        <div className="dy-chat-header">
                                            {name !== '' ? name : 'Harry Dresden'}
                                        </div>
                                        <div className="dy-chat-bubble dy-chat-bubble-secondary">
                                            <ReactMarkdown 
                                                components={{
                                                    em: ({ node, ...props }) => <i {...props} />,
                                                    b: ({ node, ...props }) => <b {...props} />,
                                                    code: ({ node, ...props }) => <code {...props} />,
                                                }}
                                            >
                                                {first_mes !== '' ? first_mes.replaceAll('{{user}}', 'Test User').replaceAll('{{char}}', name) : 'Fuego!'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    {testMessages.map((message, index) => {
                                        return (
                                            <div className={"dy-chat " + (message.role !== 'User' ? 'dy-chat-start' : 'dy-chat-end')}>
                                                <div className="dy-chat-header">
                                                    {message.role !== 'User' ? (name? name : 'Harry Dresden') : 'Test User'}
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
                                        )
                                    })}
                                    <div className="dy-chat dy-chat-end" ref={endOfChatRef}></div>
                                </div>
                                <div className='flex flex-row justify-between flex-grow gap-2'>
                                    <textarea 
                                        className='w-full h-full dy-input' 
                                        placeholder='Type a message...'
                                        value={testMessage}
                                        onChange={(e) => setTestMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter'){
                                                e.preventDefault();
                                                if(testMessage.trim() === '') return;
                                                handleResponse({
                                                    swipes: [testMessage],
                                                    currentIndex: 0,
                                                    thought: false,
                                                    role: 'User',
                                                    userId: 'Test User',
                                                    fallbackName: 'Test User',
                                                });
                                                setTestMessage('');
                                            }
                                        }}
                                    />
                                    <button 
                                    role='button'
                                    className='dy-btn dy-btn-accent h-full' onClick={(e) => {
                                        e.preventDefault();
                                        if(testMessage.trim() === '') return;
                                        handleResponse({
                                            swipes: [testMessage],
                                            currentIndex: 0,
                                            thought: false,
                                            role: 'User',
                                            userId: 'Test User',
                                            fallbackName: 'Test User',
                                        });
                                        setTestMessage('');
                                    }}>Send</button>
                                </div>
                            </div>
                        </SwipeableDrawer>
                    )}
                    </>
                ) : (
                    <>
                    {isDesktop ? (
                        <div className='w-full rounded-box bg-base-300 p-4 flex-col h-full flex gap-4'>
                            <h2 className='flex flex-row justify-between text-2xl h-fit'>                            
                                <div className="flex gap-1">
                                    <button
                                        type='button'
                                        className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm"
                                        onClick={handleNextSlide}
                                    >
                                        <ArrowLeft/>
                                    </button>
                                    <button
                                        type='button'
                                        className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm"
                                        onClick={handleNextSlide}
                                    >
                                        <ArrowRight/>
                                    </button>
                                </div>
                                Sprite Manager
                            </h2>
                            <div className='flex flex-col flex-grow'>
                                <SpriteManager characterid={id} />
                            </div>
                        </div>
                    ) : (
                        <SwipeableDrawer
                            anchor="right"
                            open={isRightDrawerOpen}
                            onClose={toggleRightDrawer}
                            onOpen={toggleRightDrawer}
                            variant="temporary"
                            SlideProps={{ 
                                direction: 'left',
                            }}
                            transitionDuration={250}
                            className="bg-transparent"
                        >
                            <div className='w-full bg-base-300 p-2 flex-col h-full flex gap-4'>
                                <h2 className='flex flex-row justify-between text-2xl h-fit'>                            
                                    <div className="flex gap-1">
                                        <button
                                            type='button'
                                            className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm"
                                            onClick={handleNextSlide}
                                        >
                                            <ArrowLeft/>
                                        </button>
                                        <button
                                            type='button'
                                            className="dy-btn dy-btn-secondary dy-btn-outline dy-btn-sm"
                                            onClick={handleNextSlide}
                                        >
                                            <ArrowRight/>
                                        </button>
                                    </div>
                                    Sprite Manager
                                </h2>
                                <div className='flex flex-col flex-grow'>
                                    <SpriteManager characterid={id} />
                                </div>
                            </div>
                        </SwipeableDrawer>
                    )}
                    </>
                )}
            </form>
        </div>
    );
};

export default CharacterCRUD;

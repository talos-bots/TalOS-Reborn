/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { firebaseApp, firebaseCloudstore, firebaseProfilePicturesRef, firebaseStorage } from '../../firebase-config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ArrowLeft, MessageCircle, PanelLeft, Save, User } from 'lucide-react';
import './CharacterCRUD.css';
import RequiredInputField, { RequiredSelectField, RequiredTextAreaField } from '../../components/shared/required-input-field';
import { useNavigate, useParams } from 'react-router-dom';
import { VerificationInformation } from '../../global_classes/VerificationStatus';
import { Auth, getAuth } from 'firebase/auth';
import { confirmModal } from '../../components/shared/confirm-modal';
import { checkIsAdmin } from '../../firebase_api/adminAPI';
import { Character, Origin } from '../../global_classes/Character';
import { getCharacter } from '../../firebase_api/characterAPI';
import { sendImageRequest } from '../../firebase_api/imageAPI';
import StringArrayEditorCards from '../../components/shared/string-array-editor-cards';
import TokenTextarea from '../../components/shared/token-textarea';
import ImgRefresh from '../../components/shared/img-refresh';
import { Alert, initTE} from "tw-elements";
import { TEAlert } from 'tw-elements-react';
import { continueConversation } from '../../helpers/chat-helpers';
import { Message } from '../../global_classes/CompletionRequest';
import { hasBetaAccess } from '../../firebase_api/userAPI';
import { importTavernCharacter, useWindowSize } from '../../helpers/character-card';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import ReactMarkdown from 'react-markdown';

initTE({ Alert });

type gender = 'Male' | 'Female' | 'Non-Binary' | 'Other';

const modelMap = {
    'anime': 'anything-v3',
    'cartoon': 'toonyou',
    '3d': 'droodlyrielv15',
    'hyperrealistic': 'protogen-3.4'
}
interface CharacterCRUDProps {
    auth: Auth;
    logout: () => void;
    isProduction: boolean;
}

const CharacterCRUD = (props: CharacterCRUDProps) => {
    const { auth, logout, isProduction } = props;
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    
    useEffect(() => {
        auth.authStateReady().then(() => {
            if(auth.currentUser === null){
                navigate('/login?location=create');
            }else{
                const init = async () => {
                    const admin = await checkIsAdmin(auth?.currentUser?.uid).then((result) => {
                        return result;
                    }).catch((error) => {
                        console.log(error);
                        return false;
                    });
                    setIsAdmin(admin);
                    hasBetaAccess().then((result) => {
                        if(result === false){
                            navigate('/account');
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                }
                init();
            }
        });
    }, [auth, navigate]);

    const endOfChatRef = React.useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState<boolean>(true);

    const [width] = useWindowSize();

    const isDesktop = width >= 1024;

    const { id } = useParams<{id: string}>();
    const [avatar, setAvatar] = React.useState('');
    const [name, setName] = React.useState('');
    const [species, setSpecies] = useState<string>('Human');
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [middleName, setMiddleName] = useState<string>('');
    const [visual_description, setVisualDescription] = React.useState('');
    const [negative_prompt, setNegativePrompt] = React.useState('');
    const [description, setDescription] = useState<string>('');
    const [personality, setPersonality] = useState<string>('');
    const [eyeColor, setEyeColor] = useState<string>('');
    const [hairColor, setHairColor] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [skinColor, setSkinColor] = useState<string>('');
    const [gender, setGender] = useState<gender>('Other');
    const [sexuality, setSexuality] = useState<string>('');
    const [ethnicity, setEthnicity] = useState<string>('');
    const [familyDescription, setFamilyDescription] = useState<string>('');
    const [faceDescription, setFaceDescription] = useState<string>('');
    const [bodyDescription, setBodyDescription] = useState<string>('');
    const [clothingDescription, setClothingDescription] = useState<string>('');
    const [mes_example, setMesExample] = useState<string>('');
    const [creator_notes, setCreatorNotes] = useState<string>('');
    const [system_prompt, setSystemPrompt] = useState<string>('');
    const [post_history_instructions, setPostHistoryInstructions] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);
    const [creator, setCreator] = useState<string>('');
    const [verification_info, setVerificationInfo] = useState<VerificationInformation>(new VerificationInformation());
    const [journalEntries, setJournalEntries] = useState<number>(0);
    const [tagline, setTagline] = useState<string>('');
    const [backgroundURL, setBackgroundURL] = useState<string>('');
    const [grade, setGrade] = useState<number>(0);
    const [waitingForImage, setWaitingForImage] = React.useState(false);
    const [notAuthorized, setNotAuthorized] = React.useState(false);
    const [thought_pattern, setThoughtPattern] = useState<string>('');
    const [ooc_blurbs, setOOCBlurbs] = useState<string[]>([]);
    const [canon, setCanon] = useState<boolean>(false);
    const [votes, setVotes] = useState<string[]>([]);
    const [first_mes, setFirstMes] = useState<string>('');
    const [alternate_greetings, setAlternateGreetings] = useState<string[]>([]);
    const [scenario, setScenario] = useState<string>('');
    const [isSuccessful, setIsSuccessful] = useState<boolean>(false);
    const [waitingForBackgroundImage, setWaitingForBackgroundImage] = useState<boolean>(false);
    const [origin, setOrigin] = useState<Origin>('WyvernChat');
    const [nsfw, setNSFW] = useState<boolean>(false);
    const [imageGenerationError, setImageGenerationError] = useState<boolean>(false);

    const [testMessages, setTestMessages] = useState<Message[]>([]);
    const [testMessage, setTestMessage] = useState<string>('');

    const [modelType, setModelType] = useState<string>('anime');
    
    const handleProfilePictureChange = async (files: FileList | null) => {
        if (files === null) return;
        setWaitingForImage(true);
    
        const file = files[0];

        try {
            const storageRef = firebaseProfilePicturesRef;
            const fileRef = ref(storageRef, `${Date.now().toString()}.jpeg`);
            const snapshot = await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            setAvatar(downloadURL);
            const newCharacter = await importTavernCharacter(file);
            if(!newCharacter) return;
            characterToForm(newCharacter, downloadURL);
        } catch (error) {
            console.error("Error resizing image: ", error);
            // Handle the error appropriately
        }
        setWaitingForImage(false);
    };

    const characterToForm = (character: Character, avatarURL?: string) => {
        if(character !== null){
            setName(character?.name);
            setAvatar(avatarURL ?? character?.avatar);
            setDescription(character?.description);
            setPersonality(character?.personality);
            setSpecies(character?.species);
            setEyeColor(character?.eye_color);
            setHairColor(character?.hair_color);
            setHeight(character?.height);
            setWeight(character?.weight);
            setSkinColor(character?.skin_color);
            setSexuality(character?.sexuality);
            setEthnicity(character?.ethnicity)
            setFamilyDescription(character?.family_description);
            setFaceDescription(character?.face_description);
            setBodyDescription(character?.body_description);
            setClothingDescription(character?.clothing_description);
            setGender(character?.gender)
            setMesExample(character?.mes_example);
            setCreatorNotes(character?.creator_notes);
            setSystemPrompt(character?.system_prompt);
            setPostHistoryInstructions(character?.post_history_instructions);
            setTags(character?.tags);
            setCreator(character?.creator);
            setVerificationInfo(character?.verification_info as VerificationInformation);
            setJournalEntries(character?.journalEntries);
            setTagline(character?.tagline);
            setFirstName(character?.firstName);
            setLastName(character?.lastName);
            setMiddleName(character?.middleName);
            setBackgroundURL(character?.backgroundURL);
            setGrade(character?.grade);
            setVisualDescription(character?.visual_description);
            setThoughtPattern(character?.thought_pattern);
            setOOCBlurbs(character?.ooc_blurbs);
            setCanon(character?.canon);
            setVotes(character?.votes);
            setFirstMes(character?.first_mes);
            setAlternateGreetings(character?.alternate_greetings);
            setScenario(character?.scenario);
            setOrigin(character?.origin);
            setNSFW(character?.nsfw);
        }
    }

    useEffect(() => {
        if(id?.trim() !== '' && id !== undefined && id !== null && id?.trim() !== 'create'){
            getCharacter(id).then((character) => {
                characterToForm(character);
            }).catch((error) => {
                console.log(error);
            });
            setLoading(false);
        }else{
            setLoading(false);
        }
    }, [id, auth.currentUser?.uid, isAdmin]);

    // State variables to control drawer open/close
    const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
    const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

    // Handlers to toggle drawers
    const toggleLeftDrawer = () => setIsLeftDrawerOpen(!isLeftDrawerOpen);
    const toggleRightDrawer = () => setIsRightDrawerOpen(!isRightDrawerOpen);

    const handleSubmit = async () => {
        if((await confirmModal('Are you sure you want to submit this character?', 'This character will only be visible from within your private chats until it is approved and vetted by a curator.')) === false) return;
        const newCharacter = new Character();
        if(id !== undefined && id !== null && id !== '' && id !== 'create'){
            newCharacter._id = id;
        }
        newCharacter.setName(name);
        newCharacter.setSpecies(species);
        newCharacter.setAvatar(avatar);
        newCharacter.setDescription(description);
        newCharacter.setPersonality(personality);
        newCharacter.setEyeColor(eyeColor);
        newCharacter.setHairColor(hairColor);
        newCharacter.setHeight(height);
        newCharacter.setWeight(weight);
        newCharacter.setSkinColor(skinColor);
        newCharacter.setGender(gender);
        newCharacter.setSexuality(sexuality);
        newCharacter.setEthnicity(ethnicity);
        newCharacter.setFamilyDescription(familyDescription);
        newCharacter.setFaceDescription(faceDescription);
        newCharacter.setBodyDescription(bodyDescription);
        newCharacter.setClothingDescription(clothingDescription);
        newCharacter.setMesExample(mes_example);
        newCharacter.setCreatorNotes(creator_notes);
        newCharacter.setSystemPrompt(system_prompt);
        newCharacter.setPostHistoryInstructions(post_history_instructions);
        newCharacter.setTags(tags);
        newCharacter.setCreator(creator);
        newCharacter.setVerificationInfo(verification_info);
        newCharacter.setJournalEntries(journalEntries);
        newCharacter.setTagline(tagline);
        newCharacter.setFirstName(firstName);
        newCharacter.setLastName(lastName);
        newCharacter.setMiddleName(middleName);
        newCharacter.setBackgroundURL(backgroundURL);
        newCharacter.setGrade(grade);
        newCharacter.setVisualDescription(visual_description);
        newCharacter.setThoughtPattern(thought_pattern);
        newCharacter.setOOCBlurbs(ooc_blurbs);
        newCharacter.setCanon(canon);
        newCharacter.setVotes(votes);
        newCharacter.setFirstMes(first_mes);
        newCharacter.setAlternateGreetings(alternate_greetings);
        newCharacter.setScenario(scenario);
        newCharacter.setOrigin(origin);
        newCharacter.setNSFW(nsfw);
        newCharacter.save().then((result) => {
            setIsSuccessful(result);
            navigate('/characters');
        }).catch((error) => {
            console.log(error);
        });
    };
    
    useEffect(() => {
        if(creator !== '' && creator !== undefined && creator !== null){
            setNotAuthorized(creator !== auth?.currentUser?.uid && !isAdmin);
        }
    }, [creator, auth, isAdmin]);

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

    // const handleBackgroundPictureChange = async (files: FileList | null) => {
    //     if (files === null) return;
    //     setWaitingForBackgroundImage(true);
    
    //     const file = files[0];
    
    //     try {
    //         const storageRef = ref(firebaseStorage, `backgrounds`);
    //         const fileRef = ref(storageRef, `${Date.now().toString()}.jpeg`);
    //         const snapshot = await uploadBytes(fileRef, file);
    //         const downloadURL = await getDownloadURL(snapshot.ref);
    //         setBackgroundURL(downloadURL);
    //     } catch (error) {
    //         console.error("Error resizing image: ", error);
    //         // Handle the error appropriately
    //     }
    //     setWaitingForBackgroundImage(false);
    // };

    const clearForm = () => {
        setName('');
        setAvatar('');
        setSpecies('');
        setSexuality('');
        setEyeColor('');
        setHairColor('');
        setHeight('');
        setWeight('');
        setSkinColor('');
        setEthnicity('');
        setFamilyDescription('');
        setFaceDescription('');
        setBodyDescription('');
        setClothingDescription('');
        setDescription('');
        setPersonality('');
        setMesExample('');
        setCreatorNotes('');
        setSystemPrompt('');
        setPostHistoryInstructions('');
        setTags([]);
        setCreator('');
        setVerificationInfo(new VerificationInformation());
        setJournalEntries(0);
        setTagline('');
        setFirstName('');
        setLastName('');
        setMiddleName('');
        setBackgroundURL('');
        setGrade(null);
        setVisualDescription('');
        setThoughtPattern('');
        setOOCBlurbs([]);
        setCanon(false);
        setVotes([]);
        setFirstMes('');
        setAlternateGreetings([]);
        setScenario('');
    }

    const generateImage = async () => {
        setWaitingForImage(true);
        const height = 768;
        const data = await sendImageRequest(modelMap[modelType], visual_description, negative_prompt, height);
        console.log(data);
        if(data === null){
            setWaitingForImage(false);
            setImageGenerationError(true);
            return;
        }
        setAvatar(data[0]);
    }
    
    if(testMessages.length > 15){
        setTestMessages([])
    }
    
    const handleFormSubmit = async (event: React.FormEvent) => {
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
        newCharacter.species = species;
        newCharacter.avatar = avatar;
        newCharacter.description = description;
        newCharacter.personality = personality;
        newCharacter.eye_color = eyeColor;
        newCharacter.hair_color = hairColor;
        newCharacter.height = height;
        newCharacter.weight = weight;
        newCharacter.skin_color = skinColor;
        newCharacter.gender = gender;
        newCharacter.sexuality = sexuality;
        newCharacter.family_description = familyDescription;
        newCharacter.face_description = faceDescription;
        newCharacter.body_description = bodyDescription;
        newCharacter.clothing_description = clothingDescription;
        newCharacter.ethnicity = ethnicity;
        newCharacter.mes_example = mes_example;
        newCharacter.creator_notes = creator_notes;
        newCharacter.system_prompt = system_prompt;
        newCharacter.post_history_instructions = post_history_instructions;
        newCharacter.tags = tags;
        newCharacter.creator = creator;
        newCharacter.verification_info = verification_info;
        newCharacter.journalEntries = journalEntries;
        newCharacter.tagline = tagline;
        newCharacter.firstName = firstName;
        newCharacter.lastName = lastName;
        newCharacter.middleName = middleName;
        newCharacter.backgroundURL = backgroundURL;
        newCharacter.grade = grade;
        newCharacter.visual_description = visual_description;
        newCharacter.thought_pattern = thought_pattern;
        newCharacter.ooc_blurbs = ooc_blurbs;
        newCharacter.first_mes = first_mes;
        newCharacter.alternate_greetings = alternate_greetings;
        newCharacter.scenario = scenario;
        const reply = await continueConversation(newMessages, newCharacter)
        if(reply !== null){
            setTestMessages([...newMessages, reply]);
        }
    }

    return (
        <div className='w-full h-[95vh] md:p-4 flex flex-col text-base-content'>
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
                } className='rounded-box bg-error text-error-content'>
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
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label="Species"
                                id="species"
                                placeholder="Human"
                                value={species}
                                onChange={(e) => setSpecies(e.target.value)}
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
                            <span className="text-sm italic">(Click to upload. Vanilla Images and Character Cards are accepted.)</span>
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
                                accept=".png, .jpg, .jpeg"
                                onChange={(e) => handleProfilePictureChange(e.target.files)}
                            />
                        </div>
                        <div className='w-full flex flex-col'>
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
                        </div>
                    </div>
                    <h3 className="text-xl">Prompt Information*</h3>
                    <p className='dy-textarea'>Information within this category, is the only information put inside of the prompt sent to the AI, minus the name. All other information is made optional for usage inside of the Text RPG modes. Our backend prompts are identical to the community chat format for each model. If you want more information on how to create and format a character, consult the Guides page under 'Character Creation'.</p>
                    <div className='flex flex-col w-full gap-4'>
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Description"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={description}
                            onChange={(e) => setDescription(e)}
                            required={true}
                            className={"w-full h-full"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Personality"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={personality}
                            onChange={(e) => setPersonality(e)}
                            required={false}
                            className={"w-full h-full"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Thought Pattern"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={thought_pattern}
                            onChange={(e) => setThoughtPattern(e)}
                            required={false}
                            className={"w-full h-full"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Message Examples"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={mes_example}
                            onChange={(e) => setMesExample(e)}
                            required={false}
                            className={"w-full h-full"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="System Prompt"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={system_prompt}
                            onChange={(e) => setSystemPrompt(e)}
                            required={false}
                            className={"w-full h-full"}
                        />
                        <StringArrayEditorCards
                            label="Alternate Greetings"
                            disabled={notAuthorized}
                            id="alternate_greetings"
                            value={alternate_greetings}
                            onChange={(e) => setAlternateGreetings(e)}
                            className={"w-full h-full"}
                        />
                        <TokenTextarea
                            disabled={notAuthorized}
                            label="Scenario"
                            placeholder="{{char}} is a wizard, and is a private investigator. {{char}} wants to help {{user}} with their problem."
                            value={scenario}
                            onChange={(e) => setScenario(e)}
                            required={false}
                            className={"w-full h-full"}
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
                    <h3 className="text-xl">Appearance (Extras)</h3>
                    <div className='flex flex-col w-full gap-4'>
                        <RequiredTextAreaField
                            disabled={notAuthorized}
                            type="text"
                            label="Face Description"
                            id="face_description"
                            placeholder="Harry has a square jaw, with a small scar on his left cheek. His eyes are blue, and his hair is brown."
                            value={faceDescription}
                            onChange={(e) => setFaceDescription(e.target.value)}
                            characterLimit={1024}
                            required={false}
                            className={"w-full h-full"}
                        />
                        <RequiredTextAreaField
                            disabled={notAuthorized}
                            type="text"
                            label="Body Description"
                            id="body_description"
                            placeholder="Harry is tall and muscular, with a large scar on his chest."
                            value={bodyDescription}
                            onChange={(e) => setBodyDescription(e.target.value)}
                            characterLimit={1024}
                            required={false}
                            className={"w-full h-full"}
                        />
                        <RequiredTextAreaField
                            disabled={notAuthorized}
                            type="text"
                            label="Clothing Description"
                            id="clothing_description"
                            placeholder="Harry wears a black duster, with a pentacle amulet around his neck."
                            value={clothingDescription}
                            onChange={(e) => setClothingDescription(e.target.value)}
                            characterLimit={1024}
                            required={false}
                            className={"w-full h-full"}
                        />
                    </div>
                    <h3 className="text-xl">Bio</h3>
                    <div className='flex flex-col md:flex-row w-full gap-4'>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label="First Name"
                                id="first_name"
                                placeholder="Harry"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                characterLimit={56}
                                required={false}
                                className={"w-full"}
                            />
                        </div>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label="Middle Name"
                                id="middle_name"
                                placeholder="Blackstone Copperfield"
                                value={middleName}
                                onChange={(e) => setMiddleName(e.target.value)}
                                characterLimit={56}
                                required={false}
                                className={"w-full"}
                            />
                        </div>
                    </div>
                    <div className='flex flex-col md:flex-row w-full gap-4'>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label="Last Name"
                                id="last_name"
                                placeholder="Dresden"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                characterLimit={56}
                                required={false}
                                className={"w-full"}
                            />
                        </div>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label="Eye Color"
                                id="eye_color"
                                placeholder="Blue"
                                value={eyeColor}
                                onChange={(e) => setEyeColor(e.target.value)}
                                characterLimit={36}
                                required={false}
                                className={"w-full"}
                            />
                        </div>
                    </div>
                    <div className='flex flex-col md:flex-row w-full gap-4'>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label="Hair Color"
                                id="hair_color"
                                placeholder="Black"
                                value={hairColor}
                                onChange={(e) => setHairColor(e.target.value)}
                                characterLimit={36}
                                required={false}
                                className={"w-full"}
                            />
                        </div>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label="Height"
                                id="height"
                                placeholder="6'4"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                                characterLimit={36}
                                required={false}
                                className={"w-full"}
                            />
                        </div>
                    </div>
                    <div className='flex flex-col md:flex-row w-full gap-4'>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label="Weight"
                                id="weight"
                                placeholder="230 lbs"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                characterLimit={36}
                                required={false}
                                className={"w-full"}
                            />
                        </div>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label={'Skin Color'}
                                placeholder={'White'}
                                value={skinColor}
                                onChange={(e) => setSkinColor(e.target.value)}
                                characterLimit={36}
                                required={false}
                                className={"w-full"}
                            />
                        </div>
                    </div>
                    <div className='flex flex-col md:flex-row w-full gap-4'>
                        <div className="flex flex-col w-full">
                            <RequiredSelectField
                                disabled={notAuthorized}
                                label={'Gender'}
                                value={gender}
                                className={"w-full"}
                                required={false}
                                onChange={(e) => setGender(e.target.value as gender)}
                            >
                                <option value={'Other'}>Other</option>
                                <option value={'Male'}>Male</option>
                                <option value={'Female'}>Female</option>
                                <option value={'Non-Binary'}>Non-Binary</option>
                            </RequiredSelectField>
                        </div>
                        <div className="flex flex-col w-full">
                            <RequiredInputField
                                disabled={notAuthorized}
                                type="text"
                                label={'Sexuality'}
                                placeholder={'Straight'}
                                value={sexuality}
                                onChange={(e) => setSexuality(e.target.value)}
                                characterLimit={36}
                                required={false}
                                className={"w-full"}
                            />
                        </div>
                    </div>
                    <h3 className='text-xl'>Background</h3>
                    <div className='flex flex-col md:flex-row w-full gap-4'>
                        <RequiredInputField
                            disabled={notAuthorized}
                            type="text"
                            label={'Ethnicity'}
                            id="ethnicity"
                            placeholder={'German'}
                            value={ethnicity}
                            onChange={(e) => setEthnicity(e.target.value)}
                            characterLimit={36}
                            required={false}
                            className={"w-full"}
                        />
                        <RequiredInputField
                            disabled={notAuthorized}
                            type="text"
                            label={'Tagline'}
                            id="tagline"
                            placeholder={'Wizard for Hire'}
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            characterLimit={36}
                            required={false}
                            className={"w-full"}
                        />
                    </div>
                    <div className='flex flex-col w-full gap-4'>
                        <RequiredTextAreaField
                            disabled={notAuthorized}
                            type="text"
                            label="Family Description"
                            id="family_description"
                            placeholder="Harry's mother died when he was young, and his father was killed by a demon. He was raised by his uncle, who was a wizard."
                            value={familyDescription}
                            onChange={(e) => setFamilyDescription(e.target.value)}
                            characterLimit={1024}
                            required={false}
                            className={"w-full h-full"}
                        />
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
                    </SwipeableDrawer>
                    </>
                )}
                </>

                {/* Mobile Responsive */}
                <>
                {isDesktop ? (
                    <>
                    <div className='w-full rounded-box bg-base-300 p-4 flex-col h-full gap-4 flex'>
                        <h2 className='flex flex-row justify-between flex-grow text-2xl'>Chat <span className='text-sm italic'>{testMessages.length} of 15 Test Chats</span></h2>
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
                                        {first_mes !== '' ? first_mes.replaceAll('{{user}}', auth?.currentUser?.displayName).replaceAll('{{char}}', name) : 'Fuego!'}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            {testMessages.map((message, index) => {
                                return (
                                    <div className={"dy-chat " + (message.role !== 'User' ? 'dy-chat-start' : 'dy-chat-end')}>
                                        <div className="dy-chat-header">
                                            {message.role !== 'User' ? (name? name : 'Harry Dresden') : auth.currentUser?.displayName}
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
                                            userId: auth.currentUser?.uid,
                                            fallbackName: auth.currentUser?.displayName,
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
                                    userId: auth.currentUser?.uid,
                                    fallbackName: auth.currentUser?.displayName,
                                });
                                setTestMessage('');
                            }}>Send</button>
                        </div>
                    </div>
                    </>
                ):(
                    <>
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
                            <h2 className='flex flex-row justify-between flex-grow text-2xl'>Chat <span className='text-sm italic'>{testMessages.length} of 15 Test Chats</span></h2>
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
                                            {first_mes !== '' ? first_mes.replaceAll('{{user}}', auth?.currentUser?.displayName).replaceAll('{{char}}', name) : 'Fuego!'}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                {testMessages.map((message, index) => {
                                    return (
                                        <div className={"dy-chat " + (message.role !== 'User' ? 'dy-chat-start' : 'dy-chat-end')}>
                                            <div className="dy-chat-header">
                                                {message.role !== 'User' ? (name? name : 'Harry Dresden') : auth.currentUser?.displayName}
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
                                                userId: auth.currentUser?.uid,
                                                fallbackName: auth.currentUser?.displayName,
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
                                        userId: auth.currentUser?.uid,
                                        fallbackName: auth.currentUser?.displayName,
                                    });
                                    setTestMessage('');
                                }}>Send</button>
                            </div>
                        </div>
                    </SwipeableDrawer>
                    </>
                )}
                </>
                
            </form>
        </div>
    );
};

export default CharacterCRUD;

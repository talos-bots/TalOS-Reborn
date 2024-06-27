import React, { useEffect, useState } from "react";
import './CharacterComponent.css';
import { Download, Edit, Info, MessageCircle, Trash } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Character } from "../../../global_classes/Character";
import { confirmModal } from "../confirm-modal";
import { deleteCharacterById, getUserdataByID } from "../../../api/characterAPI";
import { useUser } from "../auth-provider";
import { saveTavernCardAsImage } from "../../../helpers/character-card";

interface CharacterComponentProps {
    character: Character | null;
    activateProfilePopup: (character: Character) => void;
}

const CharacterComponent = (props: CharacterComponentProps) => {
    const { character } = props;
    const { user } = useUser();

    const defaultPhotoURL = 'https://firebasestorage.googleapis.com/v0/b/koios-academy.appspot.com/o/imagegenexample.png?alt=media&token=6d5a83d2-0824-40eb-9b0d-7a2fa861c035';
    const [photoURL, setPhotoURL] = useState(character?.avatar || defaultPhotoURL);
    const [displayName, setDisplayName] = useState(character?.name || 'Guest');

    const [creatorName, setCreatorName] = useState<string>('');
	const [creatorProfilePic, setCreatorProfilePic] = useState<string>('');
    const [isAuthor, setIsAuthor] = useState<boolean>(false);

    useEffect(() => {
		if (character) {
			getUserdataByID(character.creator).then((newUser) => {
				setCreatorName(newUser?.displayName || '');
                if(newUser?.profilePic && newUser?.profilePic.trim().length > 0){
                    setCreatorProfilePic(newUser?.profilePic);
                } else {
                    setCreatorProfilePic(defaultPhotoURL);
                }
                if(newUser?.id === user?.id) {
                    setIsAuthor(true);
                }
			}).catch((err) => {
				console.error(err);
			});
		}
	}, [character, user]);

    const navigate = useNavigate();
    const location = useLocation();
    
    useEffect(() => {
        setPhotoURL(character?.avatar || defaultPhotoURL);
        setDisplayName(character?.name || 'Guest');
    }, [character]);

    const deleteSelf = async () => {
        if (character) {
            if(await confirmModal('Are you sure you want to delete this character?')){
                await deleteCharacterById(character._id);
            }
        }
    }

    const openProfilePopup = () => {
        if (character) {
            props.activateProfilePopup(character);
        }
    }
  
    // Function to change the chatID
    const changeCharacterID = () => {
        if(character === null) return;
        // Create a new URLSearchParams object based on the current query string
        const queryParams = new URLSearchParams(location.search);
    
        // Set the new chatID
        queryParams.set('characterID', character._id);
    
        // Replace the current entry in the history stack
        navigate(`/chat?${queryParams.toString()}`);
    };

    const handleConstructExport = async () => {
        if(character === null) return;
        const url = await saveTavernCardAsImage(character);
        const element = document.createElement("a");
        element.href = url;
        element.download = `${character.name}.png`;
        document.body.appendChild(element);
        element.click();
    }
    
    return (
        <div className="p-4 rounded-box bg-base-300 grid grid-cols-3 justify-between gap-2 text-base-content max-h-[260px] h-[260px]">
            <div className="flex flex-col gap-1 col-span-1">
                <h3 className="character-name text-left text-ellipsis line-clamp-1">{displayName}</h3>
                <img className="rounded-md flex-grow character-photo" src={photoURL} alt="character"/>
                <div className="grid grid-cols-3 justify-center mt-2 gap-1 items-center grid-">
                    <button className="dy-btn dy-btn-sm dy-btn-info" onClick={(e) => {e.preventDefault(); openProfilePopup()}}><Info/></button>
                    <button className="dy-btn dy-btn-sm dy-btn-info" onClick={(e) => {e.preventDefault(); changeCharacterID()}}><MessageCircle/></button>
                    <button className="dy-btn dy-btn-sm dy-btn-info" onClick={(e) => {e.preventDefault(); handleConstructExport()}}><Download/></button>
                </div>
            </div>
            <div className="flex flex-col gap-1 col-span-2 justify-between">
                <div className="flex flex-row justify-between">
                    <h4 className="text-left text-ellipsis line-clamp-1 text-xl flex-grow">{character?.description.length > 1 ? 'Description' : 'Personality'}</h4>
                    <div className={"flex flex-row gap-1 " + (!isAuthor && 'hidden')}>
                        <NavLink className="dy-btn dy-btn-xs dy-btn-info dy-btn-outline" title="Edit" to={`/characters/${character?._id}`}>
                            <Edit />
                        </NavLink>
                        <button className="dy-btn dy-btn-xs dy-btn-error dy-btn-outline" onClick={(e) => {
                            e.preventDefault();
                            deleteSelf();
                        }}>
                            <Trash />
                        </button>
                    </div>
                </div>
                <p className="text-left line-clamp-4 overflow-y-scroll text-clip dy-textarea flex-grow">{character?.description.length > 1 ? character?.description : character?.personality}</p>
                <span className="text-left text-ellipsis line-clamp-1 flex flex-row gap-1 items-center justify-end">{creatorName} <img className="rounded-full h-8 w-8" src={creatorProfilePic} alt="creator"/></span>
            </div>
        </div>
    );
}
export default CharacterComponent;
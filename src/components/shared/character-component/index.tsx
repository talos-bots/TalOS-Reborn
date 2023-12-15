import React, { useEffect, useState } from "react";
import './CharacterComponent.css';
import { Edit, Info, MessageCircle, Trash } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Character } from "../../../global_classes/Character";
import { confirmModal } from "../confirm-modal";
import { deleteCharacter } from "../../../api/characterDB";

interface CharacterComponentProps {
    character: Character | null;
    activateProfilePopup: (character: Character) => void;
}

const CharacterComponent = (props: CharacterComponentProps) => {
    const { character } = props;
    const defaultPhotoURL = 'https://firebasestorage.googleapis.com/v0/b/koios-academy.appspot.com/o/imagegenexample.png?alt=media&token=6d5a83d2-0824-40eb-9b0d-7a2fa861c035';
    const [photoURL, setPhotoURL] = useState(character?.avatar || defaultPhotoURL);
    const [displayName, setDisplayName] = useState(character?.name || 'Guest');

    const navigate = useNavigate();
    const location = useLocation();
    
    useEffect(() => {
        setPhotoURL(character?.avatar || defaultPhotoURL);
        setDisplayName(character?.name || 'Guest');
    }, [character]);

    const deleteSelf = async () => {
        if (character) {
            if(await confirmModal('Are you sure you want to delete this character?')){
                await deleteCharacter(character._id);
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

    return (
        <div className="p-4 rounded-box bg-base-300 grid grid-cols-3 justify-between gap-2 text-base-content">
            <div className="flex flex-col gap-1 col-span-1">
                <h3 className="character-name text-left text-ellipsis line-clamp-1">{displayName}</h3>
                <img className="rounded-md flex-grow character-photo" src={photoURL} alt="character"/>
                <div className="grid grid-cols-2 justify-center mt-2 gap-1 items-center grid-">
                    <button className="dy-btn dy-btn-sm dy-btn-info" onClick={(e) => {e.preventDefault(); openProfilePopup()}}><Info/></button>
                    <button className="dy-btn dy-btn-sm dy-btn-info" onClick={(e) => {e.preventDefault(); changeCharacterID()}}><MessageCircle/></button>
                </div>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
                <div className="flex flex-row justify-between">
                    <h4 className="text-left text-ellipsis line-clamp-1 text-lg">Description</h4>
                    <div className={"flex flex-row gap-1 "}>
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
                <p className="text-left line-clamp-4 overflow-y-scroll text-clip dy-textarea">{character?.description}</p>
                <label className="text-left text-ellipsis line-clamp-1 text-lg">Tags</label>
                <div className="flex flex-row gap-1 w-full">
                    {character?.tags?.map((tag, index) => {
                        return (
                            <div key={index} className="dy-badge dy-badge-info">{tag}</div>
                        )
                    })}
                    {character?.tags?.length === 0 && <p className="dy-badge dy-badge-warning">None</p>}
                </div>
            </div>
        </div>
    );
}
export default CharacterComponent;
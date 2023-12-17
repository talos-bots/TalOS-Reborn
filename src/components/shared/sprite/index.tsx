/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { Emotion } from "../../../helpers/constants"
type Position = 'left' | 'right' | 'center';

interface SpriteProps {
    emotion?: Emotion;
    character?: string;
    position?: Position;
}

const Sprite = (props: SpriteProps) => {
    const { emotion, character, position } = props;
    const [spriteImage, setSpriteImage] = useState<boolean>(false);

    const checkIfSpriteExists = async () => {
        try {
            const response = await fetch(`/sprites/${character}/${emotion}.png`);
            console.log(response);
            setSpriteImage(response.ok);
        } catch (error) {
            console.error('Error checking sprite:', error);
            setSpriteImage(false);
        }
    }

    useEffect(() => {
        checkIfSpriteExists();
    }, [character, emotion]);
    
    return (
        <div className={`flex flex-col w-full h-full justify-end ${(position === 'center' && 'items-center') || (position === 'right' && 'items-end') || (position === 'left' && 'items-start')}`}>
            <img className={"max-h-[100%] " + (!spriteImage && 'hidden')} src={`/sprites/${character}/${emotion}.png`} alt={`${emotion}`}/>
        </div>
    )
}
export default Sprite;
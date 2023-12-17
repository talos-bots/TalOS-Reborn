/* eslint-disable @typescript-eslint/no-unused-vars */
import { Emotion } from "../../../helpers/constants"
type Position = 'left' | 'right' | 'center';

interface SpriteProps {
    emotion?: Emotion;
    character?: string;
    position?: Position;
}

const Sprite = (props: SpriteProps) => {
    const { emotion, character, position } = props;
    return (
        <div className={`flex flex-col w-full h-full justify-end items-center`}>
            <img className="max-h-[100%]" src={`/sprites/akiko/joy.png`} alt={`joy`}/>
        </div>
    )
}
export default Sprite;
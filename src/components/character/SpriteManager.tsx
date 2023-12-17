import { useEffect, useState } from "react";
import { Character } from "../../global_classes/Character";
import { fetchCharacterById } from "../../api/characterAPI";
import { Emotion, emotions } from "../../helpers/constants";
import SpriteBox from "./SpriteBox";

interface SpriteManagerProps {
    characterid: string;
}

const SpriteManager = (props: SpriteManagerProps) => {
    const { characterid } = props;
    const [character, setCharacter] = useState<Character>();

    useEffect(() => {
        if(characterid !== "" && characterid !== undefined && characterid !== null && characterid !== "create") {
            fetchCharacterById(characterid).then((character) => {
                setCharacter(character);
            });
        }
    }, [characterid]);

    if(character !== undefined && character !== null) return (
        <div className="rounded-box bg-base-100 p-4 w-full max-h-[80vh] overflow-y-scroll gap-2 grid grid-cols-2 md:grid-cols-3">
            {emotions.map((emotion, index) => {
                return <SpriteBox key={index} emotion={emotion.value as Emotion} characterid={characterid} />
            })}
        </div>
    );

    return (
        <div className="rounded-box bg-base-100 p-4 w-full h-full">
            Character not found. Sprites can only be edited for existing characters.
        </div>
    );
}
export default SpriteManager;
import { useEffect, useState } from "react";
import { Emotion } from "../../helpers/constants";
import { QuestionMark } from "@mui/icons-material";

interface SpriteCrudProps {
    emotion: Emotion;
    characterid: string;
}

const SpriteBox = (props: SpriteCrudProps) => {
    const { emotion, characterid } = props;
    const [spriteImage, setSpriteImage] = useState<boolean>(false);

    const checkIfSpriteExists = async () => {
        try {
            const response = await fetch(`/sprites/${characterid}/${emotion}.png`);
            console.log(response);
            setSpriteImage(response.ok);
        } catch (error) {
            console.error('Error checking sprite:', error);
            setSpriteImage(false);
        }
    }

    useEffect(() => {
        checkIfSpriteExists();
    }, [characterid, emotion]);

    const uploadSprite = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        console.log(file);
        if (file) {
            console.log('Uploading sprite...');
            const formData = new FormData();
            formData.append('sprite', file);
            formData.append('emotion', emotion);
            formData.append('characterid', characterid);
            console.log(formData);
            try {
                const response = await fetch('/api/upload/sprite', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    console.log('Sprite uploaded successfully');
                    await checkIfSpriteExists();
                } else {
                    console.error('Failed to upload sprite');
                }
                console.log(response);
            } catch (error) {
                console.error('Error uploading sprite:', error);
            }
        } else {
            // Handle the case where no file was selected, if necessary
        }
    };

    const firstLetterUppercase = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return (
        <>
            <div className="gap-2 rounded-box bg-base-200 flex-grow flex flex-col justify-center items-center max-w-[150px] max-h-[192px] min-h-[356px] min-w-[238px] p-4">
                {firstLetterUppercase(emotion)}
                <label htmlFor={`emotion-select-${emotion}`} className="flex flex-col flex-grow cursor-pointer max-h-[90%]">
                    {spriteImage === true ? (
                        <img 
                            src={`/sprites/${characterid}/${emotion}.png`} 
                            alt={`Sprite for ${firstLetterUppercase(emotion)}`} 
                            className="max-h-[90%] min-h-[90%]"
                        />
                    ) : (
                        <QuestionMark className="max-h-[90%] min-h-[90%] w-full"/>
                    )}
                    <input
                        id={`emotion-select-${emotion}`}
                        className="hidden"
                        type="file"
                        accept=".png, .jpg, .jpeg"
                        onChange={uploadSprite}
                    />
                </label>
            </div>
        </>
    );
}
export default SpriteBox
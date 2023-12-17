import { Image, Trash } from "lucide-react";
import React, { useState, useEffect } from "react";
import { deleteBackground, fetchAllBackgrounds, uploadBackground } from "../../../api/backgroundsAPI";

interface BackgroundSelectorProps {
    background: string | null;
    setBackground: (background: string | null) => void;
}

const BackgroundSelector = (props: BackgroundSelectorProps) => {
    const { background, setBackground } = props;
    const [backgrounds, setBackgrounds] = useState<string[]>([]);

    useEffect(() => {
        const fetchAndSetBackgrounds = async () => {
            const data = await fetchAllBackgrounds();
            if (data !== null) {
                setBackgrounds(data);
            }
        };
        fetchAndSetBackgrounds();
        localStorage.getItem("background");
        if (localStorage.getItem("background") !== null) {
            setBackground(localStorage.getItem("background"));
        }
    }, []);

    const selectBackground = (filename: string) => {
        setBackground(filename);
        localStorage.setItem("background", filename);
    }

    const handleBackgroundChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            const result = await uploadBackground(file);
            console.log(result);
            if (result) {
                setBackgrounds([...backgrounds, result]);
                selectBackground(result);
            } else {
                console.error("Failed to upload the custom background.");
            }
        }
    };

    const handleBackgroundDelete = async (filename: string) => {
        const result = await deleteBackground(filename);
        if (result) {
            if (background === filename) {
                setBackground(null);
            }
            setBackgrounds(backgrounds.filter((bg) => bg !== filename));
        } else {
            console.error("Failed to delete the background.");
        }
    };

    return (
        <div className="rounded-box flex flex-col text-base-content gap-2">
            <h4>Background Selector</h4>
            <div className="grid grid-cols-2 gap-4">
                {backgrounds.map((bg) => (
                <div key={bg} className="h-min-fit max-h-fit w-fit relative">
                    <div
                        onClick={() => {selectBackground(bg); }}
                        className={
                            background === bg
                            ? "border-2 border-blue-500 rounded-box"
                            : "border-2 border-transparent rounded-box"
                        }
                    >
                        <img
                            src={`./backgrounds/${bg}`}
                            alt="Background"
                            width={150}
                            className="rounded-md w-[120px] h-[80px]"
                        />
                    </div>
                    <button
                        className="absolute top-0 right-0 dy-btn-xs dy-btn dy-btn-warning"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleBackgroundDelete(bg);
                        }}
                    >
                        <Trash size={'1rem'}/>
                    </button>
                </div>
                ))}
                <label htmlFor="backgroundSelector" className="rounded-box flex items-center bg-base-200 justify-center w-[120px] h-[80px] hover:cursor-pointer">
                    <Image size={60}/>
                    <input
                        id="backgroundSelector"
                        type="file"
                        name="background"
                        accept=".png,.jpg,.jpeg"
                        className="absolute inset-0 opacity-0 cursor-pointer w-[120px] h-[80px]"
                        onChange={handleBackgroundChange}
                    />
                </label>
            </div>
        </div>
    );
};

export default BackgroundSelector;

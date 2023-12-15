/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useEffect, useState } from "react";
import './AccountPage.css'
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resizeImage } from "../../helpers";
import { confirmModal } from "../../components/shared/confirm-modal";
import RequiredInputField from "../../components/shared/required-input-field";

const AccountPage = () => {
    const navigate = useNavigate();

    const [oldPassword, setOldPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
    const [profilePicture, setProfilePicture] = useState<string>('');
    const [uploadingProfileImage, setUploadingProfileImage] = useState<boolean>(false);
    const [changePassword, setChangePassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleProfilePictureChange = async (files: FileList | null) => {
        if (files === null) return;
        setUploadingProfileImage(true);
    
        const file = files[0];
    
        try {
            const resizedFile = await resizeImage(file);
        } catch (error) {
            console.error("Error resizing image: ", error);
            // Handle the error appropriately
        }
        setUploadingProfileImage(false);
    };

    const toggleLoading = async (value: boolean) => {
        if(!value){
            await new Promise((resolve) => setTimeout(resolve, 500)).then(() => {
                setIsLoading(value);
            });
        }else{
            setIsLoading(value);
        }
    };

    return (
        <div className="md:grid md:grid-cols-6 min-h-[90vh] p-2 md:p-4 gap-2 flex flex-col">
            {isLoading && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-base-300 rounded-box p-2 md:p-6">
                        <div className="flex flex-row justify-center items-center">
                            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary">
    
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="col-span-3 h-full bg-base-300 rounded-box text-base-content p-2 md:p-6">
                <h2 className="font-extrabold">Account Information</h2>
                <div className="flex flex-col items-left gap-2 text-left">
                    <label className=" font-bold">Profile Picture:</label>
                    <label className={`avatar ${uploadingProfileImage ? 'loading' : ''}`} htmlFor="character-image-input">
                        {profilePicture !== null && profilePicture.length > 1 ? (
                            <img src={profilePicture} className="avatar"/>
                        ) : (
                            <img src={'https://firebasestorage.googleapis.com/v0/b/koios-academy.appspot.com/o/imagegenexample.png?alt=media&token=6d5a83d2-0824-40eb-9b0d-7a2fa861c035'} className="avatar"/>
                        )}
                        <div className="hover-effect">
                            <Camera className="camera-icon" size={'2rem'}/>
                        </div>
                        {uploadingProfileImage && (
                            <div className={"absolute rounded-[50%] inset-0 bg-black bg-opacity-50 flex items-center justify-center"}>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-text"></div>
                            </div>
                        )}
                    </label>
                    <input
                        type="file"
                        accept="image/png, application/json"
                        id="character-image-input"
                        onChange={(e) => handleProfilePictureChange(e.target.files)}
                        style={{ display: 'none' }}
                        multiple={true}
                    />
                </div>
                <div className="flex flex-col items-left gap-2 text-left">
                </div>
            </div>
            <div className="col-span-3 h-full bg-base-300 rounded-box text-base-content p-2 md:p-6 overflow-x-clip">
            </div>
        </div>
    );
};

export default AccountPage;
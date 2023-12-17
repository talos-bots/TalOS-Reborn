/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useEffect, useState } from "react";
import './AccountPage.css'
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resizeImage } from "../../helpers";
import { confirmModal } from "../../components/shared/confirm-modal";
import RequiredInputField from "../../components/shared/required-input-field";
import { useUser } from '../../components/shared/auth-provider';
import { uploadFile, uploadProfilePicture } from '../../api/fileServer';
import { Helmet } from 'react-helmet-async';

const AccountPage = () => {
    const { user, logout, changeDisplayName, changePassword, changeProfilePicture, changeProfileBackground, changeProfileTagline } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if(!user){
            navigate('/login');
        }else{
            setUsername(user.username || '');
            setDisplayName(user.displayName || '');
            setProfilePicture(user.profilePic || '');
            setProfileBackground(user.backgroundPic || '');
            setProfileTagline(user.tagline || '');
        }
    }, [user, navigate]);

    const [username, setUsername] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');
    const [oldPassword, setOldPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
    const [profilePicture, setProfilePicture] = useState<string>('');
    const [uploadingProfileImage, setUploadingProfileImage] = useState<boolean>(false);
    const [doChangePassword, setDoChangePassword] = useState<boolean>(false);
    const [profileBackground, setProfileBackground] = useState<string>('');
    const [profileTagline, setProfileTagline] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleProfilePictureChange = async (files: FileList | null) => {
        if (files === null) return;
        setUploadingProfileImage(true);
    
        const file = files[0];
    
        try {
            const profilePicUrl = await uploadProfilePicture(file);
            setProfilePicture(profilePicUrl);
            await changeProfilePicture(profilePicUrl);
        } catch (error) {
            console.error("Error resizing image: ", error);
            // Handle the error appropriately
        }
        setUploadingProfileImage(false);
    };

    const handleProfileBackgroundChange = async (files: FileList | null) => {
        if (files === null) return;
        setUploadingProfileImage(true);
    
        const file = files[0];
    
        try {
            const profilePicUrl = await uploadFile(file);
            setProfileBackground(profilePicUrl);
            await changeProfileBackground(profilePicUrl);
        } catch (error) {
            console.error("Error resizing image: ", error);
            // Handle the error appropriately
        }
        setUploadingProfileImage(false);
    }

    const toggleLoading = async (value: boolean) => {
        if(!value){
            await new Promise((resolve) => setTimeout(resolve, 500)).then(() => {
                setIsLoading(value);
            });
        }else{
            setIsLoading(value);
        }
    };

    const changeFirebaseUserInfo = async () => {
        toggleLoading(true);
        await changeDisplayName(displayName);
        toggleLoading(false);
    };

    const changeFirebaseUserEmail = async () => {
        toggleLoading(true);
        await changeDisplayName(displayName);
        toggleLoading(false);
    };

    const changeFirebaseUserPassword = async () => {
        toggleLoading(true);
        await changePassword(oldPassword, newPassword);
        toggleLoading(false);
    };

    const doLogout = async () => {
        const isConfirm = await confirmModal('Logout', 'Are you sure you want to logout?')
        if(!isConfirm) return;
        await logout();
        navigate('/login');
    };

    const saveTagline = async () => {
        toggleLoading(true);
        await changeProfileTagline(profileTagline);
        toggleLoading(false);
    }

    return (
        <div className="md:grid md:grid-cols-6 min-h-[90vh] p-2 md:p-4 gap-2 flex flex-col">
            <Helmet>
                <title>TalOS | Account</title>
            </Helmet>
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
                <h3>Account Information</h3>
                <div className="flex flex-col items-left gap-2 text-left">
                    <label className=" font-bold">Profile Picture</label>
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
                    <div className="flex flex-col">
                        <RequiredInputField label={'Display Name'} required={true} name="displayName" id="displayName"  className={''} type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}/>
                        <button className="dy-btn dy-btn-outline" onClick={() => {changeFirebaseUserInfo()}}>Change</button>
                    </div>
                    <div className="flex flex-col">
                        <RequiredInputField label={'Username'} required={true} name="username" id="username" className={''} type="email" value={username} onChange={(e) => setUsername(e.target.value)}/>
                        <button className="dy-btn dy-btn-outline" onClick={() => {changeFirebaseUserEmail()}}>Change</button>
                    </div>
                    {!doChangePassword && (
                        <button className="dy-btn mt-4 dy-btn-outline" onClick={() => {setDoChangePassword(true)}}>Change Password</button>
                    )}
                    {doChangePassword && (
                        <div className={"flex flex-col gap-4"}>
                            <label className=" font-bold">Old Password:</label>
                            <input type="password" className="dy-input" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}/>
                            <label className=" font-bold">New Password:</label>
                            <input type="password" className="dy-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/>
                            <label className=" font-bold">Confirm New Password:</label>
                            <input type="password" className="dy-input" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}/>
                            <div className="flex flex-row gap-4 w-full justify-center">
                                <button className="dy-btn hover:dy-btn-warning dy-btn-outline" onClick={() => {setDoChangePassword(false)}}>Cancel</button>
                                <button className="dy-btn hover:dy-btn-primary dy-btn-outline" onClick={() => {changeFirebaseUserPassword}}>Change</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="col-span-3 h-full bg-base-300 rounded-box text-base-content p-2 md:p-6 overflow-x-clip flex flex-col gap-2">
                <h3>Profile Settings</h3>
                <div className="flex flex-col items-left gap-2 text-left">
                    <label className=" font-bold">Profile Background</label>
                    <label className={`${uploadingProfileImage ? 'loading' : ''}`} htmlFor="profile-background-input">
                        {profileBackground !== null && profileBackground.length > 1 ? (
                            <img src={profileBackground} className="max-w-[280px] rounded-box"/>
                        ) : (
                            <img src={'https://firebasestorage.googleapis.com/v0/b/koios-academy.appspot.com/o/imagegenexample.png?alt=media&token=6d5a83d2-0824-40eb-9b0d-7a2fa861c035'} className="max-w-[280px] rounded-box"/>
                        )}
                    </label>
                    <input
                        type="file"
                        accept="image/png, application/json"
                        id="profile-background-input"
                        onChange={(e) => handleProfileBackgroundChange(e.target.files)}
                        style={{ display: 'none' }}
                        multiple={true}
                    />
                </div>
                <div className="flex flex-col items-left gap-2 text-left">
                    <label className=" font-bold">Profile Tagline</label>
                    <textarea className="dy-textarea" value={profileTagline} onChange={(e) => setProfileTagline(e.target.value)}/>
                </div>
                <button 
                    className="dy-btn mt-4 dy-btn-outline"
                    onClick={() => {saveTagline()}}
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default AccountPage;
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Auth, getAuth, signInWithEmailAndPassword, updateEmail, updatePassword, updateProfile, validatePassword } from "firebase/auth";
import { firebaseApp, firebaseProfilePicturesRef } from "../../firebase-config";
import { useEffect, useState } from "react";
import './AccountPage.css'
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resizeImage } from "../../helpers";
import { confirmModal } from "../../components/shared/confirm-modal";
import RequiredInputField from "../../components/shared/required-input-field";
import { getBetaKey, registerBetaKeyToUser } from "../../firebase_api/userAPI";

interface AccountPageProps {
    auth: Auth;
    isProduction: boolean;
    logout: () => void;
}

const AccountPage = (props: AccountPageProps) => {
    const { auth, isProduction } = props;
    const navigate = useNavigate();
    
    const [user, setUser] = useState(auth.currentUser);
    const [name, setName] = useState(auth.currentUser?.displayName);
    const [email, setEmail] = useState(auth.currentUser?.email);
    const [oldPassword, setOldPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
    const [profilePicture, setProfilePicture] = useState<string>(auth.currentUser?.photoURL || '');
    const [uploadingProfileImage, setUploadingProfileImage] = useState<boolean>(false);
    const [changePassword, setChangePassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [betaKeyValid, setBetaKeyValid] = useState<boolean>(false);
    const [failedKeyValidation, setFailedKeyValidation] = useState<boolean>(false);
    const [betaKey, setBetaKey] = useState<string>('');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if(user !== null) {
                setUser(user);
                setName(user?.displayName);
                setEmail(user?.email);
                setProfilePicture(user?.photoURL || '');
            }else{
                setUser(null);
                setName('');
                setEmail('');
                setProfilePicture('');
                navigate('/login?location=account');
            }
        });
        return unsubscribe;
    }, [auth, navigate]);

    useEffect(() => {
        if(user?.uid === null) return;
        toggleLoading(true);
        getBetaKey().then((key) => {
            if(!key) return;
            if(key === '') return;
            setBetaKey(key);
            setBetaKeyValid(true);
        }).catch((error) => {
            console.log(error);
        });
        toggleLoading(false);
    }, [user]);

    const handleProfilePictureChange = async (files: FileList | null) => {
        if (files === null) return;
        setUploadingProfileImage(true);
    
        const file = files[0];
    
        try {
            const resizedFile = await resizeImage(file);
            const storageRef = firebaseProfilePicturesRef;
            const fileRef = ref(storageRef, `${user?.uid}.jpeg`);
            // Assert the resizedFile as a Blob
            const snapshot = await uploadBytes(fileRef, resizedFile as Blob);
            const downloadURL = await getDownloadURL(snapshot.ref);
    
            setProfilePicture(downloadURL);
            if(user === null) return;
            await updateProfile(user, {
                photoURL: downloadURL
            });
        } catch (error) {
            console.error("Error resizing image: ", error);
            // Handle the error appropriately
        }
        setUploadingProfileImage(false);
    };

    const changeFirebaseUserInfo = async () => {
        if(user === null) return;
        if(await confirmModal('Change Display Name', 'Are you sure you want to change your display name?') === false) return;
        toggleLoading(true);
        updateProfile(user, {
            displayName: name
        }).then(() => {
            console.log('User info updated');
            toggleLoading(false);
        }).catch((error) => {
            console.log(error);
            toggleLoading(false);
        });
    }

    const changeFirebaseUserEmail = async () => {
        if(user === null) return;
        if(await confirmModal('Change Email', 'Are you sure you want to change your email address?') === false) return;
        toggleLoading(true);
        if(email === '') return;
        if(!email) return;
        updateEmail(user, email).then(() => {
            console.log('User email updated');
            toggleLoading(false);
        }).catch((error) => {
            console.log(error);
            toggleLoading(false);
        });
    }
    
    const changeFirebaseUserPassword = async () => {
        if(user === null) return;
        if(await confirmModal('Change Password', 'Are you sure you want to change your password?') === false) return;
        if(newPassword !== confirmNewPassword) return;
        if(oldPassword === '') return;
        if(newPassword === '') return;
        if(confirmNewPassword === '') return;
        toggleLoading(true);
        const validate = (await validatePassword(auth, newPassword)).isValid;
        if(validate === false) return;
        if(user.email === null) return;
        const creds = await signInWithEmailAndPassword(auth, user.email, oldPassword).then((userCredential) => {
            return userCredential;
        }).catch((error) => {
            console.log(error);
        });
        if(creds === undefined) return;
        updatePassword(user, newPassword).then(() => {
            console.log('User password updated');
            setChangePassword(false);
            toggleLoading(false);
        }).catch((error) => {
            console.log(error);
            setChangePassword(false);
            toggleLoading(false);
        });
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

    const validateNewBetaKey = async () => {
        if(betaKey === '') return;
        toggleLoading(true);
        const keyResult = await registerBetaKeyToUser(betaKey.trim());
        if(keyResult === false) {
            setBetaKeyValid(false);
            setFailedKeyValidation(true);
            return;
        }
        setBetaKeyValid(true);
        toggleLoading(false);
    }

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
                    <div className="flex flex-col">
                        <RequiredInputField label={'Display Name:'} required={true} name="displayName" id="displayName"  className={''} type="text" value={name} onChange={(e) => setName(e.target.value)}/>
                        <button className="dy-btn dy-btn-outline" onClick={() => {changeFirebaseUserInfo()}}>Change</button>
                    </div>
                    <div className="flex flex-col">
                        <RequiredInputField label={'Email:'} required={true} name="email" id="email" className={''} type="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
                        <button className="dy-btn dy-btn-outline" onClick={() => {changeFirebaseUserEmail()}}>Change</button>
                    </div>
                    {!changePassword && (
                        <button className="dy-btn mt-4 dy-btn-outline" onClick={() => {setChangePassword(true)}}>Change Password</button>
                    )}
                    {changePassword && (
                        <div className={"flex flex-col gap-4"}>
                            <label className=" font-bold">Old Password:</label>
                            <input type="password" className="dy-input" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}/>
                            <label className=" font-bold">New Password:</label>
                            <input type="password" className="dy-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/>
                            <label className=" font-bold">Confirm New Password:</label>
                            <input type="password" className="dy-input" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}/>
                            <div className="flex flex-row gap-4 w-full justify-center">
                                <button className="dy-btn hover:dy-btn-warning dy-btn-outline" onClick={() => {setChangePassword(false)}}>Cancel</button>
                                <button className="dy-btn hover:dy-btn-primary dy-btn-outline" onClick={() => {changeFirebaseUserPassword}}>Change</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="col-span-3 h-full bg-base-300 rounded-box text-base-content p-2 md:p-6 overflow-x-clip">
                <h2 className="font-extrabold">Wallet & Payment Settings</h2>
                <div className="flex flex-col w-full h-full overflow-y-scroll overflow-x-clip">
                    <label className="font-bold justify-between flex flex-row">Alpha Key {betaKeyValid && <span className="text-green-500 italic text-sm">Alpha Key Valid</span>}{failedKeyValidation && <span className="text-green-500 italic text-sm">Alpha Key Invalid</span>}</label>
                    <input type="password" className="dy-input" value={betaKey} onChange={(e) => setBetaKey(e.target.value)} disabled={betaKeyValid}/>
                    <button className="dy-btn dy-btn-outline" disabled={betaKeyValid} onClick={async () => {
                        if(betaKey === '') return;
                        validateNewBetaKey();
                    }}>Validate</button>
                </div>
            </div>
        </div>
    );
};

export default AccountPage;
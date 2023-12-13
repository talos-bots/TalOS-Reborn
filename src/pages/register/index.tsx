/* eslint-disable @typescript-eslint/no-unused-vars */
import { Auth, GoogleAuthProvider, createUserWithEmailAndPassword, getAuth, signInWithCredential, signInWithPopup, updateProfile, validatePassword } from "firebase/auth";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { firebaseApp } from "../../firebase-config";
import { postSignUpAction } from "../../firebase_api/userAPI";

interface RegisterPageProps {
    auth: Auth;
    isProduction: boolean;
    logout: () => void;
}

const RegisterPage = (props: RegisterPageProps) => {
    const { auth, isProduction, logout } = props;
    const navigate = useNavigate();

    useEffect(() => {
        auth.authStateReady().then(() => {
            if (auth.currentUser !== null) {
                navigate('/account');
            }
        });
    }, [auth, navigate]);
    
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [emailError, setEmailError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [confirmPasswordError, setConfirmPasswordError] = React.useState('');
    const [displayName, setDisplayName] = React.useState('');
    const [displayNameError, setDisplayNameError] = React.useState('');
    
    const validate = async () => {
        let isValid = true;
        // Email validation
        if(!displayName) {
            setDisplayNameError('Display name is required');
        }else {
            setDisplayNameError('');
        }
        if (!email) {
            setEmailError('Email is required');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError('Invalid email format');
            isValid = false;
        } else {
            setEmailError('');
        }
        // Password validation
        if (!password) {
            setPasswordError('Password is required');
            isValid = false;
        } else if (((await validatePassword(auth, password)).isValid === false)) {
            setPasswordError('Password must be at least 6 characters');
            isValid = false;
        } else {
            setPasswordError('');
        }
        // Confirm password validation
        if (!confirmPassword) {
            setConfirmPasswordError('Confirm password is required');
            isValid = false;
        } else if (confirmPassword !== password) {
            setConfirmPasswordError('Confirm password must match password');
            isValid = false;
        } else {
            setConfirmPasswordError('');
        }
        return isValid;
    };

    const register = async () => {
        if (!validate()) return;
        await createUserWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
            if(auth.currentUser) {
                await postSignUpAction(auth.currentUser.email, displayName, auth.currentUser.photoURL, auth.currentUser.uid).then(() => {
                    console.log('Post sign up action success');
                }).catch((error) => {
                    console.log(error);
                });
            }
            updateProfile(auth.currentUser, {
                displayName: displayName
            }).then(() => {
                console.log('Profile updated');
            }).catch((error) => {
                console.log(error);
            });
            navigate('/account?isSuccess=true');
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            alert(errorMessage);
        });
    }
    const googleProvider = new GoogleAuthProvider();
    
    const signInWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider).then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            signInWithCredential(auth, credential).then(async (userCredential) => {
                if(auth.currentUser) {
                    await postSignUpAction(auth.currentUser.email, displayName, auth.currentUser.photoURL, auth.currentUser.uid).then(() => {
                        console.log('Post sign up action success');
                    }).catch((error) => {
                        console.log(error);
                    });
                }
                navigate('/account?isSuccess=true');
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
                console.log(errorCode, errorMessage, email, credential);
            });
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.log(errorCode, errorMessage, email, credential);
        });
        if(auth.currentUser) {
            await postSignUpAction(auth.currentUser.email, displayName, auth.currentUser.photoURL, auth.currentUser.uid).then(() => {
                console.log('Post sign up action success');
            }).catch((error) => {
                console.log(error);
            });
        }
    }

    return (
        <div className="w-full h-screen p-2 md:p-4">
            <div className="w-full mx-auto my-auto sm:max-w-lg xl:p-0 bg-base-200 rounded-box text-base-content">
            <div className="p-2 md:p-6 space-y-4 lg:space-y-6 sm:p-8">
                <h1 className="text-xl font-bold leading-tight tracking-tight  sm:text-2xl ">
                    Create your Free Account
                </h1>
                <div className="items-center space-y-3 sm:space-x-4 sm:space-y-0 sm:flex">
                    <button onClick={() => signInWithGoogle()} className="w-full inline-flex items-center text-gray-900 justify-center py-2.5 px-5 text-sm font-medium  focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover: focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover: dark:hover:bg-gray-700">
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_13183_10121)"><path d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z" fill="#3F83F8"/><path d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z" fill="#34A853"/><path d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z" fill="#FBBC04"/><path d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z" fill="#EA4335"/></g><defs><clipPath id="clip0_13183_10121"><rect width="20" height="20" fill="white" transform="translate(0.5)"/></clipPath></defs>
                        </svg>                            
                        Sign up with Google
                    </button>
                </div>
                <div className="flex items-center">
                    <div className="w-full h-0.5 bg-gray-700"></div>
                    <div className="px-5 text-center">or</div>
                    <div className="w-full h-0.5 bg-gray-700"></div>
                </div>
                    <form className="space-y-4 lg:space-y-6" onSubmit={(e) => {e.preventDefault(); register();}}>
                        <div>
                            <label htmlFor="name" className="block mb-2 text-sm font-medium">Display Name</label>
                            <input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                type="text" name="name" id="name"  placeholder="Enter your name" required={true} className="dy-input w-full"/>
                            {displayNameError && <div className="text-red-500 text-sm">{displayNameError}</div>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium ">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email" name="email" id="email" placeholder="Enter your email" required={true} className="dy-input w-full"/>
                            {emailError && <div className="text-red-500 text-sm">{emailError}</div>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium ">Password</label>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password" name="password" id="password" placeholder="••••••••" required={true} className="dy-input w-full"/>
                            {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium ">Confirm Password</label>
                            <input
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                type="password" name="confirm-password" id="confirm-password" placeholder="••••••••" required={true} className="dy-input w-full"/>
                            {confirmPasswordError && <div className="text-red-500 text-sm">{confirmPasswordError}</div>}
                        </div>
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input id="terms" aria-describedby="terms" type="checkbox" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800" required={true}/>
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="terms">By signing up, you are creating a WelcomeAI account, and you agree to WelcomeAI's <a className="font-medium text-primary-600 dark:text-primary-500 hover:underline" href="/terms">Terms of Use</a> and <a className="font-medium text-primary-600 dark:text-primary-500 hover:underline" href="/privacy">Privacy Policy</a>.</label>
                            </div>
                        </div>
                        <button type="submit" className="dy-btn hover:dy-btn-primary dy-btn-outline w-full">Create an account</button>
                        <p className="text-sm">
                            Already have an account? <a href="/login" className="dy-link dy-link-hover">Sign in here</a>
                        </p>
                    </form>
            </div>
            </div>
        </div>
    )
}
export default RegisterPage;
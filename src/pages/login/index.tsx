/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react'
import './LoginPage.css'
import { Auth, GoogleAuthProvider, getAuth, sendPasswordResetEmail, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, validatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { postSignUpAction } from '../../firebase_api/userAPI';
import { confirmModal } from '../../components/shared/confirm-modal';
import { TEAlert } from 'tw-elements-react';

interface LoginPageProps {
    auth: Auth;
    isProduction: boolean;
    logout: () => void;
}

const LoginPage = (props: LoginPageProps) => {
    const { auth, logout, isProduction } = props;
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const locationRedirect = queryParams.get('location');

    useEffect(() => {
        auth.authStateReady().then(() => {
            if (auth.currentUser !== null && locationRedirect === null) {
                navigate('/account');
            }else if(auth?.currentUser !== null && locationRedirect !== null && locationRedirect?.trim().length > 1) {
                navigate(`/${locationRedirect}`);
            }
        });
    }, [auth, navigate, locationRedirect]);

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [emailError, setEmailError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');
    const [doRemember, setDoRemember] = React.useState(false);
    const [error, setError] = React.useState(false);

    useEffect(() => {
        if(localStorage.getItem('rememberMe')) {
            setEmail(localStorage.getItem('email') || '');
            setPassword(localStorage.getItem('password') || '');
            setDoRemember(true);
        }
    }, [])

    const login = () => {
        if (!validate()) return;
        signInWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log(user);
            if(auth.currentUser !== null && auth.currentUser !== undefined && auth.currentUser.email !== null && auth.currentUser.email !== undefined) {
                await postSignUpAction(auth.currentUser.email, auth?.currentUser?.displayName || 'Anonymous', auth.currentUser.photoURL || '', auth.currentUser.uid).then(() => {
                    console.log('Post sign up action success');
                }).catch((error) => {
                    console.log(error);
                });
            }
            if(localStorage.getItem('rememberMe')) rememberMe();
            if(locationRedirect !== null && locationRedirect?.trim().length > 1){
                navigate(`/${locationRedirect}`);
            }else{
                navigate('/account?isSuccess=true');
            }
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            setError(true);
        });
    }

    const validate = async () => {
        let isValid = true;
        // Email validation
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
        return isValid;
    };

    const resetPassword = async () => {
        const isConfirm = await confirmModal('Reset Password', 'Are you sure you want to reset your password?')
        if(!isConfirm) return;
        sendPasswordResetEmail(auth, email).then(() => {
            console.log('Password reset email sent');
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
        });
    }

    const rememberMe = () => {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('email', email);
        localStorage.setItem('password', password);
    }

    const setRememberMe = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.checked) rememberMe();
        else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('email');
            localStorage.removeItem('password');
        }
        setDoRemember(e.target.checked);
    }

    //firebase sign in with google

    const googleProvider = new GoogleAuthProvider();

    const signInWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider).then(async (result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if(credential === null){
                console.log('Credential is null');
                setError(true);
                return;
            }
            await signInWithCredential(auth, credential).then(async (userCredential) => {
                const user = userCredential.user;
                console.log(user);
                if(auth.currentUser !== null && auth.currentUser !== undefined && auth.currentUser.email !== null && auth.currentUser.email !== undefined) {
                    await postSignUpAction(auth.currentUser.email, auth.currentUser.displayName || 'Anon', auth.currentUser.photoURL || '', auth.currentUser.uid).then(() => {
                        console.log('Post sign up action success');
                    }).catch((error) => {
                        console.log(error);
                    });
                }
                if(locationRedirect !== null && locationRedirect?.trim().length > 1){
                    navigate(`/${locationRedirect}`);
                }else{
                    navigate('/account?isSuccess=true');
                }
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
                console.log(errorCode, errorMessage, email, credential);
                setError(true);
            });
        }).catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
            console.log(errorCode, errorMessage, email, credential);
            setError(true);
        });
    }

    return (
        <div className='w-full h-screen p-2 md:p-4'>
            <TEAlert dismiss delay={5000} open={error} autohide onClose={
                () => {
                    setError(false);
                }
            }
            className='rounded-box bg-error text-error-content'
            >
                <strong>Error Signing In!</strong>
                <span className="ml-1">
                Check your email and password and try again.
                </span>
            </TEAlert>
            <div className="w-full mx-auto my-auto sm:max-w-lg xl:p-0 bg-base-200 rounded-box text-base-content">
                <div className="p-2 md:p-6 space-y-4 lg:space-y-6 sm:p-8">
                    <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
                        Welcome back!
                    </h1>
                    <div className="items-center space-y-3 sm:space-x-4 sm:space-y-0 sm:flex">
                        <button onClick={() => {signInWithGoogle()}} className="w-full inline-flex items-center justify-center py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover: dark:hover:bg-gray-700">
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_13183_10121)"><path d="M20.3081 10.2303C20.3081 9.55056 20.253 8.86711 20.1354 8.19836H10.7031V12.0492H16.1046C15.8804 13.2911 15.1602 14.3898 14.1057 15.0879V17.5866H17.3282C19.2205 15.8449 20.3081 13.2728 20.3081 10.2303Z" fill="#3F83F8"/><path d="M10.7019 20.0006C13.3989 20.0006 15.6734 19.1151 17.3306 17.5865L14.1081 15.0879C13.2115 15.6979 12.0541 16.0433 10.7056 16.0433C8.09669 16.0433 5.88468 14.2832 5.091 11.9169H1.76562V14.4927C3.46322 17.8695 6.92087 20.0006 10.7019 20.0006V20.0006Z" fill="#34A853"/><path d="M5.08857 11.9169C4.66969 10.6749 4.66969 9.33008 5.08857 8.08811V5.51233H1.76688C0.348541 8.33798 0.348541 11.667 1.76688 14.4927L5.08857 11.9169V11.9169Z" fill="#FBBC04"/><path d="M10.7019 3.95805C12.1276 3.936 13.5055 4.47247 14.538 5.45722L17.393 2.60218C15.5852 0.904587 13.1858 -0.0287217 10.7019 0.000673888C6.92087 0.000673888 3.46322 2.13185 1.76562 5.51234L5.08732 8.08813C5.87733 5.71811 8.09302 3.95805 10.7019 3.95805V3.95805Z" fill="#EA4335"/></g><defs><clipPath id="clip0_13183_10121"><rect width="20" height="20" fill="white" transform="translate(0.5)"/></clipPath></defs>
                            </svg>                            
                            Log in with Google
                        </button>
                        {/* <a href="#" className="w-full inline-flex items-center justify-center py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover: dark:hover:bg-gray-700">
                            <svg className="w-5 h-5 mr-2 text-gray-900 " viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_13183_29163)"><path d="M18.6574 15.5863C18.3549 16.2851 17.9969 16.9283 17.5821 17.5196C17.0167 18.3257 16.5537 18.8838 16.1969 19.1936C15.6439 19.7022 15.0513 19.9627 14.4168 19.9775C13.9612 19.9775 13.4119 19.8479 12.7724 19.585C12.1308 19.3232 11.5412 19.1936 11.0021 19.1936C10.4366 19.1936 9.83024 19.3232 9.18162 19.585C8.53201 19.8479 8.00869 19.985 7.60858 19.9985C7.00008 20.0245 6.39356 19.7566 5.78814 19.1936C5.40174 18.8566 4.91842 18.2788 4.33942 17.4603C3.71821 16.5863 3.20749 15.5727 2.80738 14.4172C2.37887 13.1691 2.16406 11.9605 2.16406 10.7904C2.16406 9.45009 2.45368 8.29407 3.03379 7.32534C3.4897 6.54721 4.09622 5.9334 4.85533 5.4828C5.61445 5.03219 6.43467 4.80257 7.31797 4.78788C7.80129 4.78788 8.4351 4.93738 9.22273 5.2312C10.0081 5.52601 10.5124 5.67551 10.7335 5.67551C10.8988 5.67551 11.4591 5.5007 12.4088 5.15219C13.3069 4.82899 14.0649 4.69517 14.6859 4.74788C16.3685 4.88368 17.6327 5.54699 18.4734 6.74202C16.9685 7.65384 16.2241 8.93097 16.2389 10.5693C16.2525 11.8454 16.7154 12.9074 17.6253 13.7506C18.0376 14.1419 18.4981 14.4444 19.0104 14.6592C18.8993 14.9814 18.7821 15.29 18.6574 15.5863V15.5863ZM14.7982 0.400358C14.7982 1.40059 14.4328 2.3345 13.7044 3.19892C12.8254 4.22654 11.7623 4.82035 10.6093 4.72665C10.5947 4.60665 10.5861 4.48036 10.5861 4.34765C10.5861 3.38743 11.0041 2.3598 11.7465 1.51958C12.1171 1.09416 12.5884 0.740434 13.16 0.458257C13.7304 0.18029 14.2698 0.0265683 14.7772 0.000244141C14.7921 0.133959 14.7982 0.267682 14.7982 0.400345V0.400358Z" fill="currentColor"/></g><defs><clipPath id="clip0_13183_29163"><rect width="20" height="20" fill="white" transform="translate(0.5)"/></clipPath></defs>
                            </svg>                            
                            Log in with Apple
                        </a> */}
                    </div>
                    <div className="flex items-center">
                        <div className="w-full h-0.5 bg-gray-700"></div>
                        <div className="px-5 text-center">or</div>
                        <div className="w-full h-0.5 bg-gray-700"></div>
                    </div>
                    <form className="space-y-4 lg:space-y-6" onSubmit={(e) => { e.preventDefault(); login(); }}>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium ">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email" name="email" id="email" className="dy-input w-full" placeholder="Enter your email" required={true}/>
                            {emailError && <div className="text-red-500 text-sm">{emailError}</div>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium ">Password</label>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password" name="password" id="password" placeholder="••••••••" className="dy-input w-full" required={true}/>
                            {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input id="remember" aria-describedby="remember" checked={doRemember} type="checkbox" className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 " onChange={(e) => setRememberMe(e)}/>
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="remember" className="">Remember me</label>
                                </div>
                            </div>
                            <a onClick={(e) => { e.preventDefault(); resetPassword(); }} className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Forgot password?</a>
                        </div>
                        <button type="submit" className="dy-btn dy-btn-outline hover:dy-btn-primary w-full">Sign in to your account</button>
                        <p className="text-sm  dark:text-gray-400">
                            Don't have an account yet? <NavLink to="/register"className="dy-link dy-link-hover">Sign up here</NavLink>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
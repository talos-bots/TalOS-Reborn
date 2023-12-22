/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from 'react'
import './LoginPage.css'
import { useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { confirmModal } from '../../components/shared/confirm-modal';
import { TEAlert } from 'tw-elements-react';
import { useUser } from '../../components/shared/auth-provider';
import { Helmet } from 'react-helmet-async';

const LoginPage = () => {
    const { user, login } = useUser();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const locationRedirect = queryParams.get('redirect');

    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [emailError, setEmailError] = React.useState('');
    const [passwordError, setPasswordError] = React.useState('');
    const [doRemember, setDoRemember] = React.useState(false);
    const [error, setError] = React.useState(false);

    useEffect(() => {
        if(user?.id && locationRedirect.length > 0) {
            navigate(`/${locationRedirect}` || '/home');
        }
    }, [user, navigate, locationRedirect]);

    useEffect(() => {
        if(localStorage.getItem('rememberMe')) {
            setUsername(localStorage.getItem('username') || '');
            setPassword(localStorage.getItem('password') || '');
            setDoRemember(true);
        }
    }, [])

    const doLogin = () => {
        if (!validate()) return;
        localStorage.setItem('rememberMe', doRemember ? 'true' : 'false');
        localStorage.setItem('username', username);
        login(username, password).then((result) => {
            if(!result){
                setError(true);
                return;
            } else {
                setError(false);
                navigate(locationRedirect || '/home');
            }
        }).catch((err) => {
            console.log(err);
            setError(true);
        });
    }

    const validate = async () => {
        let isValid = true;
        // Email validation
        if (!username) {
            setEmailError('Userame is required');
            isValid = false;
        } else {
            setEmailError('');
        }
        // Password validation
        if (!password) {
            setPasswordError('Password is required');
            isValid = false;
        } else {
            setPasswordError('');
        }
        return isValid;
    };

    const resetPassword = async () => {
        const isConfirm = await confirmModal('Reset Password', 'Are you sure you want to reset your password?')
        if(!isConfirm) return;
    }

    const rememberMe = () => {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('password', password);
    }

    const setRememberMe = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.checked) rememberMe();
        else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('username');
            localStorage.removeItem('password');
        }
        setDoRemember(e.target.checked);
    }

    return (
        <div className='w-full h-screen p-2 md:p-4'>
            <Helmet>
                <title>TalOS | Login</title>
            </Helmet>
            <TEAlert dismiss delay={5000} open={error} autohide onClose={
                () => {
                    setError(false);
                }
            }
            className='rounded-box bg-error text-error-content'
            >
                <strong>Error Signing In!</strong>
                <span className="ml-1">
                Check your username and password and try again.
                </span>
            </TEAlert>
            <div className="w-full mx-auto my-auto sm:max-w-lg xl:p-0 bg-base-200 rounded-box text-base-content">
                <div className="p-2 md:p-6 space-y-4 lg:space-y-6 sm:p-8">
                    <h1 className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
                        Welcome back!
                    </h1>
                    <form className="space-y-4 lg:space-y-6" onSubmit={(e) => { e.preventDefault(); doLogin(); }}>
                        <div>
                            <label htmlFor="username" className="block mb-2 text-sm font-medium ">Username</label>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                type="username" name="username" id="username" className="dy-input w-full" placeholder="Enter your username" required={true}/>
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
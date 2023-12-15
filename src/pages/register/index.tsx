/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
    const navigate = useNavigate();

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
    };

    return (
        <div className="w-full h-screen p-2 md:p-4">
            <div className="w-full mx-auto my-auto sm:max-w-lg xl:p-0 bg-base-200 rounded-box text-base-content">
            <div className="p-2 md:p-6 space-y-4 lg:space-y-6 sm:p-8">
                <h1 className="text-xl font-bold leading-tight tracking-tight  sm:text-2xl ">
                    Create your Free Account
                </h1>
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
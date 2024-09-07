/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../components/shared/auth-provider";
import { Helmet } from "react-helmet-async";

const RegisterPage = () => {
  const { user, signUp } = useUser();
  const navigate = useNavigate();

  const [password, setPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [displayNameError, setDisplayNameError] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [usernameError, setUsernameError] = React.useState('');

  const [loading, setLoading] = React.useState(false);

  const validate = async () => {
    let isValid = true;
    // Email validation
    if (!displayName) {
      setDisplayNameError('Display name is required');
    } else {
      setDisplayNameError('');
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
    setLoading(true);
    await signUp(username, password, displayName).then(() => {
      setLoading(false);
      navigate('/home');
    }).catch((err) => {
      setLoading(false);
      alert(err.message);
    });
  };

  return (
    <div className="w-full md:h-screen p-2 md:p-4">
      <Helmet>
        <title>TalOS | Register</title>
      </Helmet>
      <div className="w-full mx-auto my-auto sm:max-w-lg xl:p-0 bg-base-200 rounded-box text-base-content">
        <div className="p-2 md:p-6 space-y-4 lg:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight  sm:text-2xl ">
            Create your local TalOS - Reborn account
          </h1>
          <p className="text-base-content bg-base-100 rounded-box w-full h-fit p-4">
            This is a local account, meaning that your data is stored on the device of whoever is hosting this instance.
            If you want to access your account on another instance, you will need to create a new account on that device, and export your data from this device.
          </p>
          <form className="space-y-4 lg:space-y-6" onSubmit={(e) => { e.preventDefault(); register(); }}>
            <div>
              <label htmlFor="username" className="block mb-2 text-sm font-medium">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="text" name="username" id="username" placeholder="Enter your name" required={true} className="dy-input w-full" />
              {usernameError && <div className="text-red-500 text-sm">{usernameError}</div>}
            </div>
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium">Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                type="text" name="name" id="name" placeholder="Enter your name" required={true} className="dy-input w-full" />
              {displayNameError && <div className="text-red-500 text-sm">{displayNameError}</div>}
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium ">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password" name="password" id="password" placeholder="••••••••" required={true} className="dy-input w-full" />
              {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
            </div>
            <div>
              <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium ">Confirm Password</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password" name="confirm-password" id="confirm-password" placeholder="••••••••" required={true} className="dy-input w-full" />
              {confirmPasswordError && <div className="text-red-500 text-sm">{confirmPasswordError}</div>}
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
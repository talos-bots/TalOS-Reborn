/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';

interface User {
    id: string;
    username: string;
    profilePic: string;
    displayName: string;
}

interface UserContextValue {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchUserData: () => Promise<void>;
    signUp: (username: string, password: string, displayName: string) => Promise<void>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
    changeDisplayName: (displayName: string) => Promise<void>;
    changeProfilePicture: (profilePicture: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const fetchUserData = async () => {
        try {
            const response = await axios.get('/api/me').then((res) => res.data);
            console.log(response);
            const newUser: User = {
                id: response.id,
                username: response.username,
                profilePic: response.profile_pic,
                displayName: response.display_name,
            };
            setUser(newUser);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const login = async (username: string, password: string) => {
        try {
            await axios.post('/api/login', { username, password });
            await fetchUserData();
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const validateToken = async () => {
        try {
            await axios.get('/api/me');
        } catch (error) {
            console.error('Token validation error:', error);
            await logout();
        }
    };

    const signUp = async (username: string, password: string, displayName: string) => {
        try {
            await axios.post('/api/register', { username: username, password: password, display_name: displayName });
            await fetchUserData();
        } catch (error) {
            console.error('Sign up error:', error);
        }
    };

    const changePassword = async (oldPassword: string, newPassword: string) => {
        try {
            await axios.post('/api/changePassword', { oldPassword: oldPassword, newPassword: newPassword });
        } catch (error) {
            console.error('Change password error:', error);
        }
        fetchUserData();
    };

    const changeDisplayName = async (displayName: string) => {
        try {
            await axios.post('/api/changeDisplayName', { displayName: displayName });
        } catch (error) {
            console.error('Change display name error:', error);
        }
        fetchUserData();
    };

    const changeProfilePicture = async (profilePicture: string) => {
        try {
            await axios.post('/api/changeProfilePicture', { profilePicture: profilePicture });
        } catch (error) {
            console.error('Change profile picture error:', error);
        }
        fetchUserData();
    }

    useEffect(() => {
        const interval = setInterval(validateToken, 10 * 60 * 1000); // every 10 minutes
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchUserData();
    }, []);

    return (
        <UserContext.Provider value={{ user, login, logout, fetchUserData, signUp, changePassword, changeDisplayName, changeProfilePicture }}>
            {children}
        </UserContext.Provider>
    );
};

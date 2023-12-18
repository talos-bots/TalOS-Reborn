/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { emitWebsocketNotification, websocketNotification } from '../../../helpers/events';

function getCookie(name: string) {
    const cookieArray = document.cookie.split(';');
    for(let i = 0; i < cookieArray.length; i++) {
        const cookiePair = cookieArray[i].split('=');
        if (name == cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }
    return null;
}
  
export interface User {
    id: string;
    username: string;
    profilePic: string;
    displayName: string;
    tagline?: string;
    bio?: string;
    backgroundPic?: string;
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
    changeProfileBio: (profileBio: string) => Promise<void>;
    changeProfileTagline: (tagline: string) => Promise<void>;
    changeProfileBackground: (profileBackground: string) => Promise<void>;
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
    const [socket, setSocket] = useState(null);
    const connectWebSocket = () => {
        // Assuming the JWT token is stored in localStorage or cookies
        const token = getCookie('talosAuthToken');
        if (token && !socket) {
            const newSocket = io();

            newSocket.emit('authenticate', token);

            newSocket.on('notification', (data: any) => {
                const notif: websocketNotification = {
                    title: data.title ?? 'Notification',
                    body: data.body ?? data.message
                };
                emitWebsocketNotification(notif);
            });

            setSocket(newSocket);
            return newSocket;
        }
    };

    const disconnectWebSocket = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
    };

    const fetchUserData = async () => {
        try {
            const response = await axios.get('/api/me').then((res) => res.data);
            const newUser: User = {
                id: response.id,
                username: response.username,
                profilePic: response.profile_pic,
                displayName: response.display_name,
                tagline: response.tagline,
                bio: response.bio,
                backgroundPic: response.background_pic,
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
            connectWebSocket();
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout');
            setUser(null);
            disconnectWebSocket();
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

    const changeProfileBio = async (profileBio: string) => {
        try {
            await axios.post('/api/changeProfileBio', { bio: profileBio });
        } catch (error) {
            console.error('Change profile bio error:', error);
        }
        fetchUserData();
    }

    const changeProfileTagline = async (tagline: string) => {
        try {
            await axios.post('/api/changeTagline', { tagline: tagline });
        } catch (error) {
            console.error('Change profile bio error:', error);
        }
        fetchUserData();
    }

    const changeProfileBackground = async (profileBackground: string) => {
        try {
            await axios.post('/api/changeProfileBackground', { backgroundPic: profileBackground });
        } catch (error) {
            console.error('Change profile background error:', error);
        }
        fetchUserData();
    }
    useEffect(() => {
        const interval = setInterval(validateToken, 10 * 60 * 1000); // every 10 minutes
        if (user) {
            connectWebSocket();
        }
        return () => {
            disconnectWebSocket();
            clearInterval(interval);
        };
    }, [user]);

    useEffect(() => {
        fetchUserData();
    }, []);

    return (
        <UserContext.Provider value={{ user, login, logout, fetchUserData, signUp, changePassword, changeDisplayName, changeProfilePicture, changeProfileBackground, changeProfileTagline, changeProfileBio }}>
            {children}
        </UserContext.Provider>
    );
};

/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from "./pages";
import { useEffect, useState } from "react";

import NavBar from "./components/shared/navbar";
import CharactersPage from "./pages/characters";
import CharacterCRUD from "./pages/character-crud";
import ChatPage from "./pages/chat";
import SettingsPage from './pages/settings';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import AccountPage from './pages/account';
import { useThemeSwapListener, useWebsocketNotificationListener, websocketNotification } from './helpers/events';
import { TEAlert } from 'tw-elements-react';
import DataSetCreator from './pages/dataset-creator';
import { DatasetProvider } from './components/dataset/DatasetProvider';
import ArtPage from './pages/art';

function ScrollToTop() {
	const location = useLocation();
  
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [location]);
  
	return null; // this component does not render anything
}

export type themes = "dim"|"night"|"light"|"dark"|"cupcake"|"bumblebee"|"emerald"|"corporate"|"synthwave"|"retro"|"cyberpunk"|"valentine"|"halloween"|"garden"|"forest"|"aqua"|"lofi"|"pastel"|"fantasy"|"wireframe"|"black"|"luxury"|"dracula"|"cmyk"|"autumn"|"business"|"acid"|"lemonade"|"coffee"|"winter"|"nord"| "sunset"

export default function App() {
	const [loading, setLoading] = useState(false);
	const [theme, setTheme] = useState<themes>(localStorage.getItem('theme') as themes || 'night');
	const [showNotification, setShowNotification] = useState(false);
	const [notifcationTitle, setNotificationTitle] = useState('');
	const [notificationBody, setNotificationBody] = useState('');

	const isProduction = process.env.NODE_ENV === 'production';
	
	const notificationSound = new Audio('../assets/notification.mp3');

	useEffect(() => {
		document.querySelector('html').setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}, [theme]);

	useThemeSwapListener((newTheme: themes) => {
		setTheme(newTheme);
	});

	useWebsocketNotificationListener((data: websocketNotification) => {
		setNotificationTitle(data.title);
		setNotificationBody(data.body);
		setShowNotification(true);
		// notificationSound.play().catch((e) => console.error('Error playing sound:', e));
	});

	if(loading) {
		return (
			<div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
				<div className="bg-base-300 rounded-box p-2 md:p-6">
					<div className="flex flex-row justify-center items-center">
						<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary">

						</div>
					</div>
				</div>
			</div>
		);
	}
	
	return (
		<div id='App'>
			<Router>
				<ScrollToTop />
				<NavBar theme={theme} setTheme={setTheme}/>
				<div className='main-content mb-[64px] md:mb-0'>
					<TEAlert dismiss delay={5000} open={showNotification} autohide onClose={
						() => {
							setShowNotification(false);
						}
					} className='rounded-box bg-accent text-accent-content z-[1000]'>
						<strong>{notifcationTitle}</strong><br/>
						<span className="ml-1">
							{notificationBody}
						</span>
					</TEAlert>
					<DatasetProvider>
						<Routes>
							<Route path='/*' element={<Navigate to='/home' />} />
							<Route path='/create' element={<Navigate to='/characters/create' />} />
							<Route path='/home' element={<HomePage/>} />
							<Route path='/chat' element={<ChatPage/>} />
							<Route path='/characters/:id' element={<CharacterCRUD/>} />
							<Route path='/characters' element={<CharactersPage/>} />
							<Route path='/settings' element={<SettingsPage/>} />
							<Route path='/account' element={<AccountPage/>} />
							<Route path='/register' element={<RegisterPage/>} />
							<Route path='/login' element={<LoginPage/>} />
							<Route path='/dataset' element={<DataSetCreator/>} />
							<Route path='/art' element={<ArtPage/>} />
						</Routes>
					</DatasetProvider>
				</div>
			</Router>
		</div>
	);
}
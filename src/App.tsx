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
import { useWebsocketNotificationListener } from './helpers/events';

function ScrollToTop() {
	const location = useLocation();
  
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [location]);
  
	return null; // this component does not render anything
}
  
export default function App() {
	const [loading, setLoading] = useState(false);

	const isProduction = process.env.NODE_ENV === 'production';

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
				<NavBar/>
				<div className='main-content'>
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
					</Routes>
				</div>
			</Router>
		</div>
	);
}
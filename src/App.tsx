/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Footer from "./components/shared/footer";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, redirect } from 'react-router-dom';
import HomePage from "./pages";
import { useEffect, useState } from "react";
import { firebaseApp } from "./firebase-config";
import { getAuth, signOut } from "firebase/auth";

import NavBar from "./components/shared/navbar";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import AccountPage from "./pages/account";
import CharactersPage from "./pages/characters";
import CharacterCRUD from "./pages/character-crud";
import ChatPage from "./pages/chat";
import AdminPage from "./pages/admin";
import PricingPage from './pages/pricing';
import PrivacyPage from './pages/privacy';

function ScrollToTop() {
	const location = useLocation();
  
	useEffect(() => {
		window.scrollTo(0, 0);
	}, [location]);
  
	return null; // this component does not render anything
}
  
export default function App() {
	const [loading, setLoading] = useState(true);
	const auth = getAuth(firebaseApp);
	const [user, setUser] = useState(auth.currentUser);

	useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if(user !== null) {
                setUser(user);
            }else {
                setUser(null);
            }
        });
        return unsubscribe;
    }, [auth]);

	const isProduction = process.env.NODE_ENV === 'production';

	const logout = () => {
		signOut(auth).then(() => {
			setUser(null);
		}).catch((err) => {
			console.log(err);
		});
	}
	
	auth.authStateReady().then(() => {
		setLoading(false);
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
				<NavBar isProduction={isProduction} user={user} logout={logout}/>
				<div className='main-content'>
					<Routes>
					<Route path='/*' element={<Navigate to='/home' />} />
					<Route path='/create' element={<Navigate to='/characters/create' />} />
					<Route path='/home' element={<HomePage user={user} logout={logout} isProduction={isProduction}/>} />
					<Route path='/chat' element={<ChatPage auth={auth} logout={logout} isProduction={isProduction}/>} />
					<Route path='/characters/:id' element={<CharacterCRUD auth={auth} logout={logout} isProduction={isProduction}/>} />
					<Route path='/characters' element={<CharactersPage logout={logout} isProduction={isProduction} user={user} auth={auth}/>} />
					<Route path='/login' element={<LoginPage auth={auth} logout={logout} isProduction={isProduction}/>} />
					<Route path='/register' element={<RegisterPage auth={auth} logout={logout} isProduction={isProduction}/>} />
					<Route path='/account' element={<AccountPage auth={auth} logout={logout} isProduction={isProduction}/>} />
					<Route path='/admin' element={<AdminPage auth={auth} logout={logout} isProduction={isProduction}/>} />
					<Route path='/pricing' element={<PricingPage auth={auth} logout={logout} isProduction={isProduction}/>} />
					<Route path='/privacy' element={<PrivacyPage/>} />
					</Routes>
				</div>
				<Footer isProduction={isProduction}/>
			</Router>
		</div>
	);
}
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useLocation } from 'react-router-dom';
import WayWyIcon from '../WayWyIcon';
import { NavLink } from 'react-router-dom';
import { useWindowSize } from '../../../helpers/character-card';
interface FooterProps {
    isProduction: boolean;
    isSideMenuOpen?: boolean;
}

const Footer = (props: FooterProps) => {
    const { isProduction, isSideMenuOpen } = props;
    const [width] = useWindowSize();
    const location = useLocation();

    if (location.pathname.includes('admin') || location.pathname.includes('chat')) {
        return null;
    }

    const mainContentStyle = {
        marginLeft: isSideMenuOpen ? '250px' : '0', // Adjust '250px' to your sidebar's width
        transition: 'margin-left 0.5s' // Smooth transition
    };
    
    const isDesktop = width >= 1024;

    return (
        <footer className="dy-footer p-6 mt-[70px] bg-base-300 shadow-xl text-lg text-base-content" style={mainContentStyle}>
            <aside>
                <WayWyIcon className="logo w-14 h-14" />
                <h1 className="text-2xl font-extrabold text-base-content"><span className="bg-clip-text text-transparent bg-gradient-to-r to-secondary from-primary">Wayward Wyverns Softworks</span></h1>
                <p className='text-base-content'>Creating unique experiences.</p>
            </aside> 
            {/* <nav>
                <header className="footer-title">Company</header> 
                <a className="link link-hover">Contact</a>
            </nav>  */}
            <nav>
                <header className="dy-footer-title text-base-content">Legal</header>
                <NavLink className="dy-link dy-link-hover text-base-content" to='/privacy'>Terms of Use</NavLink>
                <NavLink className="dy-link dy-link-hover text-base-content" to='/privacy'>Privacy policy</NavLink>
            </nav>
        </footer>
    )
}

export default Footer;
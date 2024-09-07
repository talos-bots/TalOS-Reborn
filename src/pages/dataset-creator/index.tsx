/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { useEffect, useState } from "react";
import { Character } from "../../global_classes/Character";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ChatWindow from "./chat-window";
import StatisticsWindow from "./statistics-window";
import GenerationParameters from "./generation-parameters";
import ContactsBox from "./contacts-box";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import CharacterPopup from "../../components/shared/character-popup";
import { useCloseSidesListener } from '../../helpers/events';
import { useUser } from '../../components/shared/auth-provider';

const DataSetCreator = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user?.id) navigate(`/login?redirect=dataset`);
  }, [user, navigate, location]);

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showCharacterPopup, setShowCharacterPopup] = useState<boolean>(false);
  const [characterPopupCharacter, setCharacterPopupCharacter] = useState<Character | null>(null);

  const isDesktop = window.innerWidth > 768;

  // State variables to control drawer open/close
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  // Handlers to toggle drawers
  const toggleLeftDrawer = () => setIsLeftDrawerOpen(!isLeftDrawerOpen);
  const toggleRightDrawer = () => setIsRightDrawerOpen(!isRightDrawerOpen);

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setShowCharacterPopup(false);
    setIsLeftDrawerOpen(false);
  }

  const handleCharacterPopupToggle = (character?: Character) => {
    if (character) setCharacterPopupCharacter(character);
    setIsLeftDrawerOpen(false);
    setIsRightDrawerOpen(false);
    setShowCharacterPopup(!showCharacterPopup);
  }

  useCloseSidesListener(() => {
    setIsLeftDrawerOpen(false);
    setIsRightDrawerOpen(false);
  });

  return (
    <div className="grid grid-cols-12 w-full h-[92.5vh] max-h-[92.5vh] gap-2 md:p-4 text-base-content">
      <CharacterPopup isOpen={showCharacterPopup} toggleModal={handleCharacterPopupToggle} character={characterPopupCharacter} />
      <>
        {isDesktop ? (
          <>
            <div className="col-span-3 md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 p-2 max-h-[90vh]">
              <h3 className="font-bold justify-between flex flex-row">
                Available Characters
              </h3>
              <ContactsBox />
              <h3 className="font-bold justify-between flex flex-row">
                Statistics
              </h3>
              <StatisticsWindow />
            </div>
          </>
        ) : (
          <SwipeableDrawer
            anchor="left"
            open={isLeftDrawerOpen}
            onClose={toggleLeftDrawer}
            onOpen={toggleLeftDrawer}
            variant="temporary"
            transitionDuration={250}
            className="bg-transparent"
          >
            <div className="col-span-3 md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 p-2">
              <h3 className="font-bold justify-between flex flex-row">
                Available Characters
              </h3>
              <ContactsBox />
              <h3 className="font-bold justify-between flex flex-row">
                Statistics
              </h3>
              <StatisticsWindow />
              <button className="dy-btn dy-btn-error dy-btn-outline dy-btn-sm md:hidden" onClick={toggleLeftDrawer}>
                <ArrowRight />
              </button>
            </div>
          </SwipeableDrawer>
        )}
      </>
      <ChatWindow character={selectedCharacter} persona={null} toggleLeftDrawer={toggleLeftDrawer} toggleRightDrawer={toggleRightDrawer} showCharacterPopup={handleCharacterPopupToggle} />
      {isDesktop ? (
        <div className="col-span-2 shadow-xl md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 text-right p-2 max-h-[90vh]">
          <h3 className="font-bold text-right flex flex-row-reverse justify-between">
            Dataset Parameters
          </h3>
          <GenerationParameters />
        </div>
      ) : (
        <SwipeableDrawer
          anchor="right"
          open={isRightDrawerOpen}
          onClose={toggleRightDrawer}
          onOpen={toggleRightDrawer}
          variant="temporary"
          transitionDuration={250}
          className="bg-transparent"
        >
          <div className="col-span-2 shadow-xl bg-base-300 md:p-4 h-full flex flex-col gap-2 text-right p-2">
            <h3 className="font-bold text-right flex flex-row-reverse justify-between">
              Dataset Parameters
            </h3>
            <GenerationParameters />
            <button className="dy-btn dy-btn-error dy-btn-outline dy-btn-sm md:hidden" onClick={toggleRightDrawer}>
              <ArrowLeft />
            </button>
          </div>
        </SwipeableDrawer>
      )}
    </div>
  )
}
export default DataSetCreator;
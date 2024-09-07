import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../components/shared/auth-provider";
import { useEffect, useState } from "react";
import React from 'react';
import CharacterPopup from "../../components/shared/character-popup";
import { Character } from "../../global_classes/Character";
import DiscordPanel from "../../components/settings/DiscordPanel";
import RoomManager from "./room-manager/RoomManager";

const DiscordPage = () => {
  const [discordOnline, setDiscordOnline] = useState<boolean>(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showCharacterPopup, setShowCharacterPopup] = useState<boolean>(false);
  const [characterPopupCharacter, setCharacterPopupCharacter] = useState<Character | null>(null);

  useEffect(() => {
    if (!user?.id) navigate(`/login?redirect=discord`);
  }, [user, navigate, location]);


  const handleCharacterPopupToggle = (character?: Character) => {
    if (character) setCharacterPopupCharacter(character);
    setShowCharacterPopup(!showCharacterPopup);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 w-full md:h-[92.5vh] md:max-h-[92.5vh] md:gap-2 md:p-4 text-base-content">
      <CharacterPopup isOpen={showCharacterPopup} toggleModal={handleCharacterPopupToggle} character={characterPopupCharacter} />
      <div className="md:col-span-3 md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 p-4 md:max-h-[90vh] overflow-y-auto">
        <h3>Discord Bot Configuration</h3>
        <DiscordPanel discordOnline={discordOnline} setDiscordOnline={setDiscordOnline} />
      </div>
      <div className="md:col-span-9 md:rounded-box bg-base-300 md:p-4 h-full flex flex-col gap-2 p-4 md:max-h-[90vh] overflow-y-auto">
        <h3>Room Manager</h3>
        <RoomManager discordOnline={discordOnline} />
      </div>
    </div>
  )
}
export default DiscordPage;   
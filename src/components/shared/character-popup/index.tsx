/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character } from '../../../global_classes/Character';

interface CharacterPopupProps {
	isOpen: boolean;
	toggleModal: () => void;
	character: Character;
}

const CharacterPopup = (props: CharacterPopupProps) => {
	const { isOpen, toggleModal, character } = props;
	const [creatorName, setCreatorName] = useState<string>('');
	const modalContentRef = useRef(null); // Ref for modal content

	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
        if (isOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    }, [isOpen]);

	useEffect(() => {
		if (isOpen) {
			document.body.classList.add('no-scroll');
		} else {
			document.body.classList.remove('no-scroll');
		}
	}, [character, isOpen]);

	useEffect(() => {
		setLoading(true);
	}, [character])
	
	const handleClickOutside = (event) => {
		if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
			toggleModal();
		}
	};

	useEffect(() => {
		const handleEscapeKey = (event) => {
			if (event.key === 'Escape') {
				toggleModal();
			}
		};
		document.addEventListener('keydown', handleEscapeKey, true);
		return () => {
			document.removeEventListener('keydown', handleEscapeKey, true);
		};
	}, [toggleModal]);

	if(!character) return null;
	
	if(loading) return (
		<div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
			<div className="bg-base-300 rounded-box p-2 md:p-6">
				<div className="flex flex-row justify-center items-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
				</div>
			</div>
		</div>
	)

	return (
		<>
			{isOpen && (
				<div className="fixed top-0 left-0 w-full p-2 md:p-6 h-full bg-black bg-opacity-50 z-50 flex justify-center items-center text-base-content" onClick={handleClickOutside}>
                    <div className="flex flex-col rounded-lg max-w-screen-2xl h-full bg-base-300 overflow-y-auto p-4 w-full md:p-6"
                        ref={modalContentRef} onClick={(e) => { e.stopPropagation() }}
                    >
						<h2 className='text-left font-extrabold'>{character.name}</h2>
						<button className="fixed top-4 right-4 hover:text-red-500" onClick={()=>toggleModal()}>
							X
						</button>
						<div className="flex flex-col md:flex-wrap gap-2 md:max-h-[calc(90vh-80px)] h-full w-full md:pr-6">
							<img className='aspect-auto max-w-[12rem] object-cover rounded-md' src={character.avatar}/>
							<h3 className='text-left font-semibold'>Character Prompt</h3>
							<div className='text-left flex flex-col w-full md:w-1/4 '>
								<label className='text-left font-semibold'>Name</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character.name}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 ' + (character?.personality?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Personality</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.personality}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 ' + (character?.description?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Description</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.description}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 ' + (character?.thought_pattern?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Thought Pattern</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.thought_pattern}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.first_mes?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>First Message</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.first_mes}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.mes_example?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Message Examples</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.mes_example}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.scenario?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Scenario</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.scenario}</p>
							</div>
							<h3 className='text-left font-semibold'>Character Summary</h3>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.creator_notes?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Creator Notes</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.creator_notes}</p>
							</div>
							<div className='text-left flex flex-col w-full md:w-1/4 gap-2'>
								<h3 className='font-semibold text-left'>Metadata</h3>
								<div className='flex flex-row gap-2 items-center'>
									<h4 className='text-left font-semibold'>Authored by: </h4>
									<h4 className='text-left dy-textarea w-full'>{creatorName}</h4>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>	
	);
};

export default CharacterPopup;
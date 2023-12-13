/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../../../firebase-config';
import { checkIsAdmin } from '../../../firebase_api/adminAPI';
import { approveCharacter, declineCharacter, makeCharacterCanon, makeCharacterNSFW, voteForCharacter } from '../../../firebase_api/characterAPI';
import { Character } from '../../../global_classes/Character';
import { getUserDataCallable } from '../../../firebase_api/userlore';

interface CharacterPopupProps {
	isOpen: boolean;
	toggleModal: () => void;
	character: Character;
}

const CharacterPopup = (props: CharacterPopupProps) => {
	const { isOpen, toggleModal, character } = props;
	const [creatorName, setCreatorName] = useState<string>('');
	const [creatorPhoto, setCreatorPhoto] = useState<string>('');
	const modalContentRef = useRef(null); // Ref for modal content
	const [isAdmin, setIsAdmin] = useState(false);
	const [isNSFW, setIsNSFW] = useState(character?.nsfw ?? false);

	const auth = getAuth(firebaseApp);
	const navigate = useNavigate();

	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
        if (isOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    }, [isOpen]);

	useEffect(() => {
		if(location.pathname === '/admin') {
			const init = async () => {
				const admin = await checkIsAdmin(auth?.currentUser?.uid);
				setIsAdmin(admin);
			}
			init();
		}
	}), [navigate, auth]

	useEffect(() => {
		const init = async () => {
			const data = await getUserDataCallable(character.creator);
			setCreatorName(data?.displayName ?? '');
			setCreatorPhoto(data?.photoURL ?? '');
			setLoading(false);
		}
		if (character) {
			init();
		}
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
	
	const approve = async () => {
		if(!character) return;
		if(!isAdmin) return;
		await approveCharacter(character).then((result) => {
			if(result) {
				console.log('Character approved successfully!');
			}else{
				console.log('Character approval failed!');
			}
		}).catch((error) => {
			console.log(error);
		});
		toggleModal();
	};

	const decline = async () => {
		if(!character) return;
		if(!isAdmin) return;
		await declineCharacter(character).then((result) => {
			if(result) {
				console.log('Character declined successfully!');
			}else{
				console.log('Character decline failed!');
			}
		}).catch((error) => {
			console.log(error);
		});
		toggleModal();
	}

	const vote = async () => {
		await voteForCharacter(character._id).then((result) => {
			if(result) {
				console.log('Character voted for successfully!');
			}else{
				console.log('Character vote failed!');
			}
		}).catch((error) => {
			console.log(error);
		});
		toggleModal();
	}

	const makeCanon = async () => {
		if(!character) return;
		await makeCharacterCanon(character._id).then((result) => {
			if(result) {
				console.log('Character canonized successfully!');
			}else{
				console.log('Character canonization failed!');
			}
		}).catch((error) => {
			console.log(error);
		});
		toggleModal();
	}

	const makeNSFW = async () => {
		if(!character) return;
		await makeCharacterNSFW(character._id).then((result) => {
			if(result) {
				setIsNSFW(true)
				console.log('Character marked NSFW successfully!');
			}else{
				setIsNSFW(false)
				console.log('Character NSFW marked failure!');
			}
		}).catch((error) => {
			console.log(error);
		});
	}

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
							<h3 className='text-left font-semibold'>Biography</h3>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.firstName?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>First Name</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character.firstName}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.middleName?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Middle Name(s)</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character.middleName}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.lastName?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Last Name</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character.lastName}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.gender?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Gender</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character.gender}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.species?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Species</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.species? character.species : 'Human'}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.ethnicity?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Ethnicity</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.ethnicity}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.sexuality?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Sexuality</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.sexuality}</p>
							</div>
							<h3 className='text-left font-semibold'>Physicial Description</h3>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.height?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Height</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.height}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.weight?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Weight</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.weight}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.hair_color?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Hair Color</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.hair_color}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.eye_color?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Eye Color</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.eye_color}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.skin_color?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Skin Color</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.skin_color}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.face_description?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Facial Description</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.face_description}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.body_description?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Body Description</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.body_description}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.clothing_description?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Clothing Style</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.clothing_description}</p>
							</div>
							<h3 className='text-left font-semibold'>Character Summary</h3>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.family_description?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Family Description</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.family_description}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.creator_notes?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Creator Notes</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.creator_notes}</p>
							</div>
							<div className={'text-left flex flex-col w-full md:w-1/4 '  + (character?.ooc_blurbs.join('\n\n')?.trim().length < 1 ? 'hidden' : '')}>
								<label className='text-left font-semibold'>Extra Information</label>
								<p className='text-left dy-textarea h-fit min-h-[2.5rem] line-clamp-4 overflow-y-scroll'>{character?.ooc_blurbs.join('\n\n')}</p>
							</div>
							<div className='text-left flex flex-col w-full md:w-1/4 gap-2'>
								<h3 className='font-semibold text-left'>Metadata</h3>
								<div className='flex flex-row gap-2 items-center'>
									<h4 className='text-left font-semibold'>Authored by: </h4>
									<img className={'avatar w-8 h-8 ' + ((!creatorPhoto || creatorPhoto.length <= 1) && 'hidden') } src={creatorPhoto}/>
									<h4 className='text-left dy-textarea w-full'>{creatorName}</h4>
								</div>
								<div className='flex flex-row gap-2 items-center'>
									<h4 className='text-left font-semibold'>NSFW?</h4>
									<h4 className='text-left dy-textarea w-full'>{isNSFW? 'Yes' : 'No'}</h4>
								</div>
								<div className='flex flex-row gap-2 items-center'>
									<h4 className='text-left font-semibold'>Orgin: </h4>
									<h4 className='text-left dy-textarea w-full'>{character?.origin}</h4>
								</div>
								{isAdmin && (
									<>
										<div className='flex flex-row gap-2 items-center'>
											<h4 className='text-left font-semibold'>Verification Status: </h4>
											<h4 className='text-left dy-textarea w-full'>{character?.verification_info?.status}</h4>
										</div>
										<button className='dy-btn hover:dy-btn-primary' onClick={()=>{navigate(`/characters/${character._id}`)}}>Edit</button>
										<button className='dy-btn hover:dy-btn-primary' onClick={()=>{approve()}}>Approve</button>
										<button className='dy-btn hover:dy-btn-warning' onClick={()=>{decline()}}>Decline</button>
										<button className='dy-btn hover:dy-btn-primary' onClick={()=>{makeCanon()}}>Canonize</button>
										<button className='dy-btn hover:dy-btn-primary' onClick={()=>{makeNSFW()}}>{isNSFW? 'Mark SFW' : 'Mark NSFW'}</button>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</>	
	);
};

export default CharacterPopup;
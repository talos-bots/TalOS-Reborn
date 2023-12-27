import React, { useEffect, useState } from 'react';
import { useCloseSidesListener } from '../../helpers/events';
import { ArrowLeft, ArrowRight, Image, RotateCw, Settings, X } from 'lucide-react';
import { SwipeableDrawer } from '@mui/material';
import { DalleSize3, DalleSize2, DalleStyle, DiffusionCompletionConnectionTemplate, DiffusionType, dalleModels, DiffusionResponseObject } from '../../types';
import { deleteDiffusionConnectionById, fetchAllDiffusionConnections, generateDalleImage, saveDiffusionConnectionToLocal, testDallekey } from '../../api/diffusionAPI';
import { getAppSettingsDiffusionConnection, setAppSettingsDiffusion } from '../../api/settingsAPI';
import RequiredInputField, { RequiredSelectField } from '../../components/shared/required-input-field';
import { Helmet } from 'react-helmet-async';

function getForwardFacingName(type: DiffusionType): string {
    switch (type) {
        case 'Dalle':
            return 'OpenAI\'s Dall-E';
        case 'Auto1111':
            return 'Automatic1111\'s SDWebUI';
        case 'SDAPI':
            return '"The Stable Diffusion API" Service"';
        default:
            return type;
    }
}

const ArtPage = () => {
    // State variables to control drawer open/close
    const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
    const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

    // Handlers to toggle drawers
    const toggleLeftDrawer = () => setIsLeftDrawerOpen(!isLeftDrawerOpen);
    const toggleRightDrawer = () => setIsRightDrawerOpen(!isRightDrawerOpen);

    const connectionTypes: DiffusionType[] = ['Dalle', 'Auto1111']
    const [savedConnections, setSavedConnections] = useState<DiffusionCompletionConnectionTemplate[]>([])
    const [connectionType, setConnectionType] = useState<DiffusionType>(connectionTypes[0] as DiffusionType)
    const [connectionName, setConnectionName] = useState<string>('' as string)
    const [connectionID, setConnectionID] = useState<string>('' as string)
    const [connectionModel, setConnectionModel] = useState<string>('' as string)
    const [connectionStatus, setConnectionStatus] = useState<string>('Untested' as string)
    const [connectionModelList, setConnectionModelList] = useState<string[]>([] as string[])
    const [prompt, setPrompt] = useState<string>('' as string)
    const [negativePrompt, setNegativePrompt] = useState<string>('' as string)
    const [steps, setSteps] = useState<number>(4)
    const [numberOfImages, setNumberOfImages] = useState<number>(1)
    const [dalleStyle, setDalleStyle] = useState<DalleStyle>('vivid')
    const [dalleRatio, setDalleRatio] = useState<DalleSize2 | DalleSize3>('1024x1024')
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [revisedPrompt, setRevisedPrompt] = useState<string>('' as string)
    const [images, setImages] = useState<DiffusionResponseObject[]>([] as DiffusionResponseObject[])

    const [isGenerating, setIsGenerating] = useState<boolean>(false)

    const handleLoadConnections = () => {
        fetchAllDiffusionConnections().then((connections) => {
            setSavedConnections(connections)
        })
    }

    useEffect(() => {
        handleLoadConnections()
    }, [])

    useEffect(() => {
        const handleLoadConnection = () => {
            const connection = savedConnections.find((connection) => connection.id === connectionID)
            if (connection){
                setConnectionType(connection.type)
                setConnectionName(connection.name)
                setConnectionModel(connection.model)
            }else{
                setConnectionType(connectionTypes[0] as DiffusionType)
                setConnectionName('')
                setConnectionModel('')
            }
        }
        handleLoadConnection()
    }, [connectionID])
    
    useEffect(() => {
        getAppSettingsDiffusionConnection().then((settings) => {
            setConnectionID(settings)
        })
    }, [])

    useEffect(() => {
        if(connectionType == 'Dalle'){
            setConnectionModelList(dalleModels)
        }else if(connectionType == 'Auto1111'){
            setConnectionModelList([])
        }else{
            setConnectionModelList([])
        }
    }, [connectionType])

    const handleTestConnection = () => {
        const currentConnection = savedConnections.find((connection) => connection.id === connectionID)
        if (!currentConnection){
            setConnectionStatus('Failed')
            return
        }
        switch (connectionType) {
            case 'Dalle':
                if(!currentConnection.key){
                    setConnectionStatus('Failed')
                    return
                }
                testDallekey(currentConnection.key).then((response) => {
                    if(Array.isArray(response)){
                        setConnectionStatus('Connected')
                    }else{
                        setConnectionStatus('Failed')
                    }
                })
                break;
            default:
                break;
        }
    }
    
    const generateImage = () => {
        const currentConnection = savedConnections.find((connection) => connection.id === connectionID)
        if (!currentConnection){
            return
        }
        switch (connectionType) {
            case 'Dalle':
                if(!currentConnection.key){
                    return
                }
                setIsGenerating(true)
                generateDalleImage(prompt, dalleRatio, numberOfImages, dalleStyle, currentConnection.id, connectionModel).then((response) => {
                    console.log(response)
                    if(Array.isArray(response)){
                        setImages(response)
                        setRevisedPrompt(response[0].revisedPrompt)
                    }else{
                        setConnectionStatus('Failed')
                    }
                    setIsGenerating(false)
                }).catch((e) => {
                    setIsGenerating(false)
                    console.error(e)
                })
                break;
            default:
                break;
        }
    }

    useCloseSidesListener(() => {
        setIsLeftDrawerOpen(false);
        setIsRightDrawerOpen(false);
    });
    
    const goRight = () => {
        setPageNumber(pageNumber + 1)
    }
    const goLeft = () => {
        setPageNumber(pageNumber > 1 ? pageNumber - 1 : 1)
    }

    const calculateGridTemplate = () => {
        const cols = Math.ceil(Math.sqrt(numberOfImages));
        const rows = Math.ceil(numberOfImages / cols);
        return {
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
        };
    }

    return (
        <>
            <Helmet>
                <title>TalOS | Art</title>
            </Helmet>
            <SwipeableDrawer
                anchor="left"
                open={isLeftDrawerOpen}
                onClose={toggleLeftDrawer}
                onOpen={toggleLeftDrawer}
                variant="temporary"
                transitionDuration={250}
                className="bg-transparent"
            >
                <div className="bg-base-300 h-100vh flex flex-col gap-2 p-2 max-h-[100vh] w-50vw justify-between text-base-content">
                    <h3 className="text-center">Previous Images</h3>
                    <div className='flex flex-col gap-2 flex-grow bg-base-100 rounded-box p-2'>

                    </div>
                    <button className="dy-btn dy-btn-error dy-btn-outline dy-btn-sm md:hidden" onClick={toggleLeftDrawer}>
                        <ArrowRight/>
                    </button>
                </div>
            </SwipeableDrawer>
            <div className="w-full md:min-h-[92.5vh] max-h-[92.5vh] md:p-4 grid grid-cols-1 md:grid-cols-2 md:gap-2 text-base-content grid-rows-1">
                <div className="w-full max-h-[100%] flex-grow bg-base-300 rounded-box col-span-1 p-4 hidden md:grid md:grid-rows-3 overflow-y-scroll gap-4">
                    <div className='row-span-2 flex flex-col gap-2 flex-grow max-h-[2/3]'>
                        <h3 className='flex flex-row justify-between'>
                            <button className='dy-btn dy-btn-error dy-btn-outline dy-btn-sm'>
                                <X/>
                            </button>
                            <span className='text-center font-semibold'>Canvas</span>
                            <button className='dy-btn dy-btn-primary dy-btn-outline dy-btn-sm'>
                                <RotateCw/>
                            </button>
                        </h3>
                        <div className='rounded-box bg-base-200 flex-grow flex flex-col p-4 items-center justify-center gap-2 max-h-full h-full'>
                            {revisedPrompt !== "" && (
                                <p className='dy-textarea dy-textarea-bordered rounded-box w-full max-h-[40%] overflow-y-auto'>
                                    <i className=''>(Dall-E Revised Prompt)</i><br/>
                                    {revisedPrompt}
                                </p>
                            )}
                            {!isGenerating ? 
                                <div 
                                    className='grid gap-2 justify-center items-center'
                                    style={calculateGridTemplate()}>
                                    {images.map((imageData) => (
                                        <img key={imageData.url} src={imageData.url} className='rounded-box w-full h-auto max-h-[256px] object-cover'/>
                                    ))}
                                </div>
                            : (
                                <div className={"w-full h-full flex flex-col justify-center items-center " + (isGenerating && 'bg-gradient-to-br to-accent from-cyan-200 rounded-box animated-gradient')}>
                                    <p className={"text-center text-base-content text-xl " + (isGenerating && 'hidden')}>No images generated yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='row-span-1 flex flex-col max-h-full gap-2'>
                        <h3 className='flex flex-row justify-between'>
                            <button className='dy-btn dy-btn-primary dy-btn-outline dy-btn-sm' onClick={goLeft}>
                                <ArrowLeft/>
                            </button>
                            <span className='text-center font-semibold'>Previous Images</span>
                            <button className='dy-btn dy-btn-primary dy-btn-outline dy-btn-sm' onClick={goRight}>
                                <ArrowRight/>
                            </button>
                        </h3>
                        <div className='flex flex-grow rounded-box bg-base-200'>
                        </div>
                    </div>
                </div>
                <div className="w-full h-[100%] flex-grow bg-base-300 rounded-box col-span-1 p-4 flex flex-col overflow-y-scroll gap-2">
                    <h3 className='flex flex-row justify-between'>
                        <button className='dy-btn dy-btn-primary dy-btn-outline md:hidden dy-btn-sm' onClick={toggleLeftDrawer}>
                            <Image/>
                        </button>
                        <span className='text-center font-semibold'>Generation Parameters</span>
                    </h3>
                    <RequiredSelectField
                        label="Profile"
                        value={connectionID}
                        onChange={(e)=> setConnectionID(e.target.value)}
                        required={false}
                        className={'w-full'}
                    >
                        <option value={''}>None</option>
                        {savedConnections.map((connectionOption, index) => (
                            <option key={index} value={connectionOption.id}>{connectionOption.name}</option>
                        ))}
                    </RequiredSelectField>
                    <div className='w-full flex flex-row gap-2'>
                        <div className="flex flex-row gap-2 flex-grow">
                            <div className={"flex flex-col gap-2 flex-grow"}>
                                <p className="text-sm dy-textarea dy-textarea-bordered flex flex-row justify-between items-center"><b>Type</b>{getForwardFacingName(connectionType)}</p>
                                <p className="text-sm dy-textarea dy-textarea-bordered flex flex-row justify-between items-center">
                                    <b>Status</b> {connectionStatus}
                                </p>
                            </div>
                            <button className="dy-btn dy-btn-primary h-full" onClick={handleTestConnection}>Test Connection</button>
                        </div>
                        <div className="flex flex-col gap-2 flex-grow">
                            <RequiredSelectField
                                label="Model"
                                value={connectionModel}
                                onChange={(e)=> setConnectionModel(e.target.value)}
                                required={false}
                                className={'flex-grow flex'}
                            >
                                <option value={''}>None</option>
                                {connectionModelList.map((connectionOption, index) => (
                                    <option key={index} value={connectionOption}>{connectionOption}</option>
                                ))}
                            </RequiredSelectField>
                        </div>
                    </div>
                    <div className='w-full flex flex-col gap-2'>
                        <label className='font-semibold w-full'>Prompt</label>
                        <textarea className='dy-textarea dy-textarea-bordered flex-grow' placeholder='Prompt' value={prompt} onChange={(e) => setPrompt(e.target.value)}/>
                        <div className={(connectionType === 'Dalle' && 'hidden')}>
                            <label className='font-semibold w-full'>Negative Prompt</label>
                            <textarea className='dy-textarea dy-textarea-bordered flex-grow' placeholder='Negative Prompt' value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)}/>
                        </div>
                        <div className={'flex flex-row gap-2'}>
                            <RequiredSelectField
                                label={'Dalle Style'}
                                value={dalleStyle}
                                onChange={(e)=> setDalleStyle(e.target.value as DalleStyle)}
                                required={false}
                                className={((connectionModel === '') ? 'hidden' : 'flex-grow flex')}
                            >
                                <option value={'vivid'}>Vivid</option>
                                <option value={'natural'}>Natural</option>
                            </RequiredSelectField>
                            <RequiredSelectField
                                label={'Image Ratio'}
                                value={dalleRatio}
                                onChange={(e)=> setDalleRatio(e.target.value as DalleSize3)}
                                required={false}
                                className={((connectionModel === 'dall-e-2') || (connectionModel === '') ? 'hidden' : 'flex-grow flex')}
                            >
                                <option value={'1024x1024'}>Square</option>
                                <option value={'1792x1024'}>Landscape</option>
                                <option value={'1024x1792'}>Portrait</option>
                            </RequiredSelectField>
                            <RequiredSelectField
                                label={'Image Size'}
                                value={dalleRatio}
                                onChange={(e)=> setDalleRatio(e.target.value as DalleSize2)}
                                required={false}
                                className={(((connectionModel === 'dall-e-3') || (connectionModel === '')) ? 'hidden' : 'flex-grow flex')}
                            >
                                <option value={'256x256'}>Small</option>
                                <option value={'512x512'}>Medium</option>
                                <option value={'1024x1024'}>Large</option>
                            </RequiredSelectField>
                        </div>
                        <div className={connectionModel === 'dall-e-3' ? 'hidden' : 'flex flex-col gap-2'}>
                            <label className='font-semibold w-full'>Number of Images</label>
                            <div className='flex flex-row gap-2'>
                                <input className='dy-input dy-input-bordered w-[90%]' type='range' min={1} max={10} placeholder='Number of Images' value={numberOfImages} onChange={(e) => setNumberOfImages(parseInt(e.target.value))}/>
                                <input className='dy-input dy-input-bordered flex-grow' type='number' min={1} max={10} placeholder='Number of Images' value={numberOfImages} onChange={(e) => setNumberOfImages(parseInt(e.target.value))}/>
                            </div>
                        </div>
                        <button className='dy-btn dy-btn-primary' onClick={generateImage}>Generate Image</button>
                    </div>
                </div>
            </div>

        </>
    );
}
export default ArtPage
import React, { useEffect, useState } from 'react';
import { useCloseSidesListener } from '../../helpers/events';
import { ArrowLeft, ArrowRight, Image, RotateCw, Settings, X } from 'lucide-react';
import { SwipeableDrawer } from '@mui/material';
import { DalleSize3, DalleSize2, DalleStyle, DiffusionCompletionConnectionTemplate, DiffusionType, dalleModels, DiffusionResponseObject, SamplerAlgorithim, sizePresets, samplersArray, NovelAIUndesiredContentPreset, novelAIUndesiredContentPresets, NovelAIModels } from '../../types';
import { deleteDiffusionConnectionById, fetchAllDiffusionConnections, generateDalleImage, generateNovelAIImage, saveDiffusionConnectionToLocal, testDallekey, testNovelAIKey } from '../../api/diffusionAPI';
import { getAppSettingsDiffusionConnection, setAppSettingsDiffusion } from '../../api/settingsAPI';
import RequiredInputField, { RequiredSelectField } from '../../components/shared/required-input-field';
import { Helmet } from 'react-helmet-async';
import { imageModal } from '../../components/shared/image-modal';

function getForwardFacingName(type: DiffusionType): string {
    switch (type) {
        case 'Dalle':
            return 'OpenAI\'s Dall-E';
        case 'Auto1111':
            return 'Automatic1111\'s SDWebUI';
        case 'SDAPI':
            return '"The Stable Diffusion API" Service"';
        case 'NovelAI':
            return 'NovelAI\'s Service';
        default:
            return 'Unknown Service';
    }
}

const ArtPage = () => {
    // State variables to control drawer open/close
    const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
    const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

    // Handlers to toggle drawers
    const toggleLeftDrawer = () => setIsLeftDrawerOpen(!isLeftDrawerOpen);
    const toggleRightDrawer = () => setIsRightDrawerOpen(!isRightDrawerOpen);

    const connectionTypes: DiffusionType[] = ['Dalle', 'Auto1111', 'NovelAI']
    const [previousImages, setPreviousImages] = useState<DiffusionResponseObject[]>([] as DiffusionResponseObject[]);
    const [savedConnections, setSavedConnections] = useState<DiffusionCompletionConnectionTemplate[]>([])
    const [connectionType, setConnectionType] = useState<DiffusionType | null>(null)
    const [connectionName, setConnectionName] = useState<string>('' as string)
    const [connectionID, setConnectionID] = useState<string>('' as string)
    const [connectionModel, setConnectionModel] = useState<string>('' as string)
    const [connectionStatus, setConnectionStatus] = useState<string>('Untested' as string)
    const [connectionModelList, setConnectionModelList] = useState<string[]>([] as string[])
    const [dalleStyle, setDalleStyle] = useState<DalleStyle>('vivid')
    const [dalleRatio, setDalleRatio] = useState<DalleSize2 | DalleSize3>('1024x1024')
    // generation parameters
    const [prompt, setPrompt] = useState<string>('' as string)
    const [negativePrompt, setNegativePrompt] = useState<string>('' as string)
    const [steps, setSteps] = useState<number>(28)
    const [numberOfImages, setNumberOfImages] = useState<number>(1)
    const [width, setWidth] = useState<number>(832)
    const [height, setHeight] = useState<number>(1216)
    const [seed, setSeed] = useState<number>(0)
    const [guidance, setGuidance] = useState<number>(5)
    const [sampler, setSampler] = useState<SamplerAlgorithim>('k_euler')
    // novelai specific parameters
    const [undesiredContentPresetIndex, setUndesiredContentPresetInex] = useState<number>(0)
    // image data
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [revisedPrompt, setRevisedPrompt] = useState<string>('' as string)
    const [images, setImages] = useState<DiffusionResponseObject[]>([] as DiffusionResponseObject[])
    // page data
    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const [sizeIndex, setSizeIndex] = useState<number>(0)

    const handleSizeChange = (index: number) => {
        const size = sizePresets[index];
        if (!size) return;
        setWidth(size.width);
        setHeight(size.height);
        setSizeIndex(index);
    }

    const handleLoadConnections = async () => {
        await fetchAllDiffusionConnections().then((connections) => {
            setSavedConnections(connections)
        })
    }

    const handleLoadConnection = (id: string) => {
        const connection = savedConnections.find((connection) => connection.id === id as string)
        if (connection){
            console.log(connection)
            setConnectionType(connection.type)
            setConnectionName(connection.name)
            setConnectionModel(connection.model)
        }else{
            console.log('no connection found')
            setConnectionType(null)
            setConnectionName('')
            setConnectionModel('')
        }
    }

    useEffect(() => {
        handleLoadConnections()
    }, [])
    
    useEffect(() => {
        handleLoadConnection(connectionID)
    }, [connectionID, connectionType, savedConnections])

    useEffect(() => {
        if(connectionType == 'Dalle'){
            setConnectionModelList(dalleModels)
        } else if(connectionType == 'Auto1111'){
            setConnectionModelList([])
        } else if(connectionType == 'NovelAI'){
            setConnectionModelList(NovelAIModels)
        } else {
            setConnectionModelList([])
        }
    }, [connectionType])

    const setParametersInLocalStorage = () => {
        localStorage.setItem('seed', seed.toString())
        localStorage.setItem('guidance', guidance.toString())
        localStorage.setItem('steps', steps.toString())
        localStorage.setItem('sampler', sampler)
        localStorage.setItem('numberOfImages', numberOfImages.toString())
        localStorage.setItem('prompt', prompt)
        localStorage.setItem('negativePrompt', negativePrompt)
        localStorage.setItem('dalleStyle', dalleStyle)
        localStorage.setItem('dalleRatio', dalleRatio)
        localStorage.setItem('width', width.toString())
        localStorage.setItem('height', height.toString())
        localStorage.setItem('sizeIndex', sizeIndex.toString())
        localStorage.setItem('undesiredContentPresetIndex', undesiredContentPresetIndex.toString())
    }

    const getParametersFromLocalStorage = () => {
        const seed = localStorage.getItem('seed')
        const guidance = localStorage.getItem('guidance')
        const steps = localStorage.getItem('steps')
        const sampler = localStorage.getItem('sampler')
        const numberOfImages = localStorage.getItem('numberOfImages')
        const prompt = localStorage.getItem('prompt')
        const negativePrompt = localStorage.getItem('negativePrompt')
        const dalleStyle = localStorage.getItem('dalleStyle')
        const dalleRatio = localStorage.getItem('dalleRatio')
        const width = localStorage.getItem('width')
        const height = localStorage.getItem('height')
        const sizeIndex = localStorage.getItem('sizeIndex')
        const undesiredContentPresetIndex = localStorage.getItem('undesiredContentPresetIndex')
        if (seed){
            setSeed(parseInt(seed))
        }
        if (guidance){
            setGuidance(parseFloat(guidance))
        }
        if (steps){
            setSteps(parseInt(steps))
        }
        if (sampler){
            setSampler(sampler as SamplerAlgorithim)
        }
        if (numberOfImages){
            setNumberOfImages(parseInt(numberOfImages))
        }
        if (prompt){
            setPrompt(prompt)
        }
        if (negativePrompt){
            setNegativePrompt(negativePrompt)
        }
        if (dalleStyle){
            setDalleStyle(dalleStyle as DalleStyle)
        }
        if (dalleRatio){
            setDalleRatio(dalleRatio as DalleSize2 | DalleSize3)
        }
        if (width){
            setWidth(parseInt(width))
        }
        if (height){
            setHeight(parseInt(height))
        }
        if (sizeIndex){
            setSizeIndex(parseInt(sizeIndex))
        }
        if (undesiredContentPresetIndex){
            setUndesiredContentPresetInex(parseInt(undesiredContentPresetIndex))
        }
    }

    useEffect(() => {
        getParametersFromLocalStorage()
    }, [])

    useEffect(() => {
        setParametersInLocalStorage()
    }, [seed, guidance, steps, sampler, numberOfImages, prompt, negativePrompt, dalleStyle, dalleRatio, width, height, sizeIndex, undesiredContentPresetIndex])
    
    const handleTestConnection = () => {
        const currentConnection = savedConnections.find((connection) => connection.id === connectionID)
        if (!currentConnection){
            setConnectionStatus('Failed')
            return
        }
        switch (connectionType) {
            case 'Dalle':
                if (!currentConnection.key){
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
            case 'NovelAI':
                if (!currentConnection.key){
                    setConnectionStatus('Failed')
                    return
                }
                testNovelAIKey(currentConnection.key).then((response) => {
                    if (response){
                        setConnectionStatus('Connected')
                    } else {
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
                        setPreviousImages([...previousImages, ...response])
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
            case 'NovelAI':
                if(!currentConnection.key){
                    return
                }
                setIsGenerating(true)
                generateNovelAIImage(
                    {
                        prompt: prompt,
                        connectionId: currentConnection.id,
                        negative_prompt: negativePrompt,
                        steps: steps,
                        width: width,
                        height: height,
                        guidance: guidance,
                        sampler: sampler,
                        number_of_samples: numberOfImages,
                        seed: seed,
                        ucPreset: novelAIUndesiredContentPresets[undesiredContentPresetIndex].value
                    },
                ).then((response) => {
                    console.log(response)
                    if(Array.isArray(response)){
                        setImages(response)
                        setPreviousImages([...previousImages, ...response])
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
            <div className="w-full md:min-h-[92.5vh] md:max-h-[92.5vh] md:p-4 grid grid-cols-1 md:grid-cols-2 md:gap-2 text-base-content grid-rows-1">
                <div className="w-full max-h-[100%] flex-grow bg-base-300 rounded-box col-span-1 p-4 grid grid-rows-3 overflow-y-scroll gap-4">
                    <div className='row-span-2 flex flex-col gap-2 flex-grow max-h-[2/3]'>
                        <h3 className='flex flex-row justify-between'>
                            <button className='dy-btn dy-btn-error dy-btn-outline dy-btn-sm' onClick={()=>{setImages([])}}>
                                <X/>
                            </button>
                            <span className='text-center font-semibold'>Canvas</span>
                            <button className='dy-btn dy-btn-primary dy-btn-outline dy-btn-sm' onClick={()=>{generateImage()}}>
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
                                <div className='dy-carousel min-h-[512px]'>
                                    {images.map((imageData, index) => (
                                        <div key={imageData.url} id={`slide${index}`} className="dy-carousel-item relative w-full flex-row items-center justify-center min-h-[512px]">
                                            <img src={imageData.url} className='dy-carousel-item h-auto max-h-[512px] object-cover self-center rounded-box' onClick={() => {imageModal(imageData.url)}}/>
                                            {images.length > 1 && (
                                                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                                                    <a href={`#slide${index === 0 ? 0 : index - 1}`} className={"dy-btn dy-btn-circle dy-btn-primary "}>
                                                        <ArrowLeft/>
                                                    </a> 
                                                    <a href={`#slide${(index + 1 > (images.length - 1)) ? index : (index + 1)}`} className="dy-btn dy-btn-circle dy-btn-primary">
                                                        <ArrowRight/>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            : (
                                <div className={"w-full h-full min-h-[512px] flex flex-col justify-center items-center " + (isGenerating && 'bg-gradient-to-br to-accent from-cyan-200 rounded-box animated-gradient')}>
                                    <p className={"text-center text-base-content text-xl " + (isGenerating && 'hidden')}>No images generated yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='row-span-1 flex flex-col max-h-full gap-2'>
                        <h3 className='flex flex-row items-center justify-center'>
                            {/* <button className='dy-btn dy-btn-primary dy-btn-outline dy-btn-sm' onClick={goLeft}>
                                <ArrowLeft/>
                            </button> */}
                            <span className='text-center font-semibold'>Previous Images</span>
                            {/* <button className='dy-btn dy-btn-primary dy-btn-outline dy-btn-sm' onClick={goRight}>
                                <ArrowRight/>
                            </button> */}
                        </h3>
                        <div className='flex flex-grow rounded-box bg-base-200 flex-row p-4 relative dy-carousel gap-2'>
                            {previousImages.map((imageData, index) => (
                                <div key={imageData.url} id={`slide${index}`} className="dy-carousel-item relative flex-row items-center justify-center" onClick={() => {imageModal(imageData.url)}}>
                                    <img src={imageData.url} className='dy-carousel-item h-auto max-h-[200px] object-cover self-center rounded-box'/>
                                </div>
                            ))}
                            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                                <a className={"dy-btn dy-btn-circle dy-btn-primary dy-btn-sm"}>
                                    <ArrowLeft/>
                                </a> 
                                <a className="dy-btn dy-btn-circle dy-btn-primary dy-btn-sm">
                                    <ArrowRight/>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full h-[100%] flex-grow bg-base-300 rounded-box col-span-1 p-4 flex flex-col overflow-y-scroll gap-2">
                    <h3 className='flex flex-row justify-between'>
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
                    <div className='w-full flex flex-col md:flex-row gap-2'>
                        <div className="flex flex-row gap-2 flex-grow">
                            <div className={"flex flex-col gap-2 flex-grow"}>
                                <p className="text-sm dy-textarea dy-textarea-bordered flex flex-row justify-between items-center"><b>Type</b>{connectionType? getForwardFacingName(connectionType) : 'None'}</p>
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
                        <div className={(connectionType === 'Dalle' && 'hidden') + ' flex flex-col'}>
                            <label className='font-semibold w-full'>Negative Prompt</label>
                            <textarea className='dy-textarea dy-textarea-bordered flex-grow' placeholder='Negative Prompt' value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)}/>
                        </div>
                        <div className={'flex flex-row gap-2'}>
                            <RequiredSelectField
                                label={'Dalle Style'}
                                value={dalleStyle}
                                onChange={(e)=> setDalleStyle(e.target.value as DalleStyle)}
                                required={false}
                                className={((!connectionModel.includes('dall-e')) ? 'hidden' : 'flex-grow flex w-full')}
                            >
                                <option value={'vivid'}>Vivid</option>
                                <option value={'natural'}>Natural</option>
                            </RequiredSelectField>
                            <RequiredSelectField
                                label={'Image Ratio'}
                                value={dalleRatio}
                                onChange={(e)=> setDalleRatio(e.target.value as DalleSize3)}
                                required={false}
                                className={((connectionModel !== 'dall-e-3') ? 'hidden' : 'flex-grow flex w-full')}
                            >
                                <option value={'1024x1024'}>Square</option>
                                <option value={'1792x1024'}>Landscape</option>
                                <option value={'1024x1792'}>Portrait</option>
                            </RequiredSelectField>
                            <RequiredSelectField
                                label={'Image Size'} // TODO: Add custom size option
                                value={sizeIndex}
                                onChange={(e)=> handleSizeChange(parseInt(e.target.value))}
                                required={false}
                                className={((connectionModel === 'dall-e-3') || (connectionModel === 'dall-e-2') ? 'hidden' : 'flex-grow flex w-full')}
                            >
                                {sizePresets.map((size, index) => (
                                    <option key={index} value={index}>{`${size.serviceName}: ${size.size} - ${size.ratio} (${size.width}x${size.height})`}</option>
                                ))}
                            </RequiredSelectField>
                            <RequiredSelectField
                                label={'Image Size'}
                                value={dalleRatio}
                                onChange={(e)=> setDalleRatio(e.target.value as DalleSize2)}
                                required={false}
                                className={((connectionModel !== 'dall-e-2') ? 'hidden' : 'flex-grow flex w-full')}
                            >
                                <option value={'256x256'}>Small</option>
                                <option value={'512x512'}>Medium</option>
                                <option value={'1024x1024'}>Large</option>
                            </RequiredSelectField>
                            <RequiredSelectField
                                label={'Undesired Content Preset'}
                                value={undesiredContentPresetIndex}
                                onChange={(e)=> setUndesiredContentPresetInex(parseInt(e.target.value))}
                                required={false}
                                className={((connectionType !== 'NovelAI') ? 'hidden' : 'flex-grow flex w-full')}
                            >
                                {novelAIUndesiredContentPresets.map((preset, index) => (
                                    <option key={index} value={preset.value}>{preset.name}</option>
                                ))}
                            </RequiredSelectField>
                        </div>
                        <div className={connectionModel === 'dall-e-3' ? 'hidden' : 'flex flex-col gap-2'}>
                            <label className='font-semibold w-full'>Number of Images</label>
                            <div className='flex flex-row gap-2 items-center'>
                                <input className='dy-range dy-range-primary w-[90%]' type='range' min={1} max={9} placeholder='Number of Images' value={numberOfImages} onChange={(e) => setNumberOfImages(parseInt(e.target.value))}/>
                                <input className='dy-input dy-input-bordered flex-grow' type='number' min={1} max={9} placeholder='Number of Images' value={numberOfImages} onChange={(e) => setNumberOfImages(parseInt(e.target.value))}/>
                            </div>
                        </div>
                        <div className='flex flex-col md:flex-row gap-2'>
                            <div className={connectionModel.includes('dall-e') ? 'hidden' : 'flex flex-col gap-2'}>
                                <label className='font-semibold w-full'>Prompt Guidance</label>
                                <div className='flex flex-row gap-2 items-center'>
                                    <input className='dy-range dy-range-primary flex-grow' type='range' min={0.1} max={10} step={0.1} placeholder='Guidance' value={guidance} onChange={(e) => setGuidance(parseFloat(e.target.value))}/>
                                    <input className='dy-input dy-input-bordered flex-grow' type='number' min={0.1} max={10} step={0.1} placeholder='Guidance' value={guidance} onChange={(e) => setGuidance(parseFloat(e.target.value))}/>
                                </div>
                            </div>
                            <div className={connectionModel.includes('dall-e') ? 'hidden' : 'flex flex-col gap-2'}>
                                <label className='font-semibold w-full'>Steps</label>
                                <input className='dy-input dy-input-bordered flex-grow' type='number' min={1} max={50} placeholder='Steps' value={steps} onChange={(e) => setSteps(parseInt(e.target.value))}/>
                            </div>
                            <div className={connectionModel.includes('dall-e') ? 'hidden' : 'flex flex-col gap-2'}>
                                <label className='font-semibold w-full'>Sampler</label>
                                <select className='dy-select dy-select-bordered flex-grow' value={sampler} onChange={(e) => setSampler(e.target.value as SamplerAlgorithim)}>
                                    {samplersArray.map((samplerOption, index) => (
                                        <option key={index} value={samplerOption}>{samplerOption}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={connectionModel.includes('dall-e') ? 'hidden' : 'flex flex-col gap-2'}>
                                <label className='font-semibold w-full'>Seed</label>
                                <input className='dy-input dy-input-bordered flex-grow' type='number' min={0} max={9999999999} placeholder='Seed' value={seed} onChange={(e) => setSeed(parseInt(e.target.value))}/>
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
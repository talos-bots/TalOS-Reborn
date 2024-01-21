import { useEffect, useState } from "react";
import { SettingsInterface } from "../../types";
import { deleteSettingById, fetchAllSettings, fetchDefaultSettings, getAppSettingsSettings, saveSettingToLocal, setAppSettingsSettings } from "../../api/settingsAPI";
import RequiredInputField, { RequiredSelectField } from "../shared/required-input-field";

export type InstructMode = "Alpaca" | "Vicuna" | "Mistral" | "None" | "Metharme" | "Pygmalion";

const instructModes: InstructMode[] = ["Alpaca", "Vicuna", "Mistral", "None", "Metharme", "Pygmalion"];

const GenerationSettings = () => {
    const [maxContextLength, setMaxContextLength] = useState<number>(localStorage.getItem('maxContextLength') ? parseInt(localStorage.getItem('maxContextLength') as string) : 2048);
    const [maxTokens, setMaxTokens] = useState<number>(localStorage.getItem('maxTokens') ? parseInt(localStorage.getItem('maxTokens') as string) : 250);
    const [minLength, setMinLength] = useState<number>(localStorage.getItem('minLength') ? parseInt(localStorage.getItem('minLength') as string) : 0);
    const [repPen, setRepPen] = useState<number>(localStorage.getItem('repPen') ? parseFloat(localStorage.getItem('repPen') as string) : 1.1);
    const [repPenRange, setRepPenRange] = useState<number>(localStorage.getItem('repPenRange') ? parseInt(localStorage.getItem('repPenRange') as string) : 2048);
    const [repPenSlope, setRepPenSlope] = useState<number>(localStorage.getItem('repPenSlope') ? parseFloat(localStorage.getItem('repPenSlope') as string) : 0.9);
    const [temperature, setTemperature] = useState<number>(localStorage.getItem('temperature') ? parseFloat(localStorage.getItem('temperature') as string) : 0.71);
    const [tfs, setTfs] = useState<number>(localStorage.getItem('tfs') ? parseFloat(localStorage.getItem('tfs') as string) : 1);
    const [topA, setTopA] = useState<number>(localStorage.getItem('topA') ? parseFloat(localStorage.getItem('topA') as string) : 0.00);
    const [topK, setTopK] = useState<number>(localStorage.getItem('topK') ? parseInt(localStorage.getItem('topK') as string) : 40);
    const [topP, setTopP] = useState<number>(localStorage.getItem('topP') ? parseFloat(localStorage.getItem('topP') as string) : 0.9);
    const [minP, setMinP] = useState<number>(localStorage.getItem('minP') ? parseFloat(localStorage.getItem('minP') as string) : 0.0);
    const [typical, setTypical] = useState<number>(localStorage.getItem('typical') ? parseFloat(localStorage.getItem('typical') as string) : 1);
    const [samplerOrder, setSamplerOrder] = useState<number[]>(localStorage.getItem('samplerOrder') ? localStorage.getItem('samplerOrder')?.split(',').map(Number) : [6,3,2,5,0,1,4]);
    const [stopBrackets, setStopBrackets] = useState<boolean>(localStorage.getItem('stopBrackets') ? localStorage.getItem('stopBrackets') === 'true' : false);
    const [presencePenalty, setPresencePenalty] = useState<number>(localStorage.getItem('presencePenalty') ? parseFloat(localStorage.getItem('presencePenalty') as string) : 0.0);
    const [frequencyPenalty, setFrequencyPenalty] = useState<number>(localStorage.getItem('frequencyPenalty') ? parseFloat(localStorage.getItem('frequencyPenalty') as string) : 0.0);
    const [mirostatMode, setMirostatMode] = useState<number>(localStorage.getItem('mirostatMode') ? parseInt(localStorage.getItem('mirostatMode') as string) : 0);
    const [mirostatTau, setMirostatTau] = useState<number>(localStorage.getItem('mirostatTau') ? parseFloat(localStorage.getItem('mirostatTau') as string) : 0.0);
    const [mirostatEta, setMirostatEta] = useState<number>(localStorage.getItem('mirostatEta') ? parseFloat(localStorage.getItem('mirostatEta') as string) : 0.0);
    const [instructMode, setInstructMode] = useState<InstructMode>(localStorage.getItem('instructMode') ? localStorage.getItem('instructMode') as InstructMode : "None");
    const [presetID, setPresetID] = useState<string>(localStorage.getItem('presetID') ? localStorage.getItem('presetID') as string : '');
    const [presetName, setPresetName] = useState<string>(localStorage.getItem('presetName') ? localStorage.getItem('presetName') as string : '');
    const [availablePresets, setAvailablePresets] = useState<SettingsInterface[]>([] as SettingsInterface[]);
    const [defaultPresets, setDefaultPresets] = useState<SettingsInterface[]>([] as SettingsInterface[]);
    
    const handleLoadSettings = () => {
        fetchAllSettings().then((connections) => {
            setAvailablePresets(connections)
        })
        fetchDefaultSettings().then((connections) => {
            setDefaultPresets(connections)
        })
    }

    useEffect(() => {
        handleLoadSettings()
    }, [])

    const handleSavePreset = () => {
        let newID = presetID
        if (newID === ''){
            newID = new Date().getTime().toString()
        }
        const newConnection: SettingsInterface = {
            id: newID,
            name: presetName,
            context_length: maxContextLength,
            max_tokens: maxTokens,
            min_tokens: minLength,
            temperature: temperature,
            rep_pen: repPen,
            rep_pen_range: repPenRange,
            rep_pen_slope: repPenSlope,
            frequency_penalty: frequencyPenalty,
            presence_penalty: presencePenalty,
            min_p: minP,
            top_a: topA,
            top_k: topK,
            top_p: topP,
            typical: typical,
            tfs: tfs,
            sampler_order: samplerOrder,
            sampler_full_determinism: true,
            singleline: false,
            mirostat_eta: mirostatEta,
            mirostat_mode: mirostatMode,
            mirostat_tau: mirostatTau,
            instruct_mode: instructMode,
        }
        setPresetID(newID)
        if (availablePresets.some((connection) => connection.id === presetID)) {
            const index = availablePresets.findIndex((connection) => connection.id === presetID)
            availablePresets[index] = newConnection
        }else{
            setAvailablePresets([...availablePresets, newConnection])
        }
        saveSettingToLocal(newConnection)
        handleLoadSettings()
    }

    const handleDeleteConnection = () => {
        const index = availablePresets.findIndex((connection) => connection.id === presetID)
        availablePresets.splice(index, 1)
        setAvailablePresets([...availablePresets])
        deleteSettingById(presetID)
    }

    useEffect(() => {
        getAppSettingsSettings().then((settings) => {
            if(!settings) return
            if (settings === '') return;
            console.log(settings)
            setPresetID(settings)
        })
    }, [])
    
    const setPresetDefault = async () => {
        await setAppSettingsSettings(presetID)
    }

    const checkSettingsIsDefault = () => {
        const defaultConnection = defaultPresets.find((connection) => connection.id === presetID)
        if(defaultConnection){
            return true
        }
        return false
    }

    useEffect(() => {
        const saveToLocalStorage = () => {
            localStorage.setItem('presetID', presetID)
            localStorage.setItem('presetName', presetName)
            localStorage.setItem('maxContextLength', maxContextLength.toString())
            localStorage.setItem('maxTokens', maxTokens.toString())
            localStorage.setItem('minLength', minLength.toString())
            localStorage.setItem('repPen', repPen.toString())
            localStorage.setItem('repPenRange', repPenRange.toString())
            localStorage.setItem('repPenSlope', repPenSlope.toString())
            localStorage.setItem('temperature', temperature.toString())
            localStorage.setItem('tfs', tfs.toString())
            localStorage.setItem('topA', topA.toString())
            localStorage.setItem('topK', topK.toString())
            localStorage.setItem('topP', topP.toString())
            localStorage.setItem('minP', minP.toString())
            localStorage.setItem('typical', typical.toString())
            localStorage.setItem('samplerOrder', samplerOrder.toString())
            localStorage.setItem('stopBrackets', stopBrackets.toString())
            localStorage.setItem('presencePenalty', presencePenalty.toString())
            localStorage.setItem('frequencyPenalty', frequencyPenalty.toString())
            localStorage.setItem('mirostatMode', mirostatMode.toString())
            localStorage.setItem('mirostatTau', mirostatTau.toString())
            localStorage.setItem('mirostatEta', mirostatEta.toString())
            localStorage.setItem('instructMode', instructMode.toString())
        }
        saveToLocalStorage()
    }, [maxContextLength, maxTokens, minLength, repPen, repPenRange, repPenSlope, temperature, tfs, topA, topK, topP, minP, typical, samplerOrder, stopBrackets, presencePenalty, frequencyPenalty, mirostatMode, mirostatTau, mirostatEta, instructMode])

    useEffect(() => {
        const handleLoadConnection = () => {
            const connection = availablePresets.concat(defaultPresets).find((connection) => connection.id === presetID)
            if (connection){
                setPresetName(connection.name)
                setFrequencyPenalty(connection.frequency_penalty)
                setMaxContextLength(connection.context_length)
                setMaxTokens(connection.max_tokens)
                setMinLength(connection.min_tokens)
                setMinP(connection.min_p)
                setMirostatEta(connection.mirostat_eta)
                setMirostatMode(connection.mirostat_mode)
                setMirostatTau(connection.mirostat_tau)
                setPresencePenalty(connection.presence_penalty)
                setRepPen(connection.rep_pen)
                setRepPenRange(connection.rep_pen_range)
                setRepPenSlope(connection.rep_pen_slope)
                setSamplerOrder(connection.sampler_order)
                setTemperature(connection.temperature)
                setTopA(connection.top_a)
                setTopK(connection.top_k)
                setTopP(connection.top_p)
                setTfs(connection.tfs)
                setTypical(connection.typical)
                setInstructMode(connection.instruct_mode)
            }
        }
        handleLoadConnection()
    }, [presetID])

    return (
        <div className="text-base-content flex flex-col gap-2">
            <div className="flex flex-row gap-2 w-full items-center justify-center">
                <RequiredSelectField
                    label="Settings Preset"
                    value={presetID}
                    onChange={(e)=> setPresetID(e.target.value)}
                    required={false}
                    className={'w-full'}
                >
                    <option value={''}>New Preset</option>
                    {availablePresets.concat(defaultPresets).map((connectionOption, index) => (
                        <option key={index} value={connectionOption.id}>{connectionOption.name}</option>
                    ))}
                </RequiredSelectField>
                <button className="dy-btn dy-btn-primary" onClick={handleSavePreset} disabled={checkSettingsIsDefault()}>Save</button>
                <button className="dy-btn dy-btn-error" onClick={handleDeleteConnection} disabled={checkSettingsIsDefault()}>Delete</button>
            </div>
            <div className="flex flex-row gap-2 w-full items-center justify-center">
                <button className="dy-btn dy-btn-primary" onClick={setPresetDefault}>Set As Default</button>
                <button className="dy-btn dy-btn-primary" onClick={handleSavePreset} disabled={checkSettingsIsDefault()}>Save</button>
            </div>
            <RequiredInputField
                type="text"
                label="Preset Name"
                value={presetName}
                onChange={(e)=> setPresetName(e.target.value)}
                required={false}
                className={''}
            />
            <RequiredSelectField
                label="Instruct Mode"
                value={instructMode}
                onChange={(e)=> setInstructMode(e.target.value as InstructMode)}
                required={false}
                className={'w-full'}
            >
                {instructModes.map((connectionOption, index) => (
                    <option key={index} value={connectionOption}>{connectionOption}</option>
                ))}
            </RequiredSelectField>
            <div className="flex flex-row gap-2 w-full items-center justify-center">
                <button className="dy-btn dy-btn-primary" onClick={setPresetDefault}>Set As Default</button>
                <button className="dy-btn dy-btn-primary" onClick={handleSavePreset} disabled={checkSettingsIsDefault()}>Save</button>
            </div>
            <div className="flex flex-col w-full overflow-y-auto text-left themed-box max-h-[600px]">
                <div className="flex flex-col ">
                    <span className=" font-semibold">Max Context Length</span>
                    <i className="text-sm">Controls how many 'tokens' are sent to the LLM. This will affect the speed of generation, the cohherrence of conversation flow, and the amount of memory used.
                (All endpoints, will not override model's max context length)</i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='512' max="8192" step="16" value={maxContextLength} onChange={async (e) => {setMaxContextLength(parseInt(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='512' max="8192" step="16" value={maxContextLength} onChange={async (e) => {setMaxContextLength(parseInt(e.target.value))}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Max Generation Length</span>
                    <i className="text-sm">Controls the maximum amount of return 'tokens' the LLM can send in reply to your prompt. This is <b>not</b> a gaurantor of length, but rather a limit.
                    (All endpoints, will not override model's max generation length)</i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='16' max='512' step="2" value={maxTokens} onChange={async (e) => {setMaxTokens(parseInt(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='dy-input' type="number" min='16' max='512' step="2" value={maxTokens} onChange={async (e) => {setMaxTokens(parseInt(e.target.value))}} />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className=" font-semibold">Min Length</span>
                    <i className="text-sm">This controls how many tokens the LLM will always generate. (Ooba, OpenAI, Claude, PaLM)</i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0' max='512' step='2' value={minLength} onChange={async (e) => {setMinLength(parseInt(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0' max='512' step='2' value={minLength} onChange={async (e) => {setMinLength(parseInt(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Temperature</span>
                    <i className="text-sm">Controls the randomness of the LLM. Lower values will make the LLM more predictable, higher values will make the LLM more random. (All endpoints)</i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min="0.10" max="2.00" step="0.01" value={temperature} onChange={async (e) => {setTemperature(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min="0.10" max="2.00" step="0.01" value={temperature} onChange={async (e) => {setTemperature(parseFloat(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Repetition Penalty</span>
                    <i className="text-sm">
                        Higher values make the output less repetitive. Lower values make the output more repetitive.
                        (Ooba, Kobold, Horde)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" step="0.01" min='1' max="1.50" value={repPen} onChange={async (e) => {setRepPen(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" step="0.01" min='1' max="1.50" id='input-container' type="number" value={repPen} onChange={async (e) => {setRepPen(parseFloat(e.target.value))}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Repetition Pen Range</span>
                    <i className="text-sm">                
                        Defines the number of tokens that will be checked for repetitions, starting from the last token generated. The larger the range, the more tokens are checked.
                        (Ooba, Kobold, Horde)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0' step="16" max="8192" value={repPenRange} onChange={async (e) => {setRepPenRange(parseInt(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0' step="16" max="8192" value={repPenRange} onChange={async (e) => {setRepPenRange(parseInt(e.target.value))}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Repetition Pen Slope</span>
                    <i className="text-sm">                
                        The penalty to repeated tokens is applied differently based on distance from the final token. The distribution of that penalty follows a S-shaped curve. 
                        If the sloping is set to 0, that curve will be completely flat. All tokens will be penalized equally. 
                        If it is set to a very high value, it'll act more like two steps: Early tokens will receive little to no penalty, but later ones will be considerably penalized.
                        (Ooba, Kobold, Horde)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0.0' max="10" step="0.1" value={repPenSlope} onChange={async (e) => {setRepPenSlope(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0.0' max="10" step="0.1" value={repPenSlope} onChange={async (e) => {setRepPenSlope(parseFloat(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Frequency Penalty</span>
                    <i className="text-sm">                
                        (Ooba, OpenAI)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0.00' max="10.00" step="0.05" value={frequencyPenalty} onChange={async (e) => {setFrequencyPenalty(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0.00' max="10.00" step="0.05" value={frequencyPenalty} onChange={async (e) => {setFrequencyPenalty(parseFloat(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Presence Penalty</span>
                    <i className="text-sm">                
                        (Ooba, OpenAI)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0.00' max="10.00" step="0.05" value={presencePenalty} onChange={async (e) => {setPresencePenalty(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0.00' max="10.00" step="0.05" value={presencePenalty} onChange={async (e) => {setPresencePenalty(parseFloat(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Min Probability</span>
                    <i className="text-sm">                
                        (Ooba, OpenAI)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0.00' max="1.00" step="0.01" value={minP} onChange={async (e) => {setMinP(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0.00' max="1.00" step="0.01" value={minP} onChange={async (e) => {setMinP(parseFloat(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span>Mirostat Mode</span>
                    <i className="text-sm">
                        1 is for llama.cpp only, 0 is off, 2 is vague and idk.        
                        (Ooba)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="number" min='0' max="2" step="1" value={mirostatMode} onChange={async (e) => {setMirostatMode(parseInt(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span>Mirostat Tau</span>
                    <i className="text-sm">
                        (Ooba)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0' max="10" step="0.05" value={mirostatTau} onChange={async (e) => {setMirostatTau(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0' max="10" step="0.05" value={mirostatTau} onChange={async (e) => {setMirostatTau(parseFloat(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span>Mirostat Eta</span>
                    <i className="text-sm">
                        (Ooba)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0' max="1" step="0.01" value={mirostatEta} onChange={async (e) => {setMirostatEta(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" type="number" min='0' max="1" step="0.01" value={mirostatEta} onChange={async (e) => {setMirostatEta(parseFloat(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Top A</span>
                    <i className="text-sm">                
                        Increasing A sets a stricter limit on output, narrowing down the choices, while decreasing A makes the limit more lenient, allowing for a wider range of outputs. 
                        This ensures that if there's a token with a very high likelihood, the choices will be limited, ensuring structured outputs, while also allowing creativity where possible.
                        (Ooba, Kobold, Horde)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0.00' max="1.00" step="0.01" value={topA} onChange={async (e) => {setTopA(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0.00' max="1.00" step="0.01" value={topA} onChange={async (e) => {setTopA(parseFloat(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Top K</span>
                    <i className="text-sm">                
                        Top K sampling is like picking from a list of most likely next words in a sentence. 
                        If you set the number higher, you consider more words as options, leading to diverse but possibly odd outputs. 
                        If you set it lower, you focus on just a few top choices, making outputs more predictable but potentially less creative.
                        (Ooba, Kobold, Horde)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0' max="120" step="1" value={topK} onChange={async (e) => {setTopK(parseInt(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0' max="120" step="1" value={topK} onChange={async (e) => {setTopK(parseInt(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Top P</span>
                    <i className="text-sm">                
                        Top P is like setting a budget for unpredictability in word choices. If you set Top P higher (closer to 1), you allow more diverse word choices, including less common ones. Set it lower (closer to 0), and you're sticking to the very most likely words, making outputs more focused but potentially less creative.
                        (OpenAI, Kobold, Horde, Ooba, Claude)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0.00' max='1' step='0.01' value={topP} onChange={async (e) => {setTopP(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0.00' max='1' step='0.01' value={topP} onChange={async (e) => {setTopP(parseFloat(e.target.value))}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Typical</span>
                    <i className="text-sm">                
                        Typical Sampling removes words based on how much they deviate from an expected "average randomness" measure.
                        Higher settings: Allow more words, loosening the filter.
                        Lower settings: Filter out more words, making the selection stricter.
                        (Kobold, Horde, Ooba)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0.00' max='1' step='0.01' value={typical} onChange={async (e) => {setTypical(parseFloat(e.target.value));}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0.00' max='1' step='0.01' value={typical} onChange={async (e) => {setTypical(parseFloat(e.target.value));}} />
                    </div>
                </div>
                <div className="flex flex-col ">
                    <span className=" font-semibold">Tail Free Sampling</span>
                    <i className="text-sm">                
                        Tail Free Sampling trims the least likely words from being chosen. It aims to balance creativity with consistency.
                        Higher settings: Keep more word options (larger token pools).
                        Lower settings: Trim more unlikely words.
                        (Kobold, Horde, Ooba)
                    </i>
                    <div className="w-full flex flex-row gap-2">
                        <input className="w-2/3 dy-input dy-input-bordered" type="range" min='0.00' max='1' step='0.01' value={tfs} onChange={async (e) => {setTfs(parseFloat(e.target.value))}} />
                        <input className="w-1/3 dy-input dy-input-bordered" id='input-container' type="number" min='0.00' max='1' step='0.01' value={tfs} onChange={async (e) => {setTfs(parseFloat(e.target.value))}} />
                    </div>
                </div>
                <div>
                    <span><i>The order by which all 7 samplers are applied, separated by commas. 0=top_k, 1=top_a, 2=top_p, 3=tfs, 4=typ, 5=temp, 6=rep_pen (Kobold, Horde)</i></span>
                </div>
                <div className="flex flex-col">
                    <span className=" font-semibold">Sampler Order</span>
                    <input className="dy-input dy-input-bordered" type="text" value={samplerOrder.toString()} onChange={async (e) => {setSamplerOrder(e.target.value.split(',').map(Number))}} />
                </div>
            </div>
        </div>
    );
};
export default GenerationSettings;
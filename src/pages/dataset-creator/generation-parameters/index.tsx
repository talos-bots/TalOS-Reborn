import React from 'react';
import { useEffect, useState } from "react";
import { Dataset } from '../../../global_classes/Dataset';
import { useDataset } from '../../../components/dataset/DatasetProvider';
import { fetchAllDatasets, saveDataset } from '../../../api/datasetAPI';

const GenerationParameters = () => {
    const { dataset, setDataset, updateName, updateDescription, updateMessages, updateBadWords, updateCharacters, updateSystemPrompts, updateRetries, updateBadWordsGenerated, updateId } = useDataset();
    const [localDataset, setLocalDataset] = useState(dataset || new Dataset());
    const [availableDatasets, setAvailableDatasets] = useState<Dataset[]>([]);
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        setLocalDataset(dataset || new Dataset());
        fetchAllDatasets().then((datasets) => {
            setAvailableDatasets(datasets);
        });
    }, []);
    
    useEffect(() => {
        if (id) {
            const newDataset = availableDatasets.find((dataset) => dataset.id === id);
            if (newDataset) {
                setLocalDataset(newDataset);
                setDataset(newDataset)
            }
        }
    }, [id, availableDatasets]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalDataset(prev => {
            let updatedValue: any = value;
            if (name === 'badWords') {
                // Split the string into an array of bad words
                updatedValue = value.split('\n');
            }else if (name === 'systemPrompts') {
                // Split the string into an array of system prompts
                updatedValue = value.split('\n');
            }
            const updatedValues = { ...prev, [name]: updatedValue };
            return new Dataset(
                updatedValues.id,
                updatedValues.name,
                updatedValues.description,
                updatedValues.messages,
                updatedValues.badWords,
                updatedValues.characters,
                updatedValues.systemPrompts,
                updatedValues.retries,
                updatedValues.badWordsGenerated,
            );
        });
    };
  
    const handleSave = () => {
        if (localDataset) {
            updateId(localDataset.id);
            updateName(localDataset.name);
            updateDescription(localDataset.description);
            updateMessages(localDataset.messages);
            updateBadWords(localDataset.badWords);
            updateCharacters(localDataset.characters);
            updateSystemPrompts(localDataset.systemPrompts);
            updateRetries(localDataset.retries);
            updateBadWordsGenerated(localDataset.badWordsGenerated);
            setDataset(localDataset);
            saveDataset(localDataset);
        }
    };

    const handleDownloadAsJson = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        const json = JSON.stringify(dataset.toJson(), null, 4);
        const blob = new Blob([json], { type: "application/json" });
        const href = await URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = `${dataset.name}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const createNewDataset = () => {
        const newDataset = new Dataset();
        setDataset(newDataset);
        setLocalDataset(newDataset);
    }
  
    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="rounded-box bg-base-100 h-full w-full p-2 flex gap-2 flex-col overflow-y-scroll">
            <button type="button" onClick={createNewDataset} className='dy-btn dy-btn-primary'>Create New Dataset</button>
            <label className="font-semibold">Dataset</label>
            <select name="id" value={localDataset?.id} onChange={(e)=>{setId(e.target.value)}} className='dy-select dy-select-bordered'>
                <option value={null}>Select a dataset</option>
                {availableDatasets.map((dataset) => {
                    return (
                        <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                    )
                })}
            </select>
            <label className="font-semibold">Name</label>
            <input type="text" name="name" value={localDataset?.name} onChange={handleChange} placeholder="Name" className='dy-input dy-input-bordered' />
            <label className="font-semibold">Description</label>
            <textarea name="description" value={localDataset?.description} onChange={handleChange} placeholder="Description" className='dy-textarea dy-textarea-bordered'></textarea>
            <label className="font-semibold">Bad Words</label>
            <textarea name="badWords" value={localDataset?.badWords?.join('\n')} onChange={handleChange} placeholder={`Bad\nWords`} className='dy-textarea dy-textarea-bordered'></textarea>
            <label className="font-semibold">System Prompts</label>
            <textarea name="systemPrompts" value={localDataset?.systemPrompts?.join('\n')} onChange={handleChange} placeholder={`System\nPrompts`} className='dy-textarea dy-textarea-bordered'></textarea>
            <button type="submit" className='dy-btn dy-btn-primary'>Save Changes</button>
            <button type="button" onClick={(e)=>{handleDownloadAsJson(e)}} className='dy-btn dy-btn-primary'>Download as JSON</button>
        </form>
    );
}
export default GenerationParameters;
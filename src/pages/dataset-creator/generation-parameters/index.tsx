import React from 'react';
import { useEffect, useState } from "react";
import { Dataset } from '../../../global_classes/Dataset';
import { useDataset } from '../../../components/dataset/DatasetProvider';

const GenerationParameters = () => {
    const { dataset, updateName, updateDescription, updateMessages, updateBadWords, updateCharacters, updateSystemPrompts, updateRetries, updateBadWordsGenerated, updateId } = useDataset();
    const [localDataset, setLocalDataset] = useState(dataset || new Dataset());
  
    useEffect(() => {
        setLocalDataset(dataset || new Dataset());
    }, [dataset]);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalDataset(prev => {
            let updatedValue: any = value;
            if (name === 'badWords') {
                // Split the string into an array of bad words
                updatedValue = value.split('\n').map(word => word.trim());
            }else if (name === 'systemPrompts') {
                // Split the string into an array of system prompts
                updatedValue = value.split('\n').map(prompt => prompt.trim());
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
        }
    };
  
    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="rounded-box bg-base-100 h-full w-full p-2 flex gap-2 flex-col overflow-y-scroll">
            <label className="font-semibold">Name</label>
            <input type="text" name="name" value={localDataset?.name} onChange={handleChange} placeholder="Name" className='dy-input dy-input-bordered' />
            <label className="font-semibold">Description</label>
            <textarea name="description" value={localDataset?.description} onChange={handleChange} placeholder="Description" className='dy-textarea dy-textarea-bordered'></textarea>
            <label className="font-semibold">Bad Words</label>
            <textarea name="badWords" value={localDataset?.badWords?.join('\n')} onChange={handleChange} placeholder={`Bad\nWords`} className='dy-textarea dy-textarea-bordered'></textarea>
            <label className="font-semibold">System Prompts</label>
            <textarea name="systemPrompts" value={localDataset?.systemPrompts?.join('\n')} onChange={handleChange} placeholder={`System\nPrompts`} className='dy-textarea dy-textarea-bordered'></textarea>
            <button type="submit" className='dy-btn dy-btn-primary'>Save Changes</button>
        </form>
    );
}
export default GenerationParameters;
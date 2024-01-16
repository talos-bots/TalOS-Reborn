/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Dataset } from '../../global_classes/Dataset';
import { CharacterMap, Message } from '../../types';

interface DatasetContextProps {
    dataset: Dataset | null;
    setDataset: (dataset: Dataset) => void;
    updateId: (id: string) => void;
    updateName: (name: string) => void;
    updateDescription: (description: string) => void;
    updateMessages: (messages: Message[]) => void;
    updateBadWords: (badWords: string[]) => void;
    updateCharacters: (characters: CharacterMap[]) => void;
    updateSystemPrompts: (systemPrompts: string[]) => void;
    updateRetries: (retries: number) => void;
    updateBadWordsGenerated: (badWordsGenerated: number) => void;
}
  
const defaultState: DatasetContextProps = {
    dataset: null,
    setDataset: () => {},
    updateId: () => {},
    updateName: () => {},
    updateDescription: () => {},
    updateMessages: () => {},
    updateBadWords: () => {},
    updateCharacters: () => {},
    updateSystemPrompts: () => {},
    updateRetries: () => {},
    updateBadWordsGenerated: () => {},
};
  
export const DatasetContext = createContext<DatasetContextProps>(defaultState);
  
interface DatasetProviderProps {
    children: ReactNode;
}
  
export const DatasetProvider: React.FC<DatasetProviderProps> = ({ children }) => {
    const [dataset, setDataset] = useState<Dataset | null>(null);
  
    const updateDataset = (updatedValues: Partial<Dataset>) => {
        if (dataset) {
            const newDataset = new Dataset(
                updatedValues.id ?? dataset.id,
                updatedValues.name ?? dataset.name,
                updatedValues.description ?? dataset.description,
                updatedValues.messages ?? dataset.messages,
                updatedValues.badWords ?? dataset.badWords,
                updatedValues.characters ?? dataset.characters,
                updatedValues.systemPrompts ?? dataset.systemPrompts,
                updatedValues.retries ?? dataset.retries,
                updatedValues.badWordsGenerated ?? dataset.badWordsGenerated
            );
            setDataset(newDataset);
        }
    };
  
    return (
        <DatasetContext.Provider value={{ 
            dataset, 
            setDataset,
            updateId: id => updateDataset({ id }),
            updateName: name => updateDataset({ name }),
            updateDescription: description => updateDataset({ description }),
            updateMessages: messages => updateDataset({ messages }),
            updateBadWords: badWords => updateDataset({ badWords }),
            updateCharacters: characters => updateDataset({ characters }),
            updateSystemPrompts: systemPrompts => updateDataset({ systemPrompts }),
            updateRetries: retries => updateDataset({ retries }),
            updateBadWordsGenerated: badWordsGenerated => updateDataset({ badWordsGenerated }),
        }}>
            {children}
        </DatasetContext.Provider>
    );
};
  
export const useDataset = () => {
    const context = useContext(DatasetContext);
    if (!context) {
        throw new Error('useDataset must be used within a DatasetProvider');
    }
    return context;
};
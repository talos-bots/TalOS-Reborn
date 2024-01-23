import axios from 'axios';
import { Dataset } from '../global_classes/Dataset';

const api = axios.create({
  baseURL: '/api'
});

// Fetch all datasets
export const fetchAllDatasets = async () => {
  try {
    const response = await api.get('/datasets');
    if(response.data && Array.isArray(response.data)){
        const datasets: Dataset[] = [];
        for(const dataset of response.data){
            datasets.push(new Dataset(
                dataset.id,
                dataset.name,
                dataset.description,
                dataset.messages,
                dataset.badWords,
                dataset.characters,
                dataset.systemPrompts,
                dataset.retries,
                dataset.badWordsGenerated,
                ));
        }
        return datasets;
    }
  } catch (error) {
    // Handle error
    console.error('Error fetching datasets:', error);
  }
};

// Save a dataset
export const saveDataset = async (dataset: Dataset) => {
  try {
    const response = await api.post('/save/dataset', dataset);
    return response.data;
  } catch (error) {
    // Handle error
    console.error('Error saving dataset:', error);
  }
};

// Fetch a dataset by ID
export const fetchDatasetById = async (id : string) => {
  try {
    const response = await api.get(`/datasets/${id}`);
    return response.data;
  } catch (error) {
    // Handle error
    console.error('Error fetching dataset by ID:', error);
  }
};

// Remove a dataset by ID
export const removeDatasetById = async (id : string) => {
  try {
    const response = await api.delete(`/datasets/${id}`);
    return response.data;
  } catch (error) {
    // Handle error
    console.error('Error removing dataset:', error);
  }
};

// Generate data for a dataset
export const generateBatchForDataset = async (dataset: Dataset) => {
  try {
    const response = await api.post('/generate/dataset', dataset);
    return new Dataset(
        response.data.id,
        response.data.name,
        response.data.description,
        response.data.messages,
        response.data.badWords,
        response.data.characters,
        response.data.systemPrompts,
        response.data.retries,
        response.data.badWordsGenerated,
        );
  } catch (error) {
    // Handle error
    console.error('Error generating data for dataset:', error);
  }
};

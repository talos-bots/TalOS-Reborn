import express from 'express';
import fs from "fs";
import path from "path";
import { datasetsPath } from '../server.js';
import { DatasetInterface } from '../typings/types.js';

export const datasetsRouter = express.Router();

// get all datasets from the ../data/datasets/ folder
function fetchAllDatasets(): DatasetInterface[] {
    const datasetFolderPath = path.join(datasetsPath);
    const datasetFiles = fs.readdirSync(datasetFolderPath);
    const datasetData = datasetFiles.map((file) => {
        if(!file.endsWith(".json")) return;
        const filePath = path.join(datasetFolderPath, file);
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    });
    return datasetData;
}

datasetsRouter.get('/datasets', (req, res) => {
    const datasetData = fetchAllDatasets();
    res.send(datasetData);
});

// save a dataset to the ../data/datasets/ folder
function saveDataset(dataset: DatasetInterface) {
    const datasetFolderPath = path.join(datasetsPath);
    const filePath = path.join(datasetFolderPath, `${dataset.id}.json`);
    const datasetJson = JSON.stringify(dataset, null, 4); // Pretty print the JSON
    fs.writeFileSync(filePath, datasetJson, "utf-8");
}

datasetsRouter.post('/save/dataset', (req, res) => {
    const dataset = req.body;
    saveDataset(dataset);
    res.send({ message: "Dataset saved successfully!" });
});

// get a dataset by id from the ../data/datasets/ folder
function fetchDatasetById(id: string): DatasetInterface | null {
    const datasetFolderPath = path.join(datasetsPath);
    const filePath = path.join(datasetFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(fileData);
    } else {
        return null; // or handle the error as needed
    }
}

datasetsRouter.get('/datasets/:id', (req, res) => {
    const id = req.params.id;
    const dataset = fetchDatasetById(id);
    if (dataset) {
        res.send(dataset);
    } else {
        res.status(404).send({ message: "Dataset not found" });
    }
});

//remove a dataset by id from the ../data/datasets/ folder
function removeDatasetById(id: string) {
    const datasetFolderPath = path.join(datasetsPath);
    const filePath = path.join(datasetFolderPath, `${id}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    } else {
        return null; // or handle the error as needed
    }
}

datasetsRouter.delete('/datasets/:id', (req, res) => {
    const id = req.params.id;
    removeDatasetById(id);
    res.send({ message: "Dataset removed successfully!" });
});
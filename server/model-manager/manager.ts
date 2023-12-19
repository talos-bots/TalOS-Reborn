/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import { createRepo, uploadFiles, uploadFilesWithProgress, deleteFile, deleteRepo, listFiles, whoAmI, downloadFile } from "@huggingface/hub";
import type { RepoDesignation, Credentials } from "@huggingface/hub";
import { pathToFileURL } from 'url';

const hfRepoRouter = express.Router();

hfRepoRouter.post('/createRepo', async (req, res) => {
    const credentials: Credentials = req.body.credentials;
    const repo: RepoDesignation = req.body.repo;
  
    try {
      await createRepo({ repo, credentials, license: "mit" });
      res.status(200).send('Repository created successfully.');
    } catch (error:any) {
      res.status(500).send(error.message);
    }
});

hfRepoRouter.post('/uploadFiles', async (req, res) => {
    const { repo, credentials, files } = req.body;
  
    try {
      await uploadFiles({ repo, credentials, files });
      res.status(200).send('Files uploaded successfully.');
    } catch (error:any) {
      res.status(500).send(error.message);
    }
});

hfRepoRouter.post('/uploadFilesWithProgress', async (req, res) => {
    const { repo, credentials, files } = req.body;
  
    try {
      for await (const progressEvent of await uploadFilesWithProgress({
        repo, credentials, files
      })) {
        console.log(progressEvent);
      }
      res.status(200).send('Files uploaded with progress.');
    } catch (error:any) {
      res.status(500).send(error.message);
    }
});

hfRepoRouter.delete('/deleteFile', async (req, res) => {
    const { repo, credentials, path } = req.body;
  
    try {
      await deleteFile({ repo, credentials, path });
      res.status(200).send('File deleted successfully.');
    } catch (error:any) {
      res.status(500).send(error.message);
    }
});
  
hfRepoRouter.get('/listFiles', async (req, res) => {
    const repo: RepoDesignation = req.body.repo;
  
    try {
      const files = [];
      for await (const fileInfo of listFiles({ repo })) {
        files.push(fileInfo);
      }
      res.status(200).json(files);
    } catch (error:any) {
      res.status(500).send(error.message);
    }
});

hfRepoRouter.delete('/deleteRepo', async (req, res) => {
    const { repo, credentials } = req.body;
  
    try {
      await deleteRepo({ repo, credentials });
      res.status(200).send('Repository deleted successfully.');
    } catch (error:any) {
      res.status(500).send(error.message);
    }
});

hfRepoRouter.get('/whoAmI', async (req, res) => {
    const credentials: Credentials = req.body.credentials;
  
    try {
      const user = await whoAmI({ credentials });
      res.status(200).json(user);
    } catch (error:any) {
      res.status(500).send(error.message);
    }
});

hfRepoRouter.get('/downloadFile', async (req, res) => {
    const { repo, path } = req.body;
  
    try {
      const file = await downloadFile({ repo, path });
      res.status(200).json(file);
    } catch (error:any) {
      res.status(500).send(error.message);
    }
});

export default hfRepoRouter;
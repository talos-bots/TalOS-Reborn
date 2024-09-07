/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-async-promise-executor */
import path from 'path';
import { unlink, writeFile } from 'fs/promises';
import { FeatureExtractionPipeline, ImageClassificationOutput, ImageClassificationPipeline, Pipeline, QuestionAnsweringOutput, QuestionAnsweringPipeline, TextClassificationOutput, TextClassificationPipeline, ZeroShotClassificationOutput, ZeroShotClassificationPipeline } from '@xenova/transformers';
import { modelsPath, uploadsPath, wasmPath } from '../server.js';
import express from 'express';
import { authenticateToken } from '../routes/authenticate-token.js';

export const transformersRouter = express.Router();

export async function getModels() {
  try {
    const { pipeline, env } = await import('@xenova/transformers');
    env.localModelPath = modelsPath;
    env.backends.onnx.wasm.numThreads = 1;
    env.backends.onnx.wasm.wasmPaths = wasmPath;
    await pipeline('text-classification', 'Cohee/distilbert-base-uncased-go-emotions-onnx', { cache_dir: modelsPath, quantized: true }).then((model) => {
      model.dispose();
      console.log("Text Classification model loaded");
    })
    await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', { cache_dir: modelsPath, quantized: true }).then((model) => {
      model.dispose();
      console.log("Image Captioning model loaded");
    });
    await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { cache_dir: modelsPath, quantized: true }).then((model) => {
      model.dispose();
      console.log("Feature Extraction model loaded");
    });
    await pipeline('question-answering', 'Xenova/distilbert-base-uncased-distilled-squad', { cache_dir: modelsPath, quantized: true }).then((model) => {
      model.dispose();
      console.log("Question Answering model loaded");
    });
    await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', { cache_dir: modelsPath, quantized: true }).then((model) => {
      model.dispose();
      console.log("Zero Shot Classification model loaded");
    });
    // await pipeline('image-classification', "SmilingWolf/wd-v1-4-swinv2-tagger-v2/tree/v2.0", { cache_dir: modelsPath, quantized: true}).then((model) => {
    //     model.dispose();
    //     console.log("Image Classification model loaded");
    // });
  } catch (err) {
    console.log(err);
  }
}

function getCaptionPromise() {
  const captionPromise: Promise<Pipeline> = new Promise(async (resolve, reject) => {
    try {
      const { pipeline, env } = await import('@xenova/transformers');

      // Only use local models
      env.localModelPath = modelsPath;
      env.backends.onnx.wasm.wasmPaths = wasmPath;
      console.log('Loading caption model');
      resolve(await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', { cache_dir: modelsPath, quantized: true }));
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
  return captionPromise;
}

function getModelPromise() {
  const modelPromise: Promise<TextClassificationPipeline> = new Promise(async (resolve, reject) => {
    try {
      const { pipeline, env } = await import('@xenova/transformers');

      // Only use local models
      env.localModelPath = modelsPath;
      env.backends.onnx.wasm.wasmPaths = wasmPath;

      resolve(await pipeline('text-classification', 'Cohee/distilbert-base-uncased-go-emotions-onnx', { cache_dir: modelsPath, quantized: true }));
    } catch (err) {
      reject(err);
    }
  });
  return modelPromise;
}

function getEmbeddingPromise() {
  const embeddingPromise: Promise<FeatureExtractionPipeline> = new Promise(async (resolve, reject) => {
    try {
      const { pipeline, env } = await import('@xenova/transformers');

      // Only use local models
      env.localModelPath = modelsPath;
      env.backends.onnx.wasm.wasmPaths = wasmPath;
      console.log('Loading embedding model');
      resolve(await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { cache_dir: modelsPath, quantized: true }));
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
  return embeddingPromise;
}

function getQuestionPromise() {
  const questionPromise: Promise<QuestionAnsweringPipeline> = new Promise(async (resolve, reject) => {
    try {
      const { pipeline, env } = await import('@xenova/transformers');

      // Only use local models
      env.localModelPath = modelsPath;
      env.backends.onnx.wasm.wasmPaths = wasmPath;
      console.log('Loading question model');
      resolve(await pipeline('question-answering', 'Xenova/distilbert-base-uncased-distilled-squad', { cache_dir: modelsPath, quantized: true }));
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
  return questionPromise;
}

function getZeroShotPromise() {
  const zeroShotPromise: Promise<ZeroShotClassificationPipeline> = new Promise(async (resolve, reject) => {
    try {
      const { pipeline, env } = await import('@xenova/transformers');

      // Only use local models
      env.localModelPath = modelsPath;
      env.backends.onnx.wasm.wasmPaths = wasmPath;
      console.log('Loading zero shot model');
      resolve(await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', { cache_dir: modelsPath, quantized: true }));
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
  return zeroShotPromise;
}

function getImageClassificationPromise() {
  const imageClassificationPromise: Promise<ImageClassificationPipeline> = new Promise(async (resolve, reject) => {
    try {
      const { pipeline, env } = await import('@xenova/transformers');

      // Only use local models
      env.localModelPath = modelsPath;
      env.backends.onnx.wasm.wasmPaths = wasmPath;
      console.log('Loading image classification model');
      resolve(await pipeline('image-classification', "SmilingWolf/wd-v1-4-vit-tagger-v2", { cache_dir: modelsPath, quantized: true }));
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
  return imageClassificationPromise;
}

async function getClassification(text: string): Promise<any> {
  const modelPromise = getModelPromise();
  const model = await modelPromise;
  const results = await model(text) as TextClassificationOutput;
  return results[0].label;
}

async function getCaption(image: string): Promise<any> {
  const captionPromise = getCaptionPromise();
  console.log('Getting caption for image');
  const buffer = Buffer.from(image, 'base64');
  const randomName = Math.random().toString(36).substring(7);
  await writeFile(path.join(uploadsPath, `temp-image-${randomName}.png`), buffer);
  const model = await captionPromise;
  const results = await model(path.join(uploadsPath, `temp-image-${randomName}.png`)).catch((err: any) => {
    console.log('Caption error', err);
  });

  // Optionally, delete the temporary file here
  await unlink(path.join(uploadsPath, `temp-image-${randomName}.png`));
  console.log('Caption results', results);
  return results[0]?.generated_text;
}

async function getEmbedding(text: string): Promise<any> {
  const embeddingPromise = getEmbeddingPromise();
  const model = await embeddingPromise;
  const results = await model(text, { pooling: 'mean', normalize: true });
  return results.data;
}

async function getEmbeddingTensor(text: string): Promise<any> {
  const embeddingPromise = getEmbeddingPromise();
  const model = await embeddingPromise;
  const results = await model(text, { pooling: 'mean', normalize: true });
  return results;
}

async function getEmbeddingSimilarity(text1: string, text2: string): Promise<any> {
  const embeddingPromise = getEmbeddingPromise();
  const model = await embeddingPromise;
  const { cos_sim } = await import('@xenova/transformers');
  const results1 = await model(text1, { pooling: 'mean', normalize: true });
  const results2 = await model(text2, { pooling: 'mean', normalize: true });
  const similarity = cos_sim(results1.data as number[], results2.data as number[]);
  return similarity;
}

async function getQuestionAnswering(context: string, question: string): Promise<any> {
  const questionPromise = getQuestionPromise();
  const model = await questionPromise;
  const results = await model(question, context) as QuestionAnsweringOutput
  return results.answer;
}

async function getZeroShotClassification(text: string, labels: string[]): Promise<any> {
  const zeroShotPromise = getZeroShotPromise();
  const model = await zeroShotPromise;
  const results = await model(text, labels);
  return results;
}

async function getYesNoMaybe(text: string): Promise<any> {
  const zeroShotPromise = getZeroShotPromise();
  const labels = ['yes', 'no', 'maybe'];
  const model = await zeroShotPromise;
  const results = await model(text, labels) as ZeroShotClassificationOutput
  return results;
}

async function getImageClassification(image: string): Promise<any> {
  const imageClassificationPromise = getImageClassificationPromise();
  const buffer = Buffer.from(image, 'base64');
  const randomName = Math.random().toString(36).substring(7);
  await writeFile(path.join(uploadsPath, `temp-image-${randomName}.png`), buffer);

  const model = await imageClassificationPromise;
  const results = await model(path.join(uploadsPath, `temp-image-${randomName}.png`)).catch((err: any) => {
    console.log('Image Classification error', err);
  }) as ImageClassificationOutput;

  // Optionally, delete the temporary file here
  await unlink(path.join(uploadsPath, `temp-image-${randomName}.png`));
  console.log('Image Classification results', results);
  return results;
}

export {
  getClassification,
  getCaption,
  getEmbedding,
  getEmbeddingTensor,
  getEmbeddingSimilarity,
  getQuestionAnswering,
  getZeroShotClassification,
  getYesNoMaybe
};

transformersRouter.post('/classification', authenticateToken, async (req, res) => {
  try {
    const text = req.body.text;
    const results = await getClassification(text);
    res.send(results);
  } catch (error) {
    console.log(error);
  }
});

transformersRouter.post('/caption', authenticateToken, async (req, res) => {
  try {
    const image = req.body.image;
    const results = await getCaption(image);
    res.send(results);
  } catch (error) {
    console.log(error);
  }
});

transformersRouter.post('/embedding', authenticateToken, async (req, res) => {
  try {
    const text = req.body.text;
    const results = await getEmbedding(text);
    res.send(results);
  } catch (error) {
    console.log(error);
  }
});

transformersRouter.post('/embedding/tensor', authenticateToken, async (req, res) => {
  try {
    const text = req.body.text;
    const results = await getEmbeddingTensor(text);
    res.send(results);
  } catch (error) {
    console.log(error);
  }
});

transformersRouter.post('/embedding/similarity', authenticateToken, async (req, res) => {
  try {
    const text1 = req.body.text1;
    const text2 = req.body.text2;
    const results = await getEmbeddingSimilarity(text1, text2);
    res.send(results);
  } catch (error) {
    console.log(error);
  }
});

transformersRouter.post('/question', authenticateToken, async (req, res) => {
  try {
    const context = req.body.context;
    const question = req.body.question;
    const results = await getQuestionAnswering(context, question);
    res.send(results);
  } catch (error) {
    console.log(error);
  }
});

transformersRouter.post('/zero-shot', authenticateToken, async (req, res) => {
  try {
    const text = req.body.text;
    const labels = req.body.labels;
    const results = await getZeroShotClassification(text, labels);
    res.send(results);
  } catch (error) {
    console.log(error);
  }
});

transformersRouter.post('/yes-no-maybe', authenticateToken, async (req, res) => {
  try {
    const text = req.body.text;
    const results = await getYesNoMaybe(text);
    res.send(results);
  } catch (error) {
    console.log(error);
  }
});

transformersRouter.get('/models', authenticateToken, async (req, res) => {
  try {
    await getModels();
    res.send('Models loaded');
  } catch (error) {
    console.log(error);
  }
});

transformersRouter.post('/image-classification', async (req, res) => {
  try {
    const image = req.body.image;
    const results = await getImageClassification(image);
    res.send(results);
  } catch (error) {
    console.log(error);
  }
});

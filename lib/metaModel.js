import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const metaAI = createOpenAICompatible({
  name: 'meta-ai',
  baseURL: process.env.MODEL_BASE_URL || 'https://api.meta.ai/v1',
  apiKey: process.env.MODEL_API_KEY || 'LLM_1169...RQcI',
});

export const getMetaModel = () => {
  const modelName = process.env.MODEL_NAME || 'muse-spark-1.3';
  return metaAI(modelName);
};

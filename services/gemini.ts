
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DifficultyLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// PCM Decoding Utilities
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateArticle = async (level: DifficultyLevel, interests: string = "general") => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate an interesting English reading passage for a learner at ${level} level. 
               The topic should be about ${interests}. 
               Keep the vocabulary and sentence structure appropriate for this level. 
               The passage must be organized into 3-5 paragraphs. 
               Each paragraph must contain a list of sentence-level segments, each with its accurate Chinese translation.
               The output MUST be in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          chineseTitle: { type: Type.STRING },
          paragraphs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sentences: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      en: { type: Type.STRING },
                      zh: { type: Type.STRING }
                    },
                    required: ["en", "zh"]
                  }
                }
              },
              required: ["sentences"]
            }
          }
        },
        required: ["title", "chineseTitle", "paragraphs"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A high-quality, friendly illustration for an English learning app. Theme: ${prompt}. Artistic style: soft vector illustration, clean lines, warm colors, suitable for students.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed", error);
    return null;
  }
};

export const explainWord = async (word: string, context: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explain the English word "${word}" in the context of this sentence: "${context}". 
               Target audience: A native Chinese speaker with child-level English. 
               Provide phonetic transcription, a simple Chinese definition, and a new simple example sentence.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          phonetic: { type: Type.STRING },
          translation: { type: Type.STRING },
          example: { type: Type.STRING },
        },
        required: ["phonetic", "translation", "example"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Speech generation failed", error);
    return null;
  }
};

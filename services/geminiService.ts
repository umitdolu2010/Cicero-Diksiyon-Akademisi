
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { Language, TrainingMode } from "../types";

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
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
  sampleRate: number,
  numChannels: number,
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

const CICERO_AI_MASTER_PROMPT = `
You are CICERO AI, a world-class phonetic coach with the "Usta" (Master) persona.
MISSION: Teach the method. Embed the process. No improvisation. No emotional fluctuation.

COACHING RULES:
1. VOICE: Calm, clear, neutral authority. Do not motivate; guide technically.
2. METHOD: Always follow Orientation -> Instruction -> Execution -> Reflection.
3. ANALYSIS: Analyze AUDIO ONLY. Do not transcribe. Focus on Timing, Breath onset, Consonant attack, and Vowel stability.
4. FEEDBACK: Explain the cause of the score and set a technical target. 
   Example: "Puanın 72. Sebep: hece girişleri acele. Bir sonraki çalışmada sadece buna odaklanacağız."
5. PRIORITIES: Articulation is 3x more critical than speed.
`;

export class GeminiService {
  private async callWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    let delay = 3000; // Increased base delay for rate limits

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Comprehensive check for 429/Resource Exhausted
        const errorString = JSON.stringify(error).toLowerCase();
        const errorMessage = (error.message || '').toLowerCase();
        const isRateLimit = 
          errorMessage.includes('429') || 
          errorMessage.includes('resource_exhausted') ||
          errorMessage.includes('quota') ||
          errorString.includes('429') ||
          errorString.includes('resource_exhausted') ||
          error.status === 429;

        if (isRateLimit && i < maxRetries - 1) {
          console.warn(`[CICERO AI] Quota/Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
        
        // Re-throw if it's not a rate limit or we're out of retries
        throw error;
      }
    }
    throw lastError;
  }

  async speak(text: string, language: Language) {
    return this.callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak this in a neutral, authoritative, clear "Usta" coaching tone in ${language}: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();
      }
    });
  }

  async analyzeAudio(audioBase64: string, expectedText: string, language: Language, historyContext: string, mimeType: string = 'audio/wav'): Promise<any> {
    return this.callWithRetry(async () => {
      const analysisPrompt = `
        ${CICERO_AI_MASTER_PROMPT}
        Target Language: ${language}.
        Exercise Context: "${expectedText}".
        User History Context: "${historyContext}".

        Analyze the audio for micro-variations:
        - Consonant Attack (explosive sounds precision)
        - Consonant Release Duration (technical release precision)
        - Vowel Stability (resonance consistency)
        - Breath Onset Variance (consistency of air intake timing)
        - Hesitation patterns.

        Weight articulation 3x higher than speed. Detect physical tension patterns.

        Output JSON only. Evaluate: 
        - score (0-100)
        - phoneticClarity (0-100)
        - flowRhythm (0-100)
        - breathControl (0-100)
        - consistency (0-100)
        - consonantAttack (0-100)
        - consonantReleaseDuration (0-100)
        - vowelStability (0-100)
        - hesitationLevel (0-100)
        - breathOnsetVariance (0-100)
        - feedback: Technical statement in ${language} about articulation.
        - trendAwareSummary: Authoritative "Usta" analysis in ${language} explaining score cause and next correction target.
        - strengths: 2 items
        - improvements: 1 main technical issue
        - recommendation: 1 exercise suggestion
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType, data: audioBase64 } },
            { text: analysisPrompt }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              phoneticClarity: { type: Type.NUMBER },
              flowRhythm: { type: Type.NUMBER },
              breathControl: { type: Type.NUMBER },
              consistency: { type: Type.NUMBER },
              consonantAttack: { type: Type.NUMBER },
              consonantReleaseDuration: { type: Type.NUMBER },
              vowelStability: { type: Type.NUMBER },
              hesitationLevel: { type: Type.NUMBER },
              breathOnsetVariance: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              trendAwareSummary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendation: { type: Type.STRING }
            },
            required: [
              'score', 'feedback', 'trendAwareSummary', 'phoneticClarity', 'flowRhythm', 
              'breathControl', 'consistency', 'consonantAttack', 'consonantReleaseDuration', 
              'vowelStability', 'hesitationLevel', 'breathOnsetVariance', 'strengths', 
              'improvements', 'recommendation'
            ]
          }
        }
      });
      
      return JSON.parse(response.text || "{}");
    });
  }
}

export const gemini = new GeminiService();

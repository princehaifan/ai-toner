
import { GoogleGenAI } from "@google/genai";
import type { Tone } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateTextInTone(inputText: string, tone: Tone): Promise<string> {
  if (!inputText.trim()) {
    throw new Error("Input text cannot be empty.");
  }
  if (!tone) {
    throw new Error("A tone must be selected.");
  }

  const prompt = `
You are an expert writer capable of adopting any tone of voice. Your task is to rewrite the following text in the specified tone.

**Tone to adopt:**
Name: ${tone.name}
Description: ${tone.description}

**Original Text to Rewrite:**
---
${inputText}
---

**Rewritten Text:**`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred while generating text: ${error.message}`;
    }
    return "An unknown error occurred while generating text.";
  }
}

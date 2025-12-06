import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper: Add WAV Header to Raw PCM
const getWavHeader = (bufferLength: number, sampleRate: number) => {
  const numChannels = 1;
  const bitsPerSample = 16; // Gemini returns 16-bit PCM
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = bufferLength;
  const headerSize = 44;

  const buffer = new ArrayBuffer(headerSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true); // Subchunk2Size

  return buffer;
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// 1. Generate Lyrics, Title, and Tags based on description
// UPDATED: Uses Thinking Mode with gemini-3-pro-preview for superior creativity
export const generateSongMetadata = async (description: string, customLyrics?: string, customStyle?: string, customTitle?: string) => {
  const ai = getAiClient();
  
  // Handle empty description fallback for Custom Mode
  const desc = description.trim() || customStyle || customTitle || "A creative song";

  const prompt = `
    You are an expert songwriter and music producer. 
    Create a song structure based on this description: "${desc}".
    ${customLyrics ? `Use these lyrics as a base: ${customLyrics}` : 'Write original lyrics including Verse 1, Chorus, Verse 2, Chorus, Outro.'}
    ${customStyle ? `The musical style is: ${customStyle}` : 'Determine a suitable musical style.'}
    ${customTitle ? `The title is: ${customTitle}` : 'Generate a creative title.'}

    Return the response in JSON format with 'title', 'lyrics', and 'tags' (array of 3-5 short style descriptors like 'upbeat', 'lo-fi', 'electronic').
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Updated to Pro model
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            lyrics: { type: Type.STRING },
            tags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "lyrics", "tags"]
        },
        // Thinking Mode Configuration
        thinkingConfig: {
          thinkingBudget: 32768, 
        }
      }
    });

    let text = response.text || "";
    if (!text) throw new Error("No text returned from Gemini");
    
    // Improved JSON parsing (handling markdown code blocks or raw text)
    // Remove markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '');
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Metadata generation error:", error);
    // Fallback data
    return {
      title: customTitle || "Untitled Track",
      lyrics: customLyrics || "[Instrumental Break]\n\n(AI generation failed, please try again)",
      tags: ["experimental", "error"]
    };
  }
};

// 2. Generate Album Art
export const generateAlbumArt = async (description: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Square album artwork for a song described as: ${description}. High quality, artistic, digital art, 4k.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [{ text: prompt }]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
       }
    }
    
    return `https://picsum.photos/500/500?random=${Math.random()}`;

  } catch (error) {
    console.error("Image generation error:", error);
    return `https://picsum.photos/500/500?random=${Math.random()}`;
  }
};

// 3. Generate Audio Preview (TTS)
export const generateAudioPreview = async (text: string): Promise<string | null> => {
  const ai = getAiClient();
  const previewText = text.slice(0, 300) + "..."; 

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: previewText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Add WAV Header
      const sampleRate = 24000; // Gemini default
      const wavHeader = getWavHeader(len, sampleRate);
      
      const wavBlob = new Blob([wavHeader, bytes], { type: 'audio/wav' }); 
      return URL.createObjectURL(wavBlob);
    }
    return null;

  } catch (error) {
    console.error("Audio generation error:", error);
    return null;
  }
};

// 4. Generate Video (Veo 3)
export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string | null> => {
  const ai = getAiClient();
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    // Polling
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return null;

    // Fetch the actual video bytes using the URI + API Key
    const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Video generation error:", error);
    return null;
  }
};

// 5. Transcribe Audio
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const ai = getAiClient();
  
  // Convert Blob to Base64
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
        const result = reader.result as string;
        // Handle result potentially missing prefix if read differently, but readAsDataURL guarantees it
        const base64String = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
  
  const base64Data = await base64Promise;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
            { inlineData: { mimeType: audioBlob.type || "audio/webm", data: base64Data } },
            { text: "Transcribe this audio exactly." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
};

// 6. Chat Bot
export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
    const ai = getAiClient();
    const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: history as any // Type cast to satisfy strict content requirements if needed
    });

    const result = await chat.sendMessage({ message });
    return result.text;
}
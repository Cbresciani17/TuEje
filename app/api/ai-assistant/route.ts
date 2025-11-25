// app/api/ai-assistant/route.ts

// **FIX CRÍTICO:** Importación y uso de la SDK moderna (@google/genai)
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// Inicializa el cliente de AI.
// Asume que GEMINI_API_KEY está en .env.local
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured.');
      return NextResponse.json(
        { error: 'Gemini API Key no configurada. Verifica tu archivo .env.local.' },
        { status: 500 }
      );
    }

    const { context, systemPrompt } = await req.json();

    if (!context || !systemPrompt) {
      return NextResponse.json(
        { error: 'Faltan parámetros: context o systemPrompt' },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Modelo rápido y de bajo costo para chat/análisis
      contents: [
        {
          role: 'user',
          parts: [{ text: context }],
        },
      ],
      config: {
        // Se usa systemInstruction para establecer la personalidad del asistente
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 600, // Aumentado para consejos más detallados
      },
    });

    // Se obtiene el texto de la respuesta
    return NextResponse.json({
      response: response.text,
    });
    
  } catch (error) {
    console.error('Error en la API de Gemini (Fallo de red/cuota):', error);
    return NextResponse.json(
      { error: 'Error al comunicarse con el asistente AI. Esto puede ser un problema de clave, cuota, o un error interno de la API.' },
      { status: 500 }
    );
  }
}
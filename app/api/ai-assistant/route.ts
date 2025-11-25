// app/api/ai-assistant/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API Key no configurada' },
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

    // Inicializamos Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Unimos el prompt del sistema con el contexto
    const finalPrompt = `${systemPrompt}\n\nContexto del usuario:\n${context}`;

    const result = await model.generateContent(finalPrompt);
    const response = result.response.text();

    return NextResponse.json({ response });

  } catch (error: any) {
    console.error("Error en API Gemini:", error);

    return NextResponse.json(
      { error: "Error al comunicarse con Gemini. Revisa tu clave o cuota." },
      { status: 500 }
    );
  }
}

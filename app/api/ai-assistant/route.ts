// app/api/ai-assistant/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Inicializa la configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API Key no configurada' },
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Puedes usar gpt-4-turbo si tienes acceso
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error en la API de OpenAI:', error);
    return NextResponse.json(
      { error: 'Error al comunicarse con el asistente AI' },
      { status: 500 }
    );
  }
}
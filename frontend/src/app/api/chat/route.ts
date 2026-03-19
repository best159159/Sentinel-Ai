import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey?.startsWith('sk-')) {
      return NextResponse.json({
        reply: 'ขออภัยครับ ตอนนี้ระบบ AI ขัดข้องชั่วคราว หากเป็นเหตุฉุกเฉินกรุณาโทร 191 หรือ 1669 ทันทีครับ',
      });
    }

    const openai = new OpenAI({ apiKey: openaiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `คุณคือ 'Sentinel AI' แชทบอทผู้ช่วยอัจฉริยะด้านความปลอดภัยและเหตุฉุกเฉินของแอป Sentinel AI 
คุณมีหน้าที่ตอบคำถามเกี่ยวกับการขอความช่วยเหลือ การเอาชีวิตรอด การปฐมพยาบาลเบื้องต้น 
- ตอบเป็นภาษาไทยด้วยความสุภาพ กระชับ เข้าใจง่าย 
- หากผู้ใช้เจอเหตุร้ายแรง ให้แนะนำให้รีบโทร 191 (เหตุด่วนเหตุร้าย) หรือ 1669 (การแพทย์ฉุกเฉิน) หรือ 199 (ดับเพลิง)`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ reply: 'ขออภัยครับ ระบบขัดข้องชั่วคราว' }, { status: 500 });
  }
}

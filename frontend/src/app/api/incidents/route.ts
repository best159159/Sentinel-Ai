import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, orderBy, limit, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OpenAI from 'openai';

const CRITICAL_KEYWORDS_TH = [
  'ติดอยู่', 'ระเบิด', 'ถล่ม', 'ผู้สูงอายุ', 'เด็ก', 'โรงพยาบาล',
  'โรงเรียน', 'สารเคมี', 'พิษ', 'ลุกลาม', 'ผู้เสียชีวิต', 'บาดเจ็บ',
  'กู้ภัย', 'อพยพ', 'ถูกปิดกั้น', 'น้ำท่วม', 'ไฟไหม้', 'แผ่นดินไหว',
  'trapped', 'explosion', 'collapse', 'elderly', 'children', 'hospital',
  'school', 'chemical', 'toxic', 'spreading', 'casualties', 'fatalities',
  'rescue', 'evacuation', 'blocked', 'rising water',
];

function fallbackAnalysis(type: string, description: string) {
  const descLower = description.toLowerCase();
  const typeSeverity: Record<string, number> = { Earthquake: 78, Fire: 72, Flood: 65, Storm: 60, Accident: 55, Crime: 50, Other: 35 };
  let score = typeSeverity[type] || 40;
  const kw: string[] = [];
  CRITICAL_KEYWORDS_TH.forEach((k) => { if (descLower.includes(k.toLowerCase())) { score = Math.min(100, score + 6); kw.push(k); } });
  const urgencyLevel = score >= 80 ? 'Critical' : score >= 60 ? 'High' : score >= 35 ? 'Medium' : 'Low';

  // Fallback confidence based on description quality
  const descLength = description.trim().length;
  let confidence = 0.35; // ค่า default ต่ำเพราะไม่ได้ใช้ AI จริง
  if (descLength > 200) confidence = 0.50;
  if (descLength > 500) confidence = 0.55;
  if (kw.length >= 2) confidence += 0.10;

  return {
    classifiedType: type,
    severityScore: score,
    urgencyLevel,
    keywordsDetected: kw,
    recommendation: `เหตุ${type} ถูกรายงาน ควรแจ้งหน่วยงานที่เกี่ยวข้องเพื่อประเมินสถานการณ์ต่อไป`,
    confidenceScore: Math.min(1, confidence),
  };
}

// GET /api/incidents
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get('type');
    const urgencyFilter = searchParams.get('urgency');

    let q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(200));
    const snap = await getDocs(q);
    let incidents = snap.docs.map((d) => {
      const data = d.data();
      return {
        _id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    if (typeFilter) incidents = incidents.filter((i: any) => i.type === typeFilter);
    if (urgencyFilter) incidents = incidents.filter((i: any) => i.aiAnalysis?.urgencyLevel === urgencyFilter);

    return NextResponse.json({ incidents, pagination: { total: incidents.length } });
  } catch (error) {
    console.error('GET incidents error:', error);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

// POST /api/incidents
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, description, location, imageUrl, userId } = body;

    if (!type || !description || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let analysis = fallbackAnalysis(type, description);

    // Try OpenAI analysis
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey?.startsWith('sk-')) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const textPrompt = `คุณคือ AI ผู้เชี่ยวชาญด้านการวิเคราะห์เหตุฉุกเฉินและภัยพิบัติ กรุณาวิเคราะห์รายงานเหตุการณ์ต่อไปนี้ และตอบเป็น JSON เท่านั้น (ห้ามใส่ markdown)

ประเภทที่ผู้ใช้เลือก: ${type}
รายละเอียด: ${description}
${imageUrl ? '⚠️ มีรูปภาพแนบมาด้วย — กรุณาวิเคราะห์รูปภาพอย่างละเอียด' : 'ไม่มีรูปภาพแนบ'}

กรุณาวิเคราะห์โดยใช้เกณฑ์ต่อไปนี้:

1. "classifiedType": ประเภทเหตุการณ์ที่แท้จริง (อาจต่างจากที่ผู้ใช้เลือก ถ้ารูปบอกเป็นอย่างอื่น ให้ใช้สิ่งที่เห็นในรูป)
2. "severityScore": คะแนนความรุนแรง 0-100
   - 0-25: เบา (แจ้งเพื่อทราบ)
   - 26-50: ปานกลาง (ต้องเฝ้าระวัง)
   - 51-75: สูง (ต้องดำเนินการด่วน)
   - 76-100: วิกฤต (ต้องดำเนินการทันที)
3. "urgencyLevel": "Low" | "Medium" | "High" | "Critical" (สอดคล้องกับ severityScore)
4. "keywordsDetected": คำสำคัญที่พบในรายงาน (ทั้งไทยและอังกฤษ)
5. "recommendation": คำแนะนำการรับมืออย่างละเอียดเป็นภาษาไทย (ระบุหมายเลขฉุกเฉินที่เกี่ยวข้อง เช่น 191, 1669, 199)
6. "confidenceScore": ค่าความมั่นใจในการวิเคราะห์ 0.0-1.0
   - 0.0-0.3: ข้อมูลน้อยมาก คลุมเครือ
   - 0.3-0.5: มีข้อมูลบ้าง ยังขาดรายละเอียด
   - 0.5-0.7: ข้อมูลพอสมควร
   - 0.7-0.85: ข้อมูลชัดเจนดี
   - 0.85-1.0: ข้อมูลละเอียดมาก มีหลักฐานชัดเจน
${imageUrl ? `
7. "imageAnalysis": (วิเคราะห์รูปภาพ) อธิบายสิ่งที่เห็นในรูปเป็นภาษาไทย เช่น สภาพความเสียหาย, สิ่งที่มองเห็น, ระดับอันตราย
8. "imageMatchesDescription": true หรือ false — รูปภาพตรงกับคำอธิบายที่ผู้ใช้เขียนไหม?
9. "credibilityScore": 0.0-1.0 ความน่าเชื่อถือของรายงาน
   - คำนวณจาก: รูปภาพตรงกับคำอธิบายไหม? ข้อมูลดูสมจริงหรือไม่? มีร่องรอยของข้อมูลเท็จหรือไม่?
   - 0.0-0.3: น่าสงสัยมาก (รูปไม่ตรงคำอธิบาย / ดูเหมือนข่าวปลอม)
   - 0.3-0.6: ไม่แน่ใจ (มีบางจุดที่ไม่ตรงกัน)
   - 0.6-0.8: น่าเชื่อถือ (รูปสอดคล้องกับคำอธิบาย)
   - 0.8-1.0: น่าเชื่อถือมาก (ทุกอย่างตรงกัน ดูเป็นรายงานจริง)
10. "credibilityNote": (ภาษาไทย) อธิบายสั้นๆ ว่าทำไมถึงให้คะแนนความน่าเชื่อถือเท่านี้
` : `
7. "imageAnalysis": null (ไม่มีรูปภาพ)
8. "imageMatchesDescription": null
9. "credibilityScore": ประเมินจากข้อความอย่างเดียว (0.3-0.7 ตามคุณภาพข้อความ)
10. "credibilityNote": (ภาษาไทย) อธิบายสั้นๆ ว่าทำไมถึงให้คะแนนความน่าเชื่อถือเท่านี้
`}
ตอบ JSON:
{"classifiedType":"...","severityScore":0,"urgencyLevel":"...","keywordsDetected":[],"recommendation":"...","confidenceScore":0.0,"imageAnalysis":"...","imageMatchesDescription":true,"credibilityScore":0.0,"credibilityNote":"..."}`;

        const content: any[] = imageUrl
          ? [{ type: 'text', text: textPrompt }, { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }]
          : textPrompt as any;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content }],
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(response.choices[0].message.content || '{}');
        analysis = {
          classifiedType: parsed.classifiedType || type,
          severityScore: Math.min(100, Math.max(0, Number(parsed.severityScore) || 0)),
          urgencyLevel: ['Low', 'Medium', 'High', 'Critical'].includes(parsed.urgencyLevel) ? parsed.urgencyLevel : 'Medium',
          keywordsDetected: Array.isArray(parsed.keywordsDetected) ? parsed.keywordsDetected : [],
          recommendation: parsed.recommendation || 'กรุณาเฝ้าระวังสถานการณ์อย่างใกล้ชิด',
          confidenceScore: Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0.5)),
          imageAnalysis: parsed.imageAnalysis || null,
          imageMatchesDescription: parsed.imageMatchesDescription ?? null,
          credibilityScore: Math.min(1, Math.max(0, Number(parsed.credibilityScore) || 0.5)),
          credibilityNote: parsed.credibilityNote || null,
        } as any;
      } catch (aiError) {
        console.error('OpenAI error:', aiError);
      }
    }

    // Confidence boost if image provided (max +0.10)
    if (imageUrl) analysis.confidenceScore = Math.min(1, analysis.confidenceScore + 0.10);

    // If credibility is very low, flag the incident
    const credScore = (analysis as any).credibilityScore;
    const incidentStatus = (credScore !== undefined && credScore < 0.3) ? 'investigating' : 'active';

    const docData = {
      type,
      description,
      location,
      imageUrl: imageUrl || null,
      userId: userId || 'anonymous',
      aiAnalysis: analysis,
      status: incidentStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'incidents'), docData);

    return NextResponse.json({
      _id: docRef.id,
      ...docData,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('POST incident error:', error);
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
  }
}

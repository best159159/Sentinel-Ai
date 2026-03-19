const db = require('../config/db');

const CRITICAL_KEYWORDS = [
    'trapped', 'explosion', 'collapse', 'elderly', 'children', 'hospital',
    'school', 'chemical', 'toxic', 'spreading', 'casualties', 'fatalities',
    'rescue', 'evacuation', 'blocked', 'rising water', 'structural damage',
];

let openai = null;
function getOpenAI() {
    if (!openai && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
        const OpenAI = require('openai');
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openai;
}

async function analyzeIncident(type, description, timestamp, base64Image = null) {
    const client = getOpenAI();
    if (!client) {
        console.log('⚠️  No OpenAI key — using fallback analysis');
        return fallbackAnalysis(type, description);
    }

    try {
        const textPrompt = `Analyze this emergency report and return ONLY JSON (no markdown). You MUST write the recommendation in THAI language and make it highly detailed, actionable, and analytical based on the text and image (if provided). 
The recommendation MUST be LONG and comprehensive (at least 3-4 paragraphs or a detailed step-by-step bulleted list). Include immediate actions to take, safety precautions, and long-term mitigation if applicable.

Type: ${type}
Description: ${description}
Time: ${timestamp}

{"classifiedType":"...","severityScore":0-100,"urgencyLevel":"Low|Medium|High|Critical","keywordsDetected":["..."],"recommendation":"(เขียนคำแนะนำการรับมืออย่างละเอียดเป็นภาษาไทยแบบจัดเต็มและยาวๆ เป็นข้อๆ เน้นการปฏิบัติจริงทันที วิธีเอาตัวรอด และข้อควรระวัง... )","confidenceScore":0.0-1.0}`;

        const content = base64Image ? [
            { type: "text", text: textPrompt },
            { type: "image_url", image_url: { url: base64Image } }
        ] : textPrompt;

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: content
            }],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        });

        const analysis = JSON.parse(response.choices[0].message.content);
        return {
            classifiedType: analysis.classifiedType || type,
            severityScore: Math.min(100, Math.max(0, Number(analysis.severityScore) || 0)),
            urgencyLevel: ['Low', 'Medium', 'High', 'Critical'].includes(analysis.urgencyLevel) ? analysis.urgencyLevel : 'Medium',
            keywordsDetected: Array.isArray(analysis.keywordsDetected) ? analysis.keywordsDetected : [],
            recommendation: analysis.recommendation || 'Monitor closely.',
            confidenceScore: Math.min(1, Math.max(0, Number(analysis.confidenceScore) || 0.5)),
        };
    } catch (error) {
        console.error('OpenAI error:', error.message);
        return fallbackAnalysis(type, description);
    }
}

function fallbackAnalysis(type, description) {
    const descLower = description.toLowerCase();
    const typeSeverity = { Earthquake: 75, Fire: 70, Flood: 65, Storm: 60, Accident: 50, Crime: 45, Other: 30 };
    let score = typeSeverity[type] || 40;
    const kw = [];
    CRITICAL_KEYWORDS.forEach(k => { if (descLower.includes(k)) { score = Math.min(100, score + 8); kw.push(k); } });
    const urgencyLevel = score >= 76 ? 'Critical' : score >= 51 ? 'High' : score >= 26 ? 'Medium' : 'Low';
    return { classifiedType: type, severityScore: score, urgencyLevel, keywordsDetected: kw, recommendation: `${type} reported. Emergency services should assess.`, confidenceScore: 0.5 };
}

async function calculateBoostedSeverity(incident) {
    let score = incident.severity_score || incident.severityScore || 0;
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const radius = 0.009;
    const nearbyResult = await db.query(`
    SELECT COUNT(*) as count FROM incidents
    WHERE id != $1 AND lat BETWEEN $2 AND $3 AND lng BETWEEN $4 AND $5 AND created_at >= $6
  `, [incident.id, incident.lat - radius, incident.lat + radius, incident.lng - radius, incident.lng + radius, thirtyMinAgo]);
    score += Math.min(25, (parseInt(nearbyResult.rows[0]?.count) || 0) * 5);
    const desc = (incident.description || '').toLowerCase();
    CRITICAL_KEYWORDS.forEach(k => { if (desc.includes(k)) score += 3; });
    return Math.min(100, score);
}

async function generateThaiEmergencyNews() {
    const client = getOpenAI();
    if (!client) {
        throw new Error('OpenAI API Key not set');
    }

    const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
            role: 'user',
            content: `You are an AI intelligence analyst for Thailand. Today is ${today}.
Find and summarize 8 realistic emergency incidents or major news events (e.g., floods, accidents, crimes, fires, or national-level alerts) that are likely to happen or have happened in Thailand recently. 
Base these on realistic patterns and current seasonal trends in Thailand.
Return the result ONLY as a JSON object containing a "news" array.
Each object in the array must have:
- "province": Name of the affected province in English or Thai
- "riskScore": integer 0-100 indicating severity depending on the event
- "summary": A very detailed news summary in Thai outlining the event
- "riskLevel": "Low", "Medium", "High", or "Critical"
- "source_title": A realistic news headline in Thai for this event
- "source_url": "https://thairath.co.th"
- "lat": Approximate latitude of the event location (number)
- "lng": Approximate longitude of the event location (number)`
        }],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    console.log(`🤖 AI News Generated: ${parsed.news?.length || 0} items`);
    return parsed.news || [];
}
async function chatWithAssistant(userMessages) {
    const client = getOpenAI();
    if (!client) {
        return "ขออภัยครับ ตอนนี้ระบบ AI ขัดข้องชั่วคราว หากเป็นเหตุฉุกเฉินกรุณาโทร 191 หรือ 1669 ทันทีครับ";
    }

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `คุณคือ 'Sentinel AI' แชทบอทผู้ช่วยอัจฉริยะด้านความปลอดภัยและเหตุฉุกเฉินของแอป Sentinel AI 
คุณมีหน้าที่ตอบคำถามเกี่ยวกับการขอความช่วยเหลือ การเอาชีวิตรอด การปฐมพยาบาลเบื้องต้น 
หรือการใช้งานแอปพลิเคชัน 
- ตอบเป็นภาษาไทยด้วยความสุภาพ กระชับ เข้าใจง่าย 
- หากผู้ใช้เจอเหตุร้ายแรง (เช่น เจ็บหนัก ไฟไหม้ใหญ่ โจรปล้น) ให้แนะนำให้รับมือเบื้องต้น และบอกให้รีบกดโทร 191 (เหตุด่วนเหตุร้าย) หรือ 1669 (การแพทย์ฉุกเฉิน) หรือ 199 (ดับเพลิง)`
                },
                ...userMessages
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Chat AI error:', error.message);
        return "ขออภัยครับ ระบบประมวลผลคำตอบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง";
    }
}

module.exports = { analyzeIncident, calculateBoostedSeverity, fallbackAnalysis, generateThaiEmergencyNews, getOpenAI, chatWithAssistant };

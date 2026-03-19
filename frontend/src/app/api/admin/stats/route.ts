import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  try {
    const snap = await getDocs(query(collection(db, 'incidents'), orderBy('createdAt', 'desc')));
    const all = snap.docs.map((d) => d.data());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayIncidents = all.filter((i: any) => {
      const ts = i.createdAt?.toDate?.() || new Date(i.createdAt);
      return ts >= today;
    });

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    todayIncidents.forEach((i: any) => {
      byType[i.type] = (byType[i.type] || 0) + 1;
      const ul = i.aiAnalysis?.urgencyLevel || 'Low';
      bySeverity[ul] = (bySeverity[ul] || 0) + 1;
    });

    const criticalIncidents = all
      .filter((i: any) => i.aiAnalysis?.urgencyLevel === 'Critical')
      .slice(0, 10)
      .map((i: any, idx: number) => ({
        _id: snap.docs[idx]?.id || idx,
        ...i,
        location: i.location,
        aiAnalysis: i.aiAnalysis,
      }));

    const avgConf =
      todayIncidents.reduce((sum: number, i: any) => sum + (i.aiAnalysis?.confidenceScore || 0), 0) /
      (todayIncidents.length || 1);

    return NextResponse.json({
      totalToday: todayIncidents.length,
      totalAll: all.length,
      byType,
      bySeverity,
      criticalIncidents,
      averageConfidence: avgConf,
      topRiskZones: [],
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}

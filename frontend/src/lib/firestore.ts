import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// ─── Incidents ────────────────────────────────────────────────

export async function getIncidents(filters?: { type?: string; urgency?: string }) {
  let q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(200));
  const snap = await getDocs(q);
  let incidents = snap.docs.map((d) => ({ _id: d.id, ...d.data() })) as any[];

  if (filters?.type) incidents = incidents.filter((i) => i.type === filters.type);
  if (filters?.urgency) incidents = incidents.filter((i) => i.aiAnalysis?.urgencyLevel === filters.urgency);

  return incidents;
}

export function subscribeToIncidents(callback: (incidents: any[]) => void) {
  const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(200));
  return onSnapshot(q, (snap) => {
    const incidents = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
    callback(incidents);
  });
}

export async function getMyIncidents(userId: string) {
  const q = query(
    collection(db, 'incidents'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function deleteIncident(id: string) {
  await deleteDoc(doc(db, 'incidents', id));
}

// ─── Upload Image to Firebase Storage ────────────────────────

export async function uploadIncidentImage(file: File, incidentId: string): Promise<string> {
  const storageRef = ref(storage, `incidents/${incidentId}/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// ─── User Profile ─────────────────────────────────────────────

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserLocation(uid: string, lat: number, lng: number) {
  await updateDoc(doc(db, 'users', uid), { location: { lat, lng } });
}

// ─── News Risks ───────────────────────────────────────────────

export async function getNewsRisks() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const q = query(
    collection(db, 'news_risks'),
    where('createdAt', '>=', Timestamp.fromDate(oneDayAgo)),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

// ─── Admin Stats ──────────────────────────────────────────────

export async function getAdminStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allSnap = await getDocs(collection(db, 'incidents'));
  const all = allSnap.docs.map((d) => d.data());

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
    .slice(0, 10);

  const avgConf =
    todayIncidents.reduce((sum: number, i: any) => sum + (i.aiAnalysis?.confidenceScore || 0), 0) /
    (todayIncidents.length || 1);

  return {
    totalToday: todayIncidents.length,
    totalAll: all.length,
    byType,
    bySeverity,
    criticalIncidents,
    averageConfidence: avgConf,
    topRiskZones: [],
  };
}

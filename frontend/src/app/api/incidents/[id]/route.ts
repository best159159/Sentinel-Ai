import { NextRequest, NextResponse } from 'next/server';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// DELETE /api/incidents/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const incidentDoc = await getDoc(doc(db, 'incidents', id));
    if (!incidentDoc.exists()) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    await deleteDoc(doc(db, 'incidents', id));
    return NextResponse.json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('DELETE incident error:', error);
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
  }
}

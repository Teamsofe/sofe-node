import { adminDb, FieldValue } from '@/lib/firebaseAdmin';
import { getStudentWeakestTopics, recordLocalDevAttempt } from '@/lib/studentAnalytics';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { student_id, attempts } = body;

    if (!student_id) {
      return new Response(JSON.stringify({ error: 'Missing student_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If attempts are provided, record them
    if (Array.isArray(attempts) && attempts.length > 0) {
      try {
        const batch = adminDb.batch();
        const colRef = adminDb.collection('quiz_attempts');

        for (const item of attempts) {
          const topic = String(item.topic || 'blockchain-fundamentals')
            .toLowerCase()
            .replace(/[^a-z0-9\-]/g, '-');
          const correct = Boolean(item.correct);

          const docRef = colRef.doc();
          batch.set(docRef, {
            student_id: String(student_id),
            topic,
            correct,
            created_at: FieldValue.serverTimestamp(),
          });
        }

        await batch.commit();
      } catch (firestoreErr) {
        console.warn('Firestore write notice (recording to dev fallback):', firestoreErr.message);
        recordLocalDevAttempt(student_id, attempts);
      }
    }

    // Query student's attempts and compute top 3 weakest topics
    const updatedWeakestTopics = await getStudentWeakestTopics(student_id);

    return new Response(
      JSON.stringify({
        success: true,
        recorded_count: Array.isArray(attempts) ? attempts.length : 0,
        weakest_topics: updatedWeakestTopics,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('API /api/quiz/result error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal quiz result error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

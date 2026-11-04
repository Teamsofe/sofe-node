import { adminDb } from './firebaseAdmin';

// In-memory fallback store for local development when GCP Application Default Credentials are not yet logged in locally
const localDevAttemptsStore = {
  'demo-student': [
    { topic: 'cryptography-and-wallets', correct: false },
    { topic: 'cryptography-and-wallets', correct: false },
    { topic: 'cryptography-and-wallets', correct: false },
    { topic: 'smart-contracts-and-evm', correct: false },
    { topic: 'smart-contracts-and-evm', correct: false },
    { topic: 'defi-and-token-standards', correct: false },
    { topic: 'blockchain-fundamentals', correct: true },
  ],
};

export function recordLocalDevAttempt(studentId, attempts) {
  if (!localDevAttemptsStore[studentId]) {
    localDevAttemptsStore[studentId] = [];
  }
  localDevAttemptsStore[studentId].push(...attempts);
}

/**
 * Computes top 3 weakest topics for a given student_id based on count of wrong answers in quiz_attempts.
 * @param {string} studentId
 * @returns {Promise<string[]>} Array of up to 3 topic names
 */
export async function getStudentWeakestTopics(studentId) {
  if (!studentId) return [];

  try {
    const snap = await adminDb
      .collection('quiz_attempts')
      .where('student_id', '==', studentId)
      .limit(100)
      .get();

    if (snap.empty) {
      // Check in-memory store if Firestore returned empty or in local dev
      if (localDevAttemptsStore[studentId]) {
        return computeFromList(localDevAttemptsStore[studentId]);
      }
      return [];
    }

    const attempts = snap.docs.map((doc) => doc.data());
    return computeFromList(attempts);
  } catch (error) {
    console.warn('Firestore query failed, using local fallback:', error.message);
    if (localDevAttemptsStore[studentId]) {
      return computeFromList(localDevAttemptsStore[studentId]);
    }
    return [];
  }
}

function computeFromList(list) {
  const wrongCountByTopic = {};

  list.forEach((data) => {
    const topic = data.topic;
    const correct = data.correct;

    if (!topic) return;

    if (!wrongCountByTopic[topic]) {
      wrongCountByTopic[topic] = 0;
    }

    if (correct === false) {
      wrongCountByTopic[topic] += 1;
    }
  });

  const sortedWeakTopics = Object.entries(wrongCountByTopic)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);

  return sortedWeakTopics.slice(0, 3);
}

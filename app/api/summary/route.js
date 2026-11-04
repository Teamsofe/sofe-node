import { generateText } from 'ai';
import { getMetaModel } from '@/lib/metaModel';
import { adminDb, FieldValue } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

// In-memory fallback cache for local dev / offline mode
const memorySummaryCache = {};

// Fallback knowledge base text if Firestore is empty or initializing
const DEFAULT_FOUNDATION_TEXT = `A blockchain is a decentralized, distributed, and append-only ledger that records transactions across a network of independent computers known as nodes. Unlike centralized databases maintained by a single administrator, blockchains eliminate single points of failure through peer-to-peer (P2P) networking and cryptographic verification.

Each block contains a cryptographically signed batch of valid transactions, a timestamp, a nonce, and the cryptographic hash of the previous block. Hashing (SHA-256 / Keccak-256) ensures immutability.
Consensus mechanisms:
1. Proof of Work (PoW): Nodes solve computationally intensive mathematical puzzles to validate transactions and produce new blocks.
2. Proof of Stake (PoS): Network validators propose and attest to new blocks proportionally to their staked collateral. Malicious validators face slashing.

Public-Key Cryptography forms the bedrock of Web3 identity: Private Key (secret 256-bit number to authorize transfers), Public Key (derived from private key), and Blockchain Address (truncated cryptographic hash).

Smart contracts are autonomous, self-executing programs executed deterministically by the Ethereum Virtual Machine (EVM). Gas economics (EIP-1559 base fee + priority tip) metering execution prevents denial-of-service halting issues. Standardized token interfaces include ERC-20 (fungible tokens) and ERC-721 (non-fungible tokens).`;

function parseSummaryAndTerms(rawText) {
  let summary = '';
  const key_terms = [];

  const summaryMatch = rawText.match(/SUMMARY:?\s*([\s\S]*?)(?=KEY TERMS:?|$)/i);
  if (summaryMatch && summaryMatch[1].trim()) {
    summary = summaryMatch[1].trim();
  } else {
    const parts = rawText.split(/KEY TERMS:?/i);
    summary = parts[0].trim();
  }

  const termsMatch = rawText.match(/KEY TERMS:?\s*([\s\S]*$)/i);
  if (termsMatch && termsMatch[1].trim()) {
    const lines = termsMatch[1].split('\n').map((l) => l.trim()).filter(Boolean);
    lines.forEach((line) => {
      const lineMatch = line.match(/^(?:\d+[\.\)]|\-|\*|•)?\s*(?:\[|\*\*)?([^:\]\*]+)(?:\]|\*\*)?:\s*(.+)$/);
      if (lineMatch) {
        key_terms.push({
          term: lineMatch[1].trim(),
          definition: lineMatch[2].trim(),
        });
      }
    });
  }

  if (key_terms.length === 0) {
    key_terms.push(
      { term: 'Consensus Mechanism', definition: 'Protocol enabling distributed nodes to agree on a single source of truth without intermediaries.' },
      { term: 'Private Key', definition: 'Secret cryptographic 256-bit key used to sign transactions and control wallet assets.' },
      { term: 'Smart Contract', definition: 'Self-executing code stored on-chain whose rules are enforced autonomously by consensus.' }
    );
  }

  return { summary, key_terms: key_terms.slice(0, 3) };
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { lesson_id, course_id, topic } = body;

    const activeLessonId = lesson_id || 'course-overview';
    const activeCourseId = course_id || 'foundation';

    // ── TASK 1: CHECK FIRESTORE CACHE (lesson_summaries) ──
    try {
      const cacheDoc = await adminDb.collection('lesson_summaries').doc(activeLessonId).get();
      if (cacheDoc.exists) {
        const cached = cacheDoc.data();
        if (cached?.summary) {
          return new Response(
            JSON.stringify({
              success: true,
              lesson_id: activeLessonId,
              course_id: activeCourseId,
              summary: cached.summary,
              key_terms: cached.key_terms || [],
              cached: true,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } catch (cacheErr) {
      console.warn('Firestore cache lookup notice (checking memory fallback):', cacheErr.message);
      if (memorySummaryCache[activeLessonId]) {
        const mem = memorySummaryCache[activeLessonId];
        return new Response(
          JSON.stringify({
            success: true,
            lesson_id: activeLessonId,
            course_id: activeCourseId,
            summary: mem.summary,
            key_terms: mem.key_terms,
            cached: true,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // ── CACHE MISS: FETCH DYNAMIC KNOWLEDGE BASE FROM FIRESTORE (course_content) ──
    let rawKnowledgeBase = '';
    try {
      const courseDoc = await adminDb.collection('course_content').doc(activeCourseId).get();
      if (courseDoc.exists) {
        rawKnowledgeBase = courseDoc.data().content || '';
      }
    } catch (courseErr) {
      console.warn('Firestore course_content read notice:', courseErr.message);
    }

    if (!rawKnowledgeBase) {
      rawKnowledgeBase = DEFAULT_FOUNDATION_TEXT;
    }

    // Call Meta model via @ai-sdk/openai-compatible
    const model = getMetaModel();

    const systemPrompt = `You are the Sofe Node Academy AI Learning Assistant.
Follow the prompt instructions strictly. Output the exact ~150-word synthesis and 3 key terms without conversational fluff.`;

    const userPrompt = `Provide a strictly 150-word summary of the following Sofe Node Academy curriculum material (Lesson ID: ${activeLessonId}, Topic: ${topic || 'Web3 Core'}), followed by exactly three key Web3 terms and their concise definitions extracted directly from the text.

CURRICULUM TEXT:
${rawKnowledgeBase}

FORMATTING REQUIREMENT:
SUMMARY:
[Write exactly ~150 words covering the essential concepts]

KEY TERMS:
1. [Term]: [Concise definition from text]
2. [Term]: [Concise definition from text]
3. [Term]: [Concise definition from text]`;

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
    });

    const { summary, key_terms } = parseSummaryAndTerms(result.text);

    // Write to Firestore lesson_summaries collection (cache write)
    try {
      await adminDb.collection('lesson_summaries').doc(activeLessonId).set({
        summary,
        key_terms,
        lesson_id: activeLessonId,
        course_id: activeCourseId,
        created_at: FieldValue.serverTimestamp(),
      });
    } catch (saveErr) {
      console.warn('Could not persist to Firestore lesson_summaries:', saveErr.message);
    }

    // Also update in-memory cache
    memorySummaryCache[activeLessonId] = { summary, key_terms };

    return new Response(
      JSON.stringify({
        success: true,
        lesson_id: activeLessonId,
        course_id: activeCourseId,
        summary,
        key_terms,
        cached: false,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('API /api/summary error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal summary error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

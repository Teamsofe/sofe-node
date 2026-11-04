import { generateText } from 'ai';
import { z } from 'zod';
import { getMetaModel } from '@/lib/metaModel';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const QuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5),
  options: z.array(z.string()).length(4),
  correct_answer: z.string().min(1),
  explanation: z.string().optional(),
  topic: z.string().min(1),
});

const QuizSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
});

function cleanJsonString(str) {
  return str
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

const DEFAULT_FOUNDATION_TEXT = `A blockchain is a decentralized, distributed, and append-only ledger that records transactions across a network of independent computers known as nodes.
Consensus mechanisms include Proof of Work (PoW) and Proof of Stake (PoS).
Public-Key Cryptography uses private keys to sign transactions and public keys/addresses to verify ownership.
Smart contracts run on the Ethereum Virtual Machine (EVM) with gas metering (EIP-1559).
Key token standards include ERC-20 for fungible tokens and ERC-721 for non-fungible tokens (NFTs).`;

async function requestQuizFromModel(model, knowledgeBase, topicName, retryError = null) {
  const systemPrompt = `You are an automated assessment generation engine for Sofe Node Academy.
You must output strictly valid, parseable JSON conforming to the requested schema.
Do NOT output markdown formatting, backticks, or explanatory commentary outside the JSON object.`;

  let prompt = `Based on the following Sofe Node Academy curriculum text, generate a 3-question multiple-choice practice quiz.
Each question MUST have:
- "question": clear question text
- "options": an array of exactly 4 plausible answer strings
- "correct_answer": the exact string of the correct option verbatim from options
- "explanation": a concise 1-sentence explanation of why it is correct based on the text
- "topic": "${topicName}"

CURRICULUM TEXT:
${knowledgeBase}

JSON SCHEMA:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_answer": "string",
      "explanation": "string",
      "topic": "${topicName}"
    }
  ]
}`;

  if (retryError) {
    prompt += `\n\n[RETRY NOTICE: Your previous output failed schema validation with error: "${retryError}". Please fix the structure and ensure each question has exactly 4 options and valid string fields.]`;
  }

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt,
    temperature: 0.2,
  });

  const cleaned = cleanJsonString(result.text);
  const parsed = JSON.parse(cleaned);
  return QuizSchema.parse(parsed);
}

export async function POST(req) {
  try {
    const { lesson_id, topic, course_id } = await req.json().catch(() => ({}));

    const activeCourseId = course_id || 'foundation';
    const activeTopic = topic || lesson_id || 'blockchain-fundamentals';

    // Fetch dynamic course content from Firestore course_content
    let knowledgeBase = '';
    try {
      const courseDoc = await adminDb.collection('course_content').doc(activeCourseId).get();
      if (courseDoc.exists) {
        knowledgeBase = courseDoc.data().content || '';
      }
    } catch (e) {
      console.warn('Firestore read notice in /api/quiz:', e.message);
    }

    if (!knowledgeBase) {
      knowledgeBase = DEFAULT_FOUNDATION_TEXT;
    }

    const model = getMetaModel();

    let quizData;
    try {
      quizData = await requestQuizFromModel(model, knowledgeBase, activeTopic);
    } catch (firstErr) {
      console.warn('Initial quiz generation failed, attempting schema-guided retry:', firstErr.message);
      quizData = await requestQuizFromModel(model, knowledgeBase, activeTopic, firstErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        topic: activeTopic,
        course_id: activeCourseId,
        questions: quizData.questions,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('API /api/quiz error:', err);

    // Fallback resilient quiz if model endpoint times out
    const fallbackQuiz = {
      questions: [
        {
          question: 'What is the primary role of a consensus mechanism in a blockchain network?',
          options: [
            'To allow nodes to agree on the state of the ledger without trusting each other',
            'To store private keys in cold hardware storage',
            'To encrypt user seed phrases in browser extensions',
            'To issue credit cards for Web3 transactions',
          ],
          correct_answer: 'To allow nodes to agree on the state of the ledger without trusting each other',
          explanation: 'Consensus mechanisms like PoW and PoS allow distributed independent nodes to reach agreement on transaction validity.',
          topic: 'blockchain-fundamentals',
        },
        {
          question: 'Why should a crypto wallet seed phrase never be shared with anyone?',
          options: [
            'It grants complete cryptographic control to authorize transactions and access all funds',
            'It slows down transaction execution speeds on the network',
            'It increases Ethereum gas fees under EIP-1559',
            'It expires automatically after 24 hours',
          ],
          correct_answer: 'It grants complete cryptographic control to authorize transactions and access all funds',
          explanation: 'The seed phrase deterministically generates all private keys for the wallet; exposing it gives full access to an attacker.',
          topic: 'cryptography-and-wallets',
        },
        {
          question: 'What is the standard interface for fungible tokens on the Ethereum network?',
          options: ['ERC-20', 'ERC-721', 'ERC-1155', 'EIP-1559'],
          correct_answer: 'ERC-20',
          explanation: 'ERC-20 defines the standard API for fungible, interchangeable tokens such as USDC and governance tokens.',
          topic: 'defi-and-token-standards',
        },
      ],
    };

    return new Response(JSON.stringify(fallbackQuiz), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

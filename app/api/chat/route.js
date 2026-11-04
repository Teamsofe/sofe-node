import { streamText, convertToModelMessages } from 'ai';
import { getMetaModel } from '@/lib/metaModel';
import { adminDb } from '@/lib/firebaseAdmin';
import { getStudentWeakestTopics } from '@/lib/studentAnalytics';

export const dynamic = 'force-dynamic';

const DEFAULT_FOUNDATION_TEXT = `A blockchain is a decentralized, distributed, and append-only ledger that records transactions across a network of independent computers known as nodes. Unlike centralized databases maintained by a single administrator, blockchains eliminate single points of failure through peer-to-peer (P2P) networking and cryptographic verification.

Each block in a blockchain contains a cryptographically signed batch of valid transactions, a timestamp, a nonce, and the cryptographic hash of the previous block. Hashing (SHA-256 / Keccak-256) ensures immutability: any alteration of past transaction data alters that block's hash, invalidating all subsequent blocks in the chain.

Consensus mechanisms enable distributed nodes to agree on a single source of truth without requiring trust between participants:
1. Proof of Work (PoW): Nodes (miners) compete to solve computationally intensive mathematical puzzles to validate transactions and produce new blocks.
2. Proof of Stake (PoS): Network validators are selected to propose and attest to new blocks proportionally to their economic stake—the cryptocurrency they deposit as collateral. Malicious validators face slashing.

Public-Key Cryptography forms the bedrock of blockchain identity:
- Private Key: A secret 256-bit number that must never be revealed. It is used to generate cryptographic digital signatures that authorize token transfers and contract interactions.
- Public Key: Mathematically derived from the private key via elliptic curve multiplication.
- Blockchain Address: A truncated cryptographic hash of the public key (e.g., on Ethereum, the last 20 bytes of Keccak-256).

Hierarchical Deterministic (HD) Wallets (BIP-32 / BIP-39 / BIP-44) derive keys from a 12- or 24-word Secret Recovery Phrase (Seed Phrase). Never share seed phrases with anyone, including AI assistants or support staff.

Smart Contracts are self-executing computer programs deployed to a blockchain address whose logic is enforced autonomously by the Ethereum Virtual Machine (EVM). Gas metering solves the halting problem and protects node resources (EIP-1559 base fee + priority fee). Standard token interfaces include ERC-20 (fungible tokens) and ERC-721 (non-fungible tokens). Decentralized finance (DeFi) primitives include Automated Market Makers (AMMs) using x * y = k liquidity pools.`;

export async function POST(req) {
  try {
    const { messages, student_id, course_id } = await req.json();

    const activeCourseId = course_id || 'foundation';

    // 1. Query quiz_attempts and compute student's top 3 weakest topics
    const weakestTopics = await getStudentWeakestTopics(student_id);

    // 2. Fetch raw curriculum text dynamically from Firestore course_content
    let courseKnowledgeBase = '';
    try {
      const courseDoc = await adminDb.collection('course_content').doc(activeCourseId).get();
      if (courseDoc.exists) {
        courseKnowledgeBase = courseDoc.data().content || '';
      }
    } catch (dbErr) {
      console.warn('Firestore course_content read notice in /api/chat:', dbErr.message);
    }

    if (!courseKnowledgeBase) {
      courseKnowledgeBase = DEFAULT_FOUNDATION_TEXT;
    }

    // 3. System prompt with strict instructions & guardrails
    const systemPrompt = `You are the Sofe Node Academy AI Learning Assistant, dedicated to helping students master Web3 and blockchain concepts.

==================================================
AUTHENTIC SOFE NODE CURRICULUM KNOWLEDGE BASE (SOURCE OF TRUTH):
==================================================
${courseKnowledgeBase}
==================================================

STRICT OPERATIONAL RULES:
1. GROUNDED IN CURRICULUM: Answer questions ONLY using facts, concepts, and technical definitions directly explained in the knowledge base text above.
2. CITATION REQUIREMENT: In your response, cite the relevant section or topic you used to answer the student's question (e.g. "[Source: Sofe Node Curriculum]").
3. UNCOVERED TOPICS DECLINATION: If the question asks about something not covered in the injected curriculum text, state plainly: "I can only answer questions based on the Sofe Node Academy curriculum. The lesson materials do not cover this topic." Do NOT fabricate, assume, or pull from external general knowledge.
4. PERSONALIZATION TO WEAKEST TOPICS:
${
  weakestTopics.length > 0
    ? `The student currently has identified learning gaps in their top weakest topics: [${weakestTopics.join(
        ', '
      )}]. Whenever relevant to the discussion, prioritize breaking down foundational ideas in these areas with extra clarity and intuitive explanations.`
    : 'The student does not currently have recorded learning gaps in quiz attempts. Provide clear, encouraging guidance.'
}
5. SAFETY & SECURITY GUARDRAILS:
- NEVER reveal, generate, ask for, or validate private keys, seed phrases, recovery phrases, or wallet passwords.
- If a user mentions or asks for a private key or seed phrase, IMMEDIATELY refuse and warn them: "⚠️ Critical Security Reminder: Never share your seed phrase, private keys, or wallet credentials with anyone, including AI assistants or support staff. Keep your secrets offline."
- NEVER provide speculative financial advice, token price forecasts, or trading recommendations. Remind the student that Sofe Node focuses strictly on educational technology and career empowerment.`;

    const model = getMetaModel();

    let modelMessages = [];
    if (Array.isArray(messages)) {
      const isUIMessageFormat = messages.some((m) => Array.isArray(m?.parts));
      if (isUIMessageFormat) {
        modelMessages = await convertToModelMessages(messages);
      } else {
        modelMessages = messages.map((m) => ({
          role: m.role || 'user',
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content || ''),
        }));
      }
    }

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
    });

    if (typeof result.toUIMessageStreamResponse === 'function') {
      return result.toUIMessageStreamResponse();
    }
    if (typeof result.toTextStreamResponse === 'function') {
      return result.toTextStreamResponse();
    }
    return result.toDataStreamResponse();
  } catch (err) {
    console.error('API /api/chat error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal chat error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

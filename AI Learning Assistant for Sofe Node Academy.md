# AI Learning Assistant for Sofe Node Academy

Oct 22, 2026 · @Shedrack

The assistant lives at node.sofegroup.com/academy and answers questions, summarises lessons and sets quizzes from the academy's own course material, running on Gemma 4 behind a swappable model setting.

## Architecture

&#91;embedded content: assistant architecture · 5 components\]

Every request goes through one API route: it pulls matching lesson chunks and the student's weak topics, builds the prompt, and streams the model's reply back to the page.

## Stack

Every layer has a free option, and the model sits behind environment variables so switching from Gemma 4 to Llama is a config change.

| Layer | Choice | Why |
| --- | --- | --- |
| Front end | Next.js page at /academy with a chat panel and a quiz view | The site already runs on Next.js |
| Streaming | Vercel AI SDK (open source) | Streams tokens to the chat panel |
| Model | Gemma 4 (Apache 2.0) behind an OpenAI-compatible endpoint, self-hosted with Ollama or vLLM, or a hosted provider | One base URL and model name in env vars |
| Embeddings | An open embedding model, for example EmbeddingGemma or bge-small | Free, runs on the same host |
| Storage and search | Postgres with pgvector, for example Supabase free tier | One database for lesson chunks and quiz results |
| Login | The academy's current login | Ties progress to each student |

## Build steps

Ship retrieval first, because every other feature depends on it.

1. **Ingest the curriculum.** Export each lesson as text, split it into chunks of a few hundred words, embed each chunk, and store it with its course, lesson and topic.
2. **Stand up the model endpoint.** Run Gemma 4 on an OpenAI-compatible server and set the base URL and model name in env vars.
3. **Add /api/chat.** Embed the question, fetch the top matching chunks, build the prompt, and stream the answer with its lesson references.
4. **Add summaries and quizzes.** Two more routes reuse the same retrieval: one summarises a lesson, one returns quiz questions as JSON.
5. **Build the /academy UI.** A chat panel, a Summarise button on each lesson, and a quiz view that posts answers back.
6. **Track progress.** Save each quiz result by student and topic, then pass the weakest topics into the prompt and retrieval step.
7. **Test with real lessons.** Check that answers cite the right lesson and that the assistant says it doesn't know when nothing relevant is found.
8. **Fine-tune later, if needed.** Use LoRA on a small model for quiz format and Web3 terms once retrieval and prompting have hit a clear limit.

## Data model and API

Two tables and four routes cover every feature.

| Table | Columns | Purpose |
| --- | --- | --- |
| lesson\_chunks | id, course, lesson, topic, text, embedding (vector) | Searchable course content |
| quiz\_attempts | id, student\_id, topic, question, correct, created\_at | Source of each student's weak topics |

| Route | Input | Output |
| --- | --- | --- |
| POST /api/chat | question, optional lesson | Streamed answer with lesson references |
| POST /api/summary | lesson | Short summary of that lesson |
| POST /api/quiz | lesson, number of questions | JSON with question, options, answer, explanation, topic |
| POST /api/quiz/result | the student's answers | Score and weakest topics, after saving the attempts |

## Prompts and guardrails

The assistant answers only from retrieved lesson text, which keeps it accurate and on topic.

- **Tutor:** answer from the supplied chunks, name the lesson used, and say so plainly when the chunks don't cover the question.
- **Personalisation:** add the student's two or three weakest topics to the prompt so explanations start there.
- **Summary:** cap the output at about 150 words plus three key terms.
- **Quiz:** return JSON only, make every question answerable from the supplied text, tag each with its topic, and retry once if the JSON is malformed.
- **Safety:** refuse any request for private keys or seed phrases, remind students never to share them, and log unanswered questions to find gaps in the course content.

## Open questions

- [ ] Where does the academy's course content live today (MDX files, a CMS, a database)?
- [ ] Does /academy already have student login, or does it need one for progress tracking?
- [ ] Where will the model run: your own server, or a hosted provider?
- [ ] Gemma 4 or Llama? The Meta hackathon is built around Meta's models.

# Arena - LLD Practice Platform

A Low-Level Design (LLD) practice platform where engineers can practice object-oriented design problems and receive structured, actionable feedback evaluated with Google Gemini 3.6 Flash.

---

## What It Does

- **4 Curated LLD Problems**: Parking Lot (Medium), Elevator System (Hard), Vending Machine (Easy), and Library Management (Medium).
- **Structured 6-Section Canvas**: Solvers break down designs into Requirements, Core Classes, Class Responsibilities, Relationships, Trade-offs, and Concurrency/Edge Cases.
- **Smart Editor**: Pre-filled numbered starter points (`1.`, `2.`, `3.`), auto-advancing line numbers on `Enter`, exit on empty `Enter`, and reference sample templates.
- **Dual-Tier Evaluator**: Fast deterministic checks (`RuleBasedEvaluator`) plus structured LLM reasoning (`LLMEvaluator` via Gemini 3.6 Flash).
- **Explainable Feedback**: Scorecard showing 0–100 overall score, 7 rubric breakdowns, key design strengths, and specific critiques with concrete refactoring suggestions.
- **Upfront Persistence**: Submissions are saved before the LLM is called, so user designs are never lost if an API call fails or times out.
- **Attempt History**: Dedicated `/practice` page tracking previous submissions, scores, and status with 1-click retry.

---

## User Flow

`Choose Problem` -> `Think / Design` -> `Submit` -> `Evaluating` -> `Feedback` -> `Try Again`

1. **Choose Problem**: Select from the problem catalog with difficulty tags and requirements.
2. **Practice**: Draft the solution in the split-screen workspace (requirements on the left, 6-section editor on the right).
3. **Submit**: Content is validated for minimum completeness and saved to the store in state `Submitted`.
4. **Evaluating**: Backend evaluates the submission through `CompositeEvaluator`.
5. **Feedback**: View the scorecard with overall score, 7 criteria progress bars, and evidence-grounded suggestions.
6. **Try Again**: Refine the design in the workspace and re-evaluate to see progress.

---

## Quickstart

### Prerequisites
- Node.js 18+
- npm 9+
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install
```bash
cd arena-lld-practice-platform
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your API key in `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
GEMINI_TIMEOUT_MS=60000
```

> **Security Note**: `GEMINI_API_KEY` is only read server-side inside Node.js Vite middleware. It is never exposed to the client bundle or browser.

### 3. Run Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Run Tests & Build
```bash
# Run all 23 unit tests (offline, mocked, zero tokens)
npm test

# Type-check with TypeScript
npm run typecheck

# Production build
npm run build
```

---

## Architecture & Evaluator Hierarchy

```
Evaluator (interface)
├── RuleBasedEvaluator (Deterministic checks for sections, OOP keywords, empty submissions)
├── LLMEvaluator (Calls Gemini 3.6 Flash with strict JSON schema and rubric prompt)
└── CompositeEvaluator (Orchestrates rule-based + LLM evaluation)
```

- **`PracticeService`**: Manages submission lifecycle (`Submitted` -> `Evaluating` -> `Completed` / `Failed`). Depends solely on the `Evaluator` interface (Dependency Inversion), never on the Gemini SDK directly.
- **`PracticeStore`**: Repository interface handling in-memory storage of problems, submissions, and evaluation attempts.
- **`RealGeminiClient`**: Server-side client wrapping `@google/genai`. Handles 60s timeout aborts, JSON schema configuration, and exponential backoff retries on HTTP 503 / 429 errors.
- **Vite Server Plugin (`vitePlugin.ts` & `apiHandler.ts`)**: Express-like middleware running inside the Vite dev/preview server. Serves `/api/submissions`, `/api/evaluations`, and isolates environment secrets.

---

## Submission Lifecycle & Resilience

```
[User Submits] ---> Submitted ---> Evaluating ---> Completed
                         |              |
                         |              v
                         |           Failed
                         |              |
                         +-------<--- Retry
```

1. **Upfront Persistence**: Submissions are saved *before* calling Gemini. If Google's API drops the connection or times out, the submission is not lost.
2. **Evaluation Lock**: An in-memory lock prevents concurrent duplicate submissions for the same attempt.
3. **Automatic Retries**: Up to 3 attempts with exponential backoff on transient HTTP 503 (high demand) and 429 (rate limit) spikes.
4. **Timeout Boundary**: Configured to 60s (`GEMINI_TIMEOUT_MS`). Aborts gracefully if the model stalls.
5. **Interactive Retry**: If an attempt reaches `Failed`, the UI presents a "Retry Evaluation" button that re-triggers evaluation without re-typing.

---

## Key Design Decisions

1. **Server-Side API Route vs Direct Client SDK**: API keys should never live in client-side code. We use Vite server middleware so the client only talks to local `/api/*` endpoints.
2. **Upfront Persistence**: Saving before evaluation prevents user work from being lost on transient network or API failures.
3. **Structured JSON Schema over Free-form Markdown**: Configured Gemini with `responseSchema` and added runtime type validation to guarantee that scores and rubric breakdowns are always valid numbers and non-empty strings.
4. **Evaluator Strategy Pattern**: Keeps core logic independent of any specific LLM provider and allows tests to run instantly with mocks without consuming API credits.

---

## Testing

All 23 tests run in Vitest without requiring an active internet connection or Gemini API key:

```bash
npm test
```

- **`LLMEvaluator.test.ts` (9 tests)**: JSON response parsing, code block stripping, malformed JSON rejection, out-of-bound score handling, timeout errors, rate limit mapping, missing API key handling.
- **`PracticeService.test.ts` (5 tests)**: Upfront submission persistence, full successful lifecycle, failure lifecycle, retry recovery, concurrency locking.
- **`RuleBasedAndComposite.test.ts` (3 tests)**: Empty submission short-circuiting, OOP keyword detection, composite orchestration.
- **`WorkspaceFormatting.test.ts` (6 tests)**: Auto-numbering on Enter, list termination on empty Enter, bullet lists, default 60s timeout configuration.

---

## Limitations & Future Improvements

### Current Limitations
- **In-Memory Store**: Attempt history resets when the server restarts.
- **Text-Only Input**: Architecture is articulated via structured text rather than a visual UML drag-and-drop tool.
- **Single Model**: Evaluator is currently wired to Gemini 3.6 Flash.
- **Static Analysis**: Evaluates architectural thinking and class models, not compiled runnable code.

### Future Work
- Add SQLite/PostgreSQL persistence via Prisma.
- Auto-generate Mermaid.js class diagrams from the user's class and relationship inputs.
- Multi-model evaluation support (Claude 3.7, GPT-4o, local Ollama models).
- Code runner sandbox to test candidate class implementations against executable unit tests.

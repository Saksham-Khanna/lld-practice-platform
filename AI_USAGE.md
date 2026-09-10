# AI Usage & Development Notes

This document covers how AI was used during the development of this project, including decisions made with AI assistance and how Google Gemini is integrated into the final application.

---

## 1. AI-Assisted Development vs. Runtime Feature

- **AI-Assisted Development**: Tools used to write, refactor, and test the codebase (Google Antigravity coding assistant).
- **Gemini Runtime Product Feature**: The actual feature in the web app that takes a candidate's LLD submission, evaluates it via the `@google/genai` SDK on the Node backend, and returns structured feedback.

---

## 2. AI Tools Used During Development

- **Google Antigravity Agentic Assistant**: Used as a pair programming assistant for scaffolding components, setting up the evaluator hierarchy, writing unit tests, and cleaning up UI styling.
- **Google AI Studio**: Used to generate API keys, test candidate prompts against Gemini 3.6 Flash, and verify JSON response schemas.

---

## 3. What AI Was Used For

### UI & Prototyping
- Swapped out an initial dark/neon UI for a clean, professional light pastel theme (`#f2fcf7` to `#f5f0fe`).
- Removed gimmicky AI badges and sparkles, replacing them with standard engineering icons.
- Built keyboard interaction logic in the textareas: automatically continuing numbered lists on Enter, exiting on empty lines, and handling Tab indentation.
- Drafted starter templates for each problem (`starterTemplates.ts`) to serve as sample reference architectures.

### Implementation
- Scaffolding the object-oriented evaluator hierarchy (`Evaluator`, `RuleBasedEvaluator`, `LLMEvaluator`, `CompositeEvaluator`).
- Writing the Vite server middleware (`vitePlugin.ts`, `apiHandler.ts`) to handle `/api/*` endpoints and prevent API key leakage.
- Implementing upfront persistence in `PracticeService` so submissions are saved before calling the LLM.
- Writing test cases for Vitest covering success, timeout, rate limit, and malformed JSON scenarios.

---

## 4. Meaningful AI-Assisted Decisions

The assignment asks for 3–5 decisions where AI suggestions were evaluated and accepted or rejected:

### 1. Server-Side API Proxy vs. Direct Client-Side SDK Calls
- **AI Suggested**: Calling the Gemini API directly from the browser using `import.meta.env.VITE_GEMINI_API_KEY` to simplify the architecture and avoid server middleware.
- **Decision**: **Rejected**.
- **Why**: Exposing `GEMINI_API_KEY` in the browser bundle is a security risk (visible in DevTools / Network tab). We built a server middleware layer in Vite (`src/server/apiHandler.ts`) so the key stays strictly on the server.

### 2. Upfront Persistence vs. Atomic Save After Evaluation
- **AI Suggested**: Only saving the submission and evaluation together after Gemini returns a successful response.
- **Decision**: **Rejected**.
- **Why**: LLM API calls can time out or hit rate limits. If we only persist after a successful call, an API failure destroys the candidate's typed design. We chose to persist the submission immediately in state `Submitted`. If the LLM call fails, the attempt is marked `Failed` and the user can retry with one click without re-typing.

### 3. Strategy/Composite Evaluator Pattern vs. Direct SDK Call in Service
- **AI Suggested**: Removing the `Evaluator` interface hierarchy and directly calling `gemini.models.generateContent()` inside `PracticeService.ts` to reduce boilerplate.
- **Decision**: **Rejected**.
- **Why**: Tightly coupling domain logic to a specific third-party SDK violates Dependency Inversion. Keeping `Evaluator` as an interface allows:
  1. Instant unit testing using mocked clients without spending API tokens.
  2. The `CompositeEvaluator` to catch completely empty submissions deterministically before calling the LLM.
  3. Future support for other LLMs (Claude, GPT-4o, local models) without touching `PracticeService`.

### 4. Strict JSON Schema vs. Free-form Markdown Parsing
- **AI Suggested**: Asking Gemini to respond in Markdown with a ` ```json ` code fence and using a regex to parse it.
- **Decision**: **Rejected in favor of strict JSON schema + runtime validation**.
- **Why**: Regex parsing of LLM output breaks when the model adds conversational preamble or forgets a closing brace. We configured `@google/genai` with `responseMimeType: 'application/json'` and an explicit `responseSchema`, backed by a runtime validator (`validateEvaluationResponse`) that verifies score ranges and required fields before saving.

---

## 5. How Gemini Is Used in the Product

In the live application, **Google Gemini 3.6 Flash** evaluates the user's architectural design:

1. **Input Payload**: The problem requirements, constraints, and the 6 user-authored sections (Requirements, Classes, Responsibilities, Relationships, Trade-offs, Edge Cases).
2. **Evaluation Persona**: System prompt instructs Gemini to act as a Principal Software Architect evaluating an LLD interview. It explicitly allows multiple valid architectural patterns (State vs. Strategy vs. Table-driven).
3. **Structured Scoring**: The model grades 7 weighted criteria:
   - Requirement Understanding (15%)
   - Class Responsibilities & Cohesion (20%)
   - Encapsulation & Interfaces (15%)
   - Relationships & Coupling (15%)
   - Extensibility & Trade-offs (15%)
   - Edge Cases & Testability (10%)
   - Explanation Quality (10%)
4. **Actionable Feedback**: Each critique item provides:
   - *Evidence*: Quoting the user's class or text.
   - *Concern*: The design smell or architectural risk.
   - *Suggestion*: Concrete refactoring advice.

---

## 6. Testing & Manual Validation

- **Automated Tests**: 23 Vitest unit tests (`npm test`) using an `IGeminiClient` mock to verify schema validation, error mapping, timeout aborts, and retry recovery without burning tokens.
- **Manual Verification**:
  - Inspected browser network tab to ensure no `GEMINI_API_KEY` leaks in client requests.
  - Tested transient failure recovery by simulating timeouts (60s limit) and API errors (503 / 429 backoff).
  - Tested keyboard auto-numbering, list termination, and Tab indentation across browsers.
  - Compared evaluation results on complete reference solutions versus intentionally broken designs to verify grading accuracy.

---

## 7. Limitations & Risks

- **Subjectivity**: LLMs can give slightly different qualitative feedback across repeated runs of the same solution, though scores remain consistent due to the structured rubric.
- **No Dynamic Code Execution**: The evaluator assesses architectural thinking, interfaces, and patterns statically. It cannot execute code to verify real thread safety or race conditions.
- **External Dependency**: If Google's API is under heavy load, requests can take longer. We added a 60s timeout, exponential backoff retries on 503 errors, and an in-app retry button to mitigate this.

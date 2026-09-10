# Research Note: LLD Practice Platform

## 1. Learner Problem

### Who the learner is
Software engineers preparing for Low-Level Design (LLD) and Object-Oriented Design (OOD) rounds in technical interviews, as well as developers wanting to improve how they structure modular backend systems.

### Why LLD practice is difficult
Unlike algorithmic coding (LeetCode) where unit tests give an immediate pass/fail verdict, low-level design has no single correct answer. A system like a Parking Lot or Elevator can be designed using multiple valid patterns (State, Strategy, Observer). 

Because there is no test runner or compiler for architectural quality, learners often struggle with:
- Deciding which classes should exist versus what creates an over-engineered hierarchy.
- Spotting "God classes" that violate Single Responsibility (e.g. a ParkingLot class that also handles payments and gate sensors).
- Identifying where inheritance should be replaced by composition.
- Addressing concurrency (e.g. race conditions when reserving a spot) instead of just drawing happy-path class diagrams.

### Gaps in existing approaches
1. **Books and Static Courses (e.g., Grokking the LLD Interview)**: Provide one author's reference solution. The learner reads passively but never receives feedback on their own attempt or alternative pattern choices.
2. **Peer Mock Interviews (e.g., Pramp)**: Difficult to schedule regularly, time-consuming, and feedback quality varies wildly depending on the peer's own experience.
3. **Generic AI Chatbots (ChatGPT / Claude)**: When asked to evaluate an LLD, generic prompts usually return generic praise, miss missing concurrency edge cases, or hallucinate classes the user never wrote. They lack a calibrated rubric and cannot give consistent grading.

---

## 2. Product Direction

The goal is to build a focused practice tool where an engineer can draft an LLD solution and get immediate, objective, rubric-calibrated feedback grounded in their actual text.

### Core Learner Loop
`Choose Problem` -> `Think / Design` -> `Submit` -> `Get Feedback` -> `Review` -> `Try Again`

The emphasis is on iteration: the learner looks at specific suggestions (e.g. "extract payment logic into a strategy interface"), refactors their design in the workspace, and resubmits to see their score improve.

---

## 3. MVP Scope

### Problems Included (4 Curated Scenarios)
1. **Multi-floor Parking Lot (Medium)**: Tests strategy pattern for pricing and spot allocation, plus concurrency on spot reservations.
2. **Elevator Control System (Hard)**: Tests state management, scheduling algorithms, and request dispatching.
3. **Vending Machine (Easy)**: Tests classic state machine transitions and inventory handling.
4. **Library Management System (Medium)**: Tests entity relationships, lending policies, and fine calculation.

### Structured Workspace
Instead of an empty text box, the workspace splits the design into 6 explicit sections:
1. Requirements & Assumptions
2. Core Classes & Interfaces
3. Class Responsibilities (SRP)
4. Relationships (Composition vs Inheritance)
5. Design Decisions & Trade-offs
6. Edge Cases & Concurrency

Each section starts with 1, 2, 3 skeleton prompts. Pressing Enter automatically continues the list.

### Out of Scope for MVP
- High-Level Design concerns (Kubernetes, microservices, CDN, sharding).
- User auth, social login, and profile settings.
- Runnable code compilation (the platform evaluates design thinking and OOP structure, not compiler syntax).
- Complex drag-and-drop UML canvas (textual structure is faster to draft and easier for an LLM to evaluate accurately).

---

## 4. Evaluation Approach

A dual-tier approach combines fast deterministic checks with semantic reasoning:

### Deterministic Checks (`RuleBasedEvaluator`)
- Verifies that all 6 sections contain meaningful input before querying the model.
- Scans for essential OOP keywords (class, interface, enum, implements, extends, synchronized, locks).
- Short-circuits completely empty or unedited skeleton submissions to save LLM tokens.

### LLM Evaluation (`LLMEvaluator` via Gemini 3.6 Flash)
- Evaluates the design against the problem's stated requirements and clean architecture principles.
- Constrained with a strict JSON schema (`responseSchema` in `@google/genai`) so the output always matches the required data shape.
- Evaluates across 7 weighted rubric criteria:
  - Requirement Understanding (15%)
  - Class Responsibilities & Cohesion (20%)
  - Encapsulation & Interfaces (15%)
  - Relationships & Coupling (15%)
  - Extensibility & Trade-offs (15%)
  - Edge Cases & Testability (10%)
  - Explanation Quality (10%)
- Feedback format follows **Evidence -> Concern -> Suggestion**:
  - *Evidence*: Quotes the user's specific class or text.
  - *Concern*: Explains the architectural risk.
  - *Suggestion*: Gives a concrete code-level fix (e.g., "Add interface `PaymentStrategy` with method `calculateFee`").

---

## 5. Key Product & Engineering Decisions

1. **6 Structured Sections over Free-Form Text**:
   Forcing structured inputs mirrors real interview frameworks (requirements -> entities -> relationships -> trade-offs) and prevents incomplete submissions.
2. **Server-Side API Key Isolation**:
   Gemini API calls are made inside Node.js Vite server middleware (`/api/*`). The API key is never bundled into client JavaScript.
3. **Upfront Persistence Before LLM Call**:
   When the user submits, their solution is stored in state `Submitted` immediately. If Gemini times out or hits a rate limit, the submission is preserved and marked `Failed`, allowing a 1-click retry without losing their work.
4. **Evaluator Strategy Hierarchy**:
   `PracticeService` depends on an `Evaluator` interface rather than directly calling the Gemini SDK. This makes unit testing fast and reliable with mocks and allows swapping providers later.
5. **Split-Screen Layout**:
   Requirements remain pinned on the left while editing on the right, avoiding tab switching.

---

## 6. Trade-offs & Limitations

- **In-Memory Storage**: Data resets if the dev server restarts. For an MVP prototype, this avoids database setup complexity while keeping storage isolated behind a repository interface (`PracticeStore`).
- **No Live Code Execution**: The platform evaluates design descriptions and signatures, not runtime bytecode. This matches how interviewers grade LLD whiteboards.
- **LLM Phrasing Variance**: While the JSON schema and scoring formula keep scores stable, qualitative wording can vary slightly between runs.
- **Fixed Set of 4 Problems**: Curating a small set allows comprehensive starter templates and validated prompts, but limits variety until more problems are added.

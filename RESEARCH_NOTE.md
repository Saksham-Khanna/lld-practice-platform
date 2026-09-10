# Research Note: Low-Level Design (LLD) Practice Platform

---

## 1. Learner Problem

### Target Learner
Software engineers preparing for Low-Level Design (LLD) and Object-Oriented Design (OOD) interview rounds, as well as backend developers seeking to master modular, decoupled system decomposition.

### Why LLD Practice Is Difficult
Unlike algorithmic coding where unit tests provide immediate pass/fail verification, low-level design lacks a compiler or automated test runner for architectural quality. Multiple valid design patterns can solve the same problem (e.g., State vs. Strategy). Consequently, learners struggle with:
- Deciding appropriate class boundaries versus creating bloated "God classes".
- Identifying when to prefer composition over inheritance.
- Anticipating concurrency bottlenecks and race conditions on shared state.

### Gaps in Existing Approaches
- **Static Books & Video Courses**: Provide passive reference solutions. They show one author's design, but cannot evaluate a learner's own attempt or diagnose their specific architectural trade-offs.
- **Peer Mock Interviews**: Inconvenient to schedule, expensive, and subject to high interviewer variance and subjective bias.
- **Generic AI Chatbots**: Prompting general-purpose chatbots yields superficial praise, misses subtle concurrency flaws, and lacks a calibrated rubric for consistent grading.

---

## 2. Product Direction & Core Learner Loop

### Product Vision
A targeted, repeatable practice platform that provides immediate, rubric-based, evidence-grounded evaluation on user-authored designs, enabling engineers to practice object-oriented decomposition systematically.

### Core Learner Loop
`Choose Problem` -> `Think / Design` -> `Submit` -> `Get Feedback` -> `Review` -> `Try Again`

The product emphasizes iterative improvement: learners review actionable critiques, refactor their entity responsibilities or relationships in the workspace, and resubmit to verify measurable design progress.

---

## 3. MVP Scope

### Curated Problem Set (4 Scenarios)
1. **Multi-floor Parking Lot (Medium)**: Strategy pattern for pricing and spot allocation; concurrency locks on spot reservations.
2. **Elevator Control System (Hard)**: State management, scheduling algorithms, and request dispatching.
3. **Vending Machine (Easy)**: State pattern transitions and inventory encapsulation.
4. **Library Management System (Medium)**: Entity relationships, member privileges, lending policies, and fine calculation.

### Structured Workspace Canvas
A split-screen workspace displaying problem requirements and constraints on the left, paired with a 6-section structured canvas on the right:
1. Requirements & Assumptions
2. Core Classes & Interfaces
3. Class Responsibilities (SRP & Cohesion)
4. Relationships (Composition vs. Inheritance)
5. Design Decisions & Trade-offs
6. Edge Cases & Concurrency

Each section includes starter skeleton prompts (`1.`, `2.`, `3.`) with automatic list continuation on Enter.

### Explicit MVP Non-Goals
- High-Level Design (HLD) concerns (Kubernetes, sharding, distributed caches, CDN).
- User authentication, multi-tenant databases, or LMS overhead.
- Dynamic code compilation and runtime test execution.
- Complex drag-and-drop UML tools (structured text is faster to write and evaluate reliably).

---

## 4. Evaluation Approach

A dual-tier evaluation engine balances fast deterministic checks with semantic reasoning:

### Deterministic Structural Checks (`RuleBasedEvaluator`)
- Validates that sections meet minimum content thresholds before querying external APIs.
- Scans for essential OOP markers (classes, interfaces, access encapsulation, concurrency primitives).
- Short-circuits empty or unedited skeleton submissions to conserve resources.

### Rubric-Based LLM Evaluation (`LLMEvaluator` via `gemini-3.6-flash`)
- Uses Google's `gemini-3.6-flash` model constrained by a strict JSON schema (`responseSchema` in `@google/genai`).
- Evaluates architectural quality across 7 weighted rubric criteria:
  - Requirement Understanding (15%)
  - Class Responsibilities & Cohesion (20%)
  - Encapsulation & Interfaces (15%)
  - Relationships & Coupling (15%)
  - Extensibility & Trade-offs (15%)
  - Edge Cases & Testability (10%)
  - Explanation Quality (10%)

### Evidence-Grounded Feedback Model
Each feedback critique follows an **Evidence -> Concern -> Suggestion** format:
- *Evidence*: Cites extracted evidence text directly from the candidate's submission.
- *Concern*: Diagnoses the design smell or architectural risk.
- *Suggestion*: Provides concrete refactoring advice (e.g., "Extract fee calculation into a `PricingStrategy` interface").

---

## 5. Key Product & Engineering Decisions

1. **Structured Canvas over Free-form Text**: Guides candidates through the decomposition steps expected in real technical interviews and prevents incomplete submissions.
2. **Server-Side API Key Isolation**: All AI evaluations are executed inside Node.js backend middleware; API credentials are never bundled into client JavaScript.
3. **Upfront Persistence Pattern**: Submissions are stored immediately upon submission. If an API timeout or rate limit occurs, user work is preserved in state `Failed` for a 1-click retry.
4. **Evaluator Strategy Hierarchy**: Core domain services depend on an `Evaluator` abstraction rather than a specific commercial SDK, enabling offline mock testing and future multi-model support.
5. **Resilient Failure Recovery**: Implements a 60s timeout boundary and automatic exponential backoff retries on transient HTTP 503 / 429 service spikes.

---

## 6. Trade-offs & Limitations

- **In-Memory Storage**: Attempt history resets upon server restart. For an MVP, this avoids database setup friction while keeping persistence isolated behind a repository interface.
- **Textual Design Representation**: Focuses on structured textual design rather than visual class diagrams, prioritizing editing speed and evaluation accuracy.
- **LLM Phrasing Variance**: While rubric scoring weights remain mathematically calibrated, qualitative feedback phrasing can vary slightly between runs.
- **Prioritizing Feedback Depth over Platform Scale**: The prototype focuses on evaluation explainability, actionable critique, and domain design quality rather than distributed multi-tier deployment.

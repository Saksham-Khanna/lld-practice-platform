import os
import re
import subprocess

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Research Note: Low-Level Design Practice Platform</title>
<style>
  @page {
    size: A4 portrait;
    margin: 11mm 13mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    font-size: 8.8pt;
    line-height: 1.35;
    background: #ffffff;
  }
  .page {
    height: 273mm;
    max-height: 273mm;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .page-break {
    page-break-after: always;
    break-after: page;
  }
  .header {
    border-bottom: 1.5px solid #0f172a;
    padding-bottom: 5px;
    margin-bottom: 8px;
  }
  .header h1 {
    font-size: 15pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
  }
  .header .meta {
    font-size: 7.8pt;
    color: #475569;
    margin-top: 2px;
    display: flex;
    justify-content: space-between;
    font-weight: 500;
  }
  .section {
    margin-bottom: 7px;
  }
  .section-title {
    font-size: 9.8pt;
    font-weight: 700;
    color: #0f172a;
    border-left: 3px solid #0f172a;
    padding-left: 5px;
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .sub-title {
    font-size: 8.8pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 3px;
    margin-bottom: 1px;
  }
  p {
    margin-bottom: 3px;
    color: #334155;
  }
  ul {
    margin-left: 14px;
    margin-bottom: 3px;
  }
  li {
    margin-bottom: 2px;
    color: #334155;
  }
  li strong {
    color: #0f172a;
  }
  .loop-box {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 5px 8px;
    margin: 4px 0;
    text-align: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 8pt;
    font-weight: 600;
    color: #0f172a;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 5px 7px;
  }
  .rubric-table {
    width: 100%;
    border-collapse: collapse;
    margin: 4px 0;
    font-size: 8pt;
  }
  .rubric-table th {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    padding: 3px 5px;
    text-align: left;
    font-weight: 700;
    color: #0f172a;
  }
  .rubric-table td {
    border: 1px solid #e2e8f0;
    padding: 2.5px 5px;
    color: #334155;
  }
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
    font-size: 7.2pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page page-break">
  <div>
    <div class="header">
      <h1>Research Note: Low-Level Design (LLD) Practice Platform</h1>
      <div class="meta">
        <span>A Focused MVP for Repeatable, Rubric-Based Software Architecture Practice</span>
        <span>Evaluator Engine: Google Gemini 3.6 Flash</span>
      </div>
    </div>

    <!-- 1. Learner Problem -->
    <div class="section">
      <div class="section-title">1. Learner Problem &amp; Gaps</div>
      <p><strong>Target Learner:</strong> Software engineers preparing for Low-Level Design (LLD) and Object-Oriented Design (OOD) interviews, as well as developers transitioning from procedural/algorithmic code to modular, decoupled system architectures.</p>
      
      <div class="sub-title">Why LLD Practice Is Difficult</div>
      <p>Unlike algorithmic coding where deterministic test suites give instant pass/fail validation, LLD has no automated compiler for architectural quality. Multiple valid patterns can solve the same problem (e.g. State vs. Strategy). Learners struggle with identifying bloated "God classes", knowing when to favor composition over inheritance, and designing for concurrency race conditions on shared state.</p>
      
      <div class="sub-title">Gaps in Existing Approaches</div>
      <ul>
        <li><strong>Static Books &amp; Video Courses (e.g., Grokking LLD):</strong> Present single passive reference solutions. They show one author's design, but cannot evaluate a learner's own attempt or diagnose their specific architectural trade-offs.</li>
        <li><strong>Peer Mock Interviews (e.g., Pramp):</strong> Difficult to schedule repeatedly, expensive, and subject to high interviewer variance and subjective bias.</li>
        <li><strong>Generic AI Chatbots (ChatGPT / Claude):</strong> When prompted freely, they provide superficial praise, miss missing concurrency locks, and lack a calibrated grading rubric for consistent assessment.</li>
      </ul>
    </div>

    <!-- 2. Product Direction & Core Loop -->
    <div class="section">
      <div class="section-title">2. Product Direction &amp; Core Learner Loop</div>
      <p><strong>Product Vision:</strong> Build a focused practice platform providing immediate, rubric-based, evidence-grounded evaluation on user-authored designs, enabling deliberate practice and measurable improvement.</p>
      
      <div class="loop-box">
        Choose Problem &rarr; Think / Design &rarr; Submit &rarr; Get Feedback &rarr; Review &rarr; Try Again
      </div>
      <p>The platform emphasizes rapid iteration: learners inspect actionable critiques, refactor their entity responsibilities or relationships in the workspace, and resubmit to measure score improvement.</p>
    </div>

    <!-- 3. MVP Scope -->
    <div class="section">
      <div class="section-title">3. MVP Scope &amp; System Boundaries</div>
      
      <div class="grid-2">
        <div class="card">
          <div class="sub-title" style="margin-top:0;">Curated Problem Set (4 Scenarios)</div>
          <ul>
            <li><strong>Parking Lot (Medium):</strong> Strategy pattern for fee calculation; concurrency locks on spot allocation.</li>
            <li><strong>Elevator System (Hard):</strong> State pattern for cabin states; scheduling algorithms and dispatch queues.</li>
            <li><strong>Vending Machine (Easy):</strong> State machine transitions and inventory encapsulation.</li>
            <li><strong>Library System (Medium):</strong> Entity relationships, member rules, and fine calculation.</li>
          </ul>
        </div>
        <div class="card">
          <div class="sub-title" style="margin-top:0;">Structured 6-Section Canvas</div>
          <ul>
            <li>Requirements &amp; Assumptions</li>
            <li>Core Classes &amp; Interfaces</li>
            <li>Class Responsibilities (SRP &amp; Cohesion)</li>
            <li>Relationships (Composition vs. Inheritance)</li>
            <li>Design Decisions &amp; Trade-offs</li>
            <li>Edge Cases &amp; Concurrency</li>
          </ul>
        </div>
      </div>

      <div class="sub-title" style="margin-top:5px;">Explicit MVP Non-Goals (Out of Scope)</div>
      <p>Large-scale High-Level Design (Kubernetes, sharding, distributed caches, CDN), user authentication / LMS overhead, and compiled code execution sandboxes. The focus is strictly on architectural reasoning and OOP decomposition.</p>
    </div>
  </div>

  <div class="footer">
    <span>Arena LLD Practice Platform &mdash; Research Note</span>
    <span>Page 1 of 2</span>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div>
    <!-- 4. Evaluation Approach -->
    <div class="section">
      <div class="section-title">4. Evaluation Approach</div>
      <p>A hybrid dual-tier engine balances fast deterministic structural validation with deep semantic reasoning:</p>
      
      <ul>
        <li><strong>Deterministic Checks (RuleBasedEvaluator):</strong> Validates section completeness before invoking AI, checks for class/interface declarations and concurrency primitives, and short-circuits empty submissions to conserve resources.</li>
        <li><strong>Rubric-Based Evaluation (LLMEvaluator via gemini-3.6-flash):</strong> Evaluates architectural quality against a strict JSON schema (<code>responseSchema</code> in <code>@google/genai</code>) across 7 weighted criteria:</li>
      </ul>

      <table class="rubric-table">
        <thead>
          <tr>
            <th>Rubric Criterion</th>
            <th>Weight</th>
            <th>Core Architectural Focus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Requirement Understanding</td>
            <td>15%</td>
            <td>Functional completeness, domain entity representation, constraint adherence</td>
          </tr>
          <tr>
            <td>Class Responsibilities &amp; Cohesion</td>
            <td>20%</td>
            <td>Single Responsibility Principle (SRP), avoidance of God classes</td>
          </tr>
          <tr>
            <td>Encapsulation &amp; Interfaces</td>
            <td>15%</td>
            <td>Information hiding, interface segregation, access modifiers</td>
          </tr>
          <tr>
            <td>Relationships &amp; Coupling</td>
            <td>15%</td>
            <td>Composition over inheritance, loose coupling, dependency injection</td>
          </tr>
          <tr>
            <td>Extensibility &amp; Trade-offs</td>
            <td>15%</td>
            <td>Open/Closed Principle (OCP), design pattern applicability (Strategy, State)</td>
          </tr>
          <tr>
            <td>Edge Cases &amp; Testability</td>
            <td>10%</td>
            <td>Concurrency, thread safety, race conditions, unit test isolation</td>
          </tr>
          <tr>
            <td>Explanation Quality</td>
            <td>10%</td>
            <td>Coherence, technical precision, and architectural reasoning clarity</td>
          </tr>
        </tbody>
      </table>

      <p><strong>Feedback Model (Evidence &rarr; Concern &rarr; Suggestion):</strong> Every critique quotes extracted evidence text directly from the candidate's submission, explains the architectural concern, and provides concrete refactoring guidance.</p>
    </div>

    <!-- 5. Key Product & Engineering Decisions -->
    <div class="section">
      <div class="section-title">5. Key Product &amp; Engineering Decisions</div>
      <ul>
        <li><strong>Structured Canvas over Free-form Text:</strong> Enforces the systematic 6-step decomposition expected in technical interviews and prevents incomplete or unstructured submissions.</li>
        <li><strong>Server-Side API Key Isolation:</strong> All Gemini API calls are executed strictly inside Node.js Vite server middleware (<code>/api/*</code>). <code>GEMINI_API_KEY</code> is never bundled or leaked to client JavaScript.</li>
        <li><strong>Upfront Persistence Pattern:</strong> Submissions are saved immediately upon clicking submit. If an API timeout or network drop occurs, the candidate's work is preserved in state <code>Failed</code> for 1-click retry.</li>
        <li><strong>Evaluator Strategy Hierarchy:</strong> <code>PracticeService</code> depends on an <code>Evaluator</code> interface rather than a concrete SDK, enabling sub-second offline unit testing with mocks and future multi-model extensibility.</li>
        <li><strong>Resilient Recovery:</strong> Employs a 60s timeout boundary and automatic exponential backoff retries for transient Google API HTTP 503 / 429 traffic spikes.</li>
      </ul>
    </div>

    <!-- 6. Trade-offs & Limitations -->
    <div class="section">
      <div class="section-title">6. Trade-offs &amp; Limitations</div>
      <ul>
        <li><strong>In-Memory Storage:</strong> Attempt history resets upon server restart. For an MVP prototype, this avoids database setup friction while keeping storage isolated behind a repository interface (<code>PracticeStore</code>).</li>
        <li><strong>Textual Representation over UML:</strong> Lacks visual class diagramming, but structured text is significantly faster to draft, edit, and evaluate reliably with an LLM.</li>
        <li><strong>LLM Score &amp; Phrasing Variance:</strong> Rubric weights remain fixed, while qualitative feedback and individual scores may vary slightly across runs.</li>
        <li><strong>Prioritizing Feedback Depth over Platform Scale:</strong> The prototype focuses on evaluation explainability, actionable critique, and domain design quality rather than distributed multi-tier deployment.</li>
      </ul>
    </div>
  </div>

  <div class="footer">
    <span>Arena LLD Practice Platform &mdash; Research Note</span>
    <span>Page 2 of 2</span>
  </div>
</div>

</body>
</html>
"""

html_path = "d:\\arena-lld-practice-platform\\research_note_print.html"
pdf_path = "d:\\arena-lld-practice-platform\\RESEARCH_NOTE.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_exe,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Running Chrome headless print to PDF...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)

if os.path.exists(pdf_path):
    with open(pdf_path, "rb") as f:
        data = f.read()
    page_count = len(re.findall(rb'/Type\s*/Page\b', data))
    print(f"SUCCESS: Generated {pdf_path} with {page_count} pages! File size: {len(data)} bytes")
else:
    print("ERROR: PDF was not generated")

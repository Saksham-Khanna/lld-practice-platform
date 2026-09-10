import { Evaluator, EvaluationContext, EvaluationResult } from './Evaluator';
import { RubricScores, FeedbackItem } from '../../types/lld';

export class RuleBasedEvaluator implements Evaluator {
  readonly name = 'RuleBasedEvaluator';

  async evaluate(context: EvaluationContext): Promise<EvaluationResult> {
    const { submission } = context;
    const content = submission.content;

    const feedback: FeedbackItem[] = [];
    const strengths: string[] = [];

    // 1. Evaluate Requirements Understanding
    const reqText = content.requirements?.trim() || '';
    let reqScore = 50;
    if (reqText.length === 0) {
      reqScore = 15;
      feedback.push({
        criterion: 'Requirement Understanding',
        score: 15,
        evidence: 'The Requirements & Assumptions section was left completely empty.',
        concern: 'Missing understanding of functional constraints and scope boundary.',
        suggestion: 'List all functional requirements from the problem and state explicit assumptions regarding concurrency, capacity, or scale.',
        confidence: 0.95,
      });
    } else if (reqText.length < 50) {
      reqScore = 45;
      feedback.push({
        criterion: 'Requirement Understanding',
        score: 45,
        evidence: `Requirements text is very brief (${reqText.length} characters).`,
        concern: 'May miss subtle requirements or unspoken assumptions.',
        suggestion: 'Elaborate on core user journeys, data flow, and key assumptions.',
        confidence: 0.85,
      });
    } else {
      reqScore = Math.min(95, 70 + Math.min(25, Math.floor(reqText.length / 10)));
      strengths.push('Articulated clear requirements and assumptions.');
    }

    // 2. Evaluate Class Responsibilities
    const classesText = content.classes?.trim() || '';
    const respText = content.responsibilities?.trim() || '';
    const classMatches = classesText.match(/\b(class|interface|enum|abstract\s+class)\s+([A-Z][A-Za-z0-9_]*)/gi) || [];
    const detectedClasses = Array.from(new Set(classMatches.map(m => m.replace(/^(class|interface|enum|abstract\s+class)\s+/i, '').trim())));

    let classScore = 50;
    if (classesText.length === 0) {
      classScore = 10;
      feedback.push({
        criterion: 'Class Responsibilities',
        score: 10,
        evidence: 'No classes or interfaces were defined.',
        concern: 'Core object model is missing.',
        suggestion: 'Define distinct domain entities (e.g. models, managers, strategies) and outline their attributes and methods.',
        confidence: 1.0,
      });
    } else if (detectedClasses.length < 2) {
      classScore = 40;
      feedback.push({
        criterion: 'Class Responsibilities',
        score: 40,
        evidence: `Only ${detectedClasses.length} distinct classes/interfaces detected.`,
        concern: 'Risk of God Object anti-pattern or under-decomposed domain logic.',
        suggestion: 'Separate domain models, coordinator services, and strategies into distinct cohesive classes.',
        confidence: 0.8,
      });
    } else {
      classScore = Math.min(95, 60 + detectedClasses.length * 6);
      strengths.push(`Identified ${detectedClasses.length} distinct domain entities (${detectedClasses.slice(0, 4).join(', ')}).`);
    }

    // 3. Encapsulation & Interfaces
    const hasInterfaces = /\b(interface|implements|abstract)\b/i.test(classesText) || /\b(interface|abstract)\b/i.test(respText);
    const hasAccessModifiers = /\b(private|protected|public)\b/i.test(classesText);
    let encapScore = 50;
    if (hasInterfaces && hasAccessModifiers) {
      encapScore = 88;
      strengths.push('Employed interface abstractions and proper access encapsulation.');
    } else if (hasInterfaces) {
      encapScore = 80;
      strengths.push('Defined interface abstractions to separate contract from implementation.');
    } else {
      encapScore = 50;
      feedback.push({
        criterion: 'Encapsulation & Interfaces',
        score: 50,
        evidence: 'No explicit interfaces or abstract classes were declared.',
        concern: 'Direct coupling to concrete implementations makes testing and swapping implementations difficult.',
        suggestion: 'Introduce interfaces for components that have multiple strategies or external dependencies.',
        confidence: 0.85,
      });
    }

    // 4. Relationships & Coupling
    const relText = content.relationships?.trim() || '';
    const hasRelationKeywords = /\b(composition|aggregation|inheritance|has-a|is-a|implements|extends|associat|depends\s+on)\b/i.test(relText);
    let relScore = 50;
    if (relText.length === 0) {
      relScore = 20;
      feedback.push({
        criterion: 'Relationships & Coupling',
        score: 20,
        evidence: 'The Relationships section was left blank.',
        concern: 'Class coupling and structural interactions are unspecified.',
        suggestion: 'Specify HAS-A (composition/aggregation) vs IS-A (inheritance) relationships between entities.',
        confidence: 0.95,
      });
    } else if (!hasRelationKeywords) {
      relScore = 55;
      feedback.push({
        criterion: 'Relationships & Coupling',
        score: 55,
        evidence: 'Relationships are described without standard OOP relationship terminology.',
        concern: 'Ambiguity about ownership and lifecycle of related objects.',
        suggestion: 'Clarify whether relationships are composition (lifecycle bound) or aggregation/association (shared references).',
        confidence: 0.75,
      });
    } else {
      relScore = Math.min(95, 75 + Math.min(20, Math.floor(relText.length / 15)));
      strengths.push('Documented structural relationships between entities.');
    }

    // 5. Extensibility & Trade-offs
    const decText = content.decisions?.trim() || '';
    const hasPattern = /\b(pattern|factory|strategy|observer|state|singleton|adapter|decorator|command)\b/i.test(decText) || /\b(pattern|strategy|observer|state)\b/i.test(classesText);
    let extScore = 50;
    if (decText.length === 0) {
      extScore = 25;
      feedback.push({
        criterion: 'Extensibility & Trade-offs',
        score: 25,
        evidence: 'No design decisions or trade-offs were documented.',
        concern: 'Inability to judge why specific design choices were made over alternatives.',
        suggestion: 'Discuss alternative designs considered and explain why the selected architecture was chosen.',
        confidence: 0.9,
      });
    } else {
      extScore = Math.min(95, 70 + (hasPattern ? 18 : 8));
      if (hasPattern) {
        strengths.push('Leveraged standard object-oriented design patterns to support extensibility.');
      }
    }

    // 6. Edge Cases & Testability
    const edgeText = content.edgeCases?.trim() || '';
    const hasConcurrency = /\b(concurren|thread|lock|mutex|race\s+condition|atomic|synchronized)\b/i.test(edgeText);
    let edgeScore = 50;
    if (edgeText.length === 0) {
      edgeScore = 20;
      feedback.push({
        criterion: 'Edge Cases & Testability',
        score: 20,
        evidence: 'No edge cases or boundary conditions were listed.',
        concern: 'System may fail under concurrent access, boundary limits, or invalid inputs.',
        suggestion: 'Identify failure modes: concurrent updates, resource exhaustion, invalid parameters, and mockability for unit tests.',
        confidence: 0.95,
      });
    } else {
      edgeScore = Math.min(95, 68 + (hasConcurrency ? 20 : 10));
      if (hasConcurrency) {
        strengths.push('Considered concurrency and thread safety under edge conditions.');
      }
    }

    // 7. Explanation Quality
    const totalLength = reqText.length + classesText.length + respText.length + relText.length + decText.length + edgeText.length;
    let expScore = 50;
    if (totalLength < 100) {
      expScore = 30;
    } else if (totalLength < 300) {
      expScore = 65;
    } else {
      expScore = Math.min(95, 75 + Math.min(20, Math.floor((totalLength - 300) / 40)));
    }

    const rubricScores: RubricScores = {
      requirementUnderstanding: reqScore,
      classResponsibilities: classScore,
      encapsulationInterfaces: encapScore,
      relationshipsCoupling: relScore,
      extensibilityTradeoffs: extScore,
      edgeCasesTestability: edgeScore,
      explanationQuality: expScore,
      // Compatibility aliases
      couplingCohesion: relScore,
      abstractionPatterns: Math.round((encapScore + extScore) / 2),
      extensibility: extScore,
    };

    const overallScore = Math.round(
      reqScore * 0.15 +
      classScore * 0.20 +
      encapScore * 0.15 +
      relScore * 0.15 +
      extScore * 0.15 +
      edgeScore * 0.10 +
      expScore * 0.10
    );

    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      rubricScores,
      strengths: strengths.length > 0 ? strengths : ['Basic attempt structure provided.'],
      feedback,
      evaluatorType: 'rule-based',
      evaluatedAt: new Date().toISOString(),
    };
  }
}

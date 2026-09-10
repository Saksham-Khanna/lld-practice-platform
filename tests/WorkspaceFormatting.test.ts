import { describe, it, expect } from 'vitest';
import { LLMEvaluator } from '../src/core/evaluator/LLMEvaluator';

describe('Workspace Formatting & List Continuation Logic', () => {
  function simulateListContinuation(value: string, cursorPos: number) {
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const currentLineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
    const currentLine = textBeforeCursor.substring(currentLineStart);

    const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s*(.*)$/);
    const bulletMatch = currentLine.match(/^(\s*)([-*])\s*(.*)$/);

    if (numberedMatch) {
      const indent = numberedMatch[1];
      const currentNum = parseInt(numberedMatch[2], 10);
      const itemContent = numberedMatch[3];

      if (itemContent.trim() === '') {
        const newValue = value.substring(0, currentLineStart) + value.substring(cursorPos);
        return { newValue, newCursor: currentLineStart, action: 'exit' };
      } else {
        const nextPrefix = `\n${indent}${currentNum + 1}. `;
        const textAfterCursor = value.substring(cursorPos);
        const newValue = textBeforeCursor + nextPrefix + textAfterCursor;
        return { newValue, newCursor: cursorPos + nextPrefix.length, action: 'continue' };
      }
    }

    if (bulletMatch) {
      const indent = bulletMatch[1];
      const bulletChar = bulletMatch[2];
      const itemContent = bulletMatch[3];

      if (itemContent.trim() === '') {
        const newValue = value.substring(0, currentLineStart) + value.substring(cursorPos);
        return { newValue, newCursor: currentLineStart, action: 'exit' };
      } else {
        const nextPrefix = `\n${indent}${bulletChar} `;
        const textAfterCursor = value.substring(cursorPos);
        const newValue = textBeforeCursor + nextPrefix + textAfterCursor;
        return { newValue, newCursor: cursorPos + nextPrefix.length, action: 'continue' };
      }
    }

    return null;
  }

  it('automatically continues numbered lists on pressing Enter', () => {
    const input = '1. Core functional requirement: Multi-floor parking';
    const result = simulateListContinuation(input, input.length);

    expect(result).not.toBeNull();
    expect(result?.action).toBe('continue');
    expect(result?.newValue).toBe('1. Core functional requirement: Multi-floor parking\n2. ');
    expect(result?.newCursor).toBe('1. Core functional requirement: Multi-floor parking\n2. '.length);
  });

  it('advances from item 2 to item 3', () => {
    const input = '1. Step one\n2. Step two';
    const result = simulateListContinuation(input, input.length);

    expect(result).not.toBeNull();
    expect(result?.action).toBe('continue');
    expect(result?.newValue).toBe('1. Step one\n2. Step two\n3. ');
  });

  it('exits numbered list when pressing Enter on an empty item', () => {
    const input = '1. Step one\n2. ';
    const result = simulateListContinuation(input, input.length);

    expect(result).not.toBeNull();
    expect(result?.action).toBe('exit');
    expect(result?.newValue).toBe('1. Step one\n');
  });

  it('automatically continues bullet lists on pressing Enter', () => {
    const input = '- First bullet item';
    const result = simulateListContinuation(input, input.length);

    expect(result).not.toBeNull();
    expect(result?.action).toBe('continue');
    expect(result?.newValue).toBe('- First bullet item\n- ');
  });

  it('exits bullet list when pressing Enter on an empty bullet item', () => {
    const input = '- First bullet item\n- ';
    const result = simulateListContinuation(input, input.length);

    expect(result).not.toBeNull();
    expect(result?.action).toBe('exit');
    expect(result?.newValue).toBe('- First bullet item\n');
  });

  it('LLMEvaluator defaults to 60000ms timeout when not explicitly specified', () => {
    const evaluator = new LLMEvaluator();
    // Verify evaluator timeout property is initialized to 60000
    expect((evaluator as any).timeoutMs).toBe(60000);
  });
});

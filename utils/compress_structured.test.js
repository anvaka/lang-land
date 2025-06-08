/**
 * Tests for compress_structured.js
 * 
 * This test suite covers the markdown conversion functions
 * without relying on file I/O operations.
 */

import { describe, test, expect } from 'vitest';
import { convertToMarkdown, compressFlashcardsData } from './compress_structured.js';

describe('convertToMarkdown', () => {
  test('converts structured data to markdown format', () => {
    const word = '爱';
    const data = {
      pinyin: 'ài',
      english: 'Love',
      characterBreakdown: [
        '- 爱 (ài): Top: 爫 (zhǎo, "claw"); Middle: 冖 (mì, "cover") and 心 (xīn, "heart", here stylized at the bottom). The components together can hint at "a hand covering a heart," symbolizing love or care.'
      ],
      examples: [
        '- 我爱你。(Wǒ ài nǐ.) - I love you.',
        '- 她爱唱歌。(Tā ài chànggē.) - She loves singing.',
        '- 爱是一种力量。(Ài shì yī zhǒng lìliàng.) - Love is a kind of strength.'
      ],
      usageNotes: [
        '- 爱 (ài) is both a noun ("love") and a verb ("to love").',
        '- Less commonly used to express romantic love in daily Chinese; often replaced by 喜欢 (xǐhuān) for less intense affection.',
        '- Used for family, hobbies, and actions.'
      ],
      memoryAids: [
        '- Imagine a "hand/claw" (爫 zhǎo) gently protecting a "heart" (心 xīn) as a symbol of love (爱 ài).',
        '- 爱 (ài) sounds like "eye", reminding you to "see" with love.'
      ]
    };

    const expected = '# **爱 (ài) - Love**\n\n' +
      '**Character Breakdown**:  \n' +
      '- 爱 (ài): Top: 爫 (zhǎo, "claw"); Middle: 冖 (mì, "cover") and 心 (xīn, "heart", here stylized at the bottom). The components together can hint at "a hand covering a heart," symbolizing love or care.\n\n' +
      '**Examples**:  \n' +
      '- 我爱你。(Wǒ ài nǐ.) - I love you.  \n' +
      '- 她爱唱歌。(Tā ài chànggē.) - She loves singing.  \n' +
      '- 爱是一种力量。(Ài shì yī zhǒng lìliàng.) - Love is a kind of strength.\n\n' +
      '**Usage Notes**:  \n' +
      '- 爱 (ài) is both a noun ("love") and a verb ("to love").  \n' +
      '- Less commonly used to express romantic love in daily Chinese; often replaced by 喜欢 (xǐhuān) for less intense affection.  \n' +
      '- Used for family, hobbies, and actions.\n\n' +
      '**Memory Aids**:  \n' +
      '- Imagine a "hand/claw" (爫 zhǎo) gently protecting a "heart" (心 xīn) as a symbol of love (爱 ài).  \n' +
      '- 爱 (ài) sounds like "eye", reminding you to "see" with love.';

    expect(convertToMarkdown(word, data)).toBe(expected);
  });

  test('handles missing sections', () => {
    const word = '测试';
    const data = {
      pinyin: 'cèshì',
      english: 'Test',
      examples: ['- This is a test example.'],
      // Missing characterBreakdown, usageNotes, and memoryAids
    };

    const expected = '# **测试 (cèshì) - Test**\n\n' +
      '**Examples**:  \n' +
      '- This is a test example.\n\n';

    expect(convertToMarkdown(word, data)).toBe(expected);
  });
});

describe('compressFlashcardsData', () => {
  test('compresses multiple flashcard entries', () => {
    const structuredData = {
      '爱': {
        pinyin: 'ài',
        english: 'Love',
        characterBreakdown: ['- Character breakdown info'],
        examples: ['- Example 1'],
        usageNotes: ['- Usage note 1'],
        memoryAids: ['- Memory aid 1']
      },
      '测试': {
        pinyin: 'cèshì',
        english: 'Test',
        examples: ['- Test example']
      }
    };

    const result = compressFlashcardsData(structuredData);
    
    // Check properties exist
    expect(result).toHaveProperty('爱');
    expect(result).toHaveProperty('测试');
    
    // Check content format 
    expect(result['爱']).includes('# **爱 (ài) - Love**');
    expect(result['爱']).includes('**Character Breakdown**:');
    expect(result['测试']).includes('# **测试 (cèshì) - Test**');
    expect(result['测试']).not.includes('**Character Breakdown**:');
  });
});

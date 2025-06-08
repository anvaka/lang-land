/**
 * Tests for restructure_flashcards.js
 * 
 * This test suite covers all the extraction and processing functions
 * without relying on file I/O operations.
 */

import { describe, test, expect } from 'vitest';
import {
  extractTitleInfo,
  extractCharacterBreakdown,
  extractExamples,
  extractUsageNotes,
  extractMemoryAids,
  updateCharacterReferences,
  processFlashcardsData
} from './restructure_flashcards.js';

// Test data samples
const mockFlashcardContent = `# **火柴 (huǒchái)** - Match (for lighting fire)

**Character Breakdown**:
- **火 (huǒ)**: Fire, flame. The radical suggests heat and burning.
- **柴 (chái)**: Firewood, kindling. The wood radical (木) with grass (艹) indicates combustible material.

**Examples**:
- 我需要火柴点蜡烛。(Wǒ xūyào huǒchái diǎn làzhú.) - I need matches to light the candle.
- 火柴盒在桌子上。(Huǒchái hé zài zhuōzi shang.) - The matchbox is on the table.

**Usage Notes**:
- Commonly used in daily life
- Can refer to both the individual match and matches collectively

**Memory Aids**:
- Think of "fire" + "wood" = the tool to make fire from wood
- Picture a match igniting firewood`;

const mockFlashcardWithMissingSection = `# **水 (shuǐ)** - Water

**Examples**:
- 我想喝水。(Wǒ xiǎng hē shuǐ.) - I want to drink water.

**Memory Aids**:
- The character looks like flowing water`;

const mockFlashcardMinimal = `# **好 (hǎo)** - Good`;

const mockFlashcardLove = `# **爱 (ài)** - Love

**Character Breakdown**:  
- 爱 (ài): Top: 爫 (zhǎo, "claw"); Middle: 冖 (mì, "cover") and 心 (xīn, "heart", here stylized at the bottom). The components together can hint at "a hand covering a heart," symbolizing love or care.

**Examples**:  
- 我爱你。(Wǒ ài nǐ.) - I love you.  
- 她爱唱歌。(Tā ài chànggē.) - She loves singing.  
- 爱是一种力量。(Ài shì yī zhǒng lìliàng.) - Love is a kind of strength.

**Usage Notes**:  
- 爱 (ài) is both a noun ("love") and a verb ("to love").  
- Less commonly used to express romantic love in daily Chinese; often replaced by 喜欢 (xǐhuān) for less intense affection.  
- Used for family, hobbies, and actions.

**Memory Aids**:  
- Imagine a "hand/claw" (爫 zhǎo) gently protecting a "heart" (心 xīn) as a symbol of love (爱 ài).  
- 爱 (ài) sounds like "eye", reminding you to "see" with love.`;

const mockComplexFlashcard = `# **不安 (bù'ān)** - Uneasy, restless, anxious

**Character Breakdown**:
- **不 (bù)**: Not, negative prefix
- **安 (ān)**: Peace, calm, secure

**Examples**:
- 他心里很不安。(Tā xīnli hěn bù'ān.) - He feels very uneasy in his heart.
- 这个消息让我感到不安。(Zhège xiāoxi ràng wǒ gǎndào bù'ān.) - This news makes me feel anxious.
- 不安的情绪影响了他的工作。(Bù'ān de qíngxù yǐngxiǎngle tā de gōngzuò.) - Restless emotions affected his work.

**Usage Notes**:
- Often describes emotional or psychological states
- Can be used as an adjective or noun
- More formal than colloquial alternatives

**Memory Aids**:
- "不" (not) + "安" (peace) = not peaceful, hence anxious
- Picture someone pacing restlessly, unable to find peace`;

describe('extractTitleInfo', () => {
  test('can extract pinyin and English: case 0', () => {
    const result = extractTitleInfo(`# **亲爱** (qīn’ài) - Dear; beloved\n\n**Character Breakdown**:  `);
    expect(result.pinyin).toBe('qīn’ài');
    expect(result.english).toBe('Dear; beloved');
  });

  test('can extract pinyin and English: case 1', () => {
    const result = extractTitleInfo(`# **爱 (ài) - Love**\n\n**Character Breakdown**:  \n- 爱 (ài): Top: 爫 (zhǎo, \"claw\"); Middle: 冖 (mì, \"cover\") and 心 (xīn, \"heart\", here stylized at the bottom). The components together can hint at \"a hand covering a heart,\" symbolizing love or care.\n\n**Examples**:  \n- 我爱你。(Wǒ ài nǐ.) - I love you.  \n- 她爱唱歌。(Tā ài chànggē.) - She loves singing.  \n- 爱是一种力量。(Ài shì yī zhǒng lìliàng.) - Love is a kind of strength.\n\n**Usage Notes**:  \n- 爱 (ài) is both a noun (\"love\") and a verb (\"to love\").  \n- Less commonly used to express romantic love in daily Chinese; often replaced by 喜欢 (xǐhuān) for less intense affection.  \n- Used for family, hobbies, and actions.\n\n**Memory Aids**:  \n- Imagine a \"hand/claw\" (爫 zhǎo) gently protecting a \"heart\" (心 xīn) as a symbol of love (爱 ài).  \n- 爱 (ài) sounds like \"eye\", reminding you to \"see\" with love.`);
    expect(result.pinyin).toBe('ài');
    expect(result.english).toBe('Love');
  });

  test('can extract pinyin and English: case 2', () => {
    const result = extractTitleInfo(`# **征求 (zhēng qiú)** – to seek; to solicit; to ask for\n\n**Character Breakdown**:  `);
    expect(result.pinyin).toBe('zhēng qiú');
    expect(result.english).toBe('to seek; to solicit; to ask for');
  });

  test('can extract pinyin and English: case 3', () => {
    const result = extractTitleInfo(`# **却(què) - but; yet; however**\n\n**Character Breakdown**:  `);
    expect(result.pinyin).toBe('què');
    expect(result.english).toBe('but; yet; however');
  });

  test('can extract pinyin and English: case 4', () => {
    const result = extractTitleInfo(`# **写(xiě)** - to write\n\n**Character Breakdown**:  `);
    expect(result.pinyin).toBe('xiě');
    expect(result.english).toBe('to write');
  });

  test('should extract title info from standard format', () => {
    const result = extractTitleInfo(mockFlashcardContent);
    expect(result.pinyin).toBe('huǒchái');
    expect(result.english).toBe('Match (for lighting fire)');
  });

  test('should extract title info from complex title', () => {
    const result = extractTitleInfo(mockComplexFlashcard);
    expect(result.pinyin).toBe("bù'ān");
    expect(result.english).toBe('Uneasy, restless, anxious');
  });

  test('should extract title info from minimal format', () => {
    const result = extractTitleInfo(mockFlashcardMinimal);
    expect(result.pinyin).toBe('hǎo');
    expect(result.english).toBe('Good');
  });

  test('should return empty strings for invalid format', () => {
    const result = extractTitleInfo('Invalid format');
    expect(result.pinyin).toBe('');
    expect(result.english).toBe('');
  });

  test('should extract title info from love character', () => {
    const result = extractTitleInfo(mockFlashcardLove);
    expect(result.pinyin).toBe('ài');
    expect(result.english).toBe('Love');
  });
});

describe('extractCharacterBreakdown', () => {
  test('should extract character breakdown from standard format', () => {
    const result = extractCharacterBreakdown(mockFlashcardContent);
    const expected = [
      '- **火 (huǒ)**: Fire, flame. The radical suggests heat and burning.',
      '- **柴 (chái)**: Firewood, kindling. The wood radical (木) with grass (艹) indicates combustible material.'
    ];
    expect(result).toEqual(expected);
  });

  test('should extract character breakdown from complex format', () => {
    const result = extractCharacterBreakdown(mockComplexFlashcard);
    const expected = [
      '- **不 (bù)**: Not, negative prefix',
      '- **安 (ān)**: Peace, calm, secure'
    ];
    expect(result).toEqual(expected);
  });

  test('should return empty array when section is missing', () => {
    const result = extractCharacterBreakdown(mockFlashcardWithMissingSection);
    expect(result).toEqual([]);
  });

  test('should extract character breakdown from love character', () => {
    const result = extractCharacterBreakdown(mockFlashcardLove);
    const expected = [
      '- 爱 (ài): Top: 爫 (zhǎo, "claw"); Middle: 冖 (mì, "cover") and 心 (xīn, "heart", here stylized at the bottom). The components together can hint at "a hand covering a heart," symbolizing love or care.'
    ];
    expect(result).toEqual(expected);
  });

  test('should extract multiple character breakdowns in multiline format', () => {
    const result = extractCharacterBreakdown(`# **爱惜 (ài xī)** - to cherish; to treasure\n\n**Character Breakdown**:  \n- **爱 (ài)**: \"love, care.\"  \n  - top: 爫 (zhǎo) \"claw\"  \n  - middle: 冖 (mì) \"cover\"  \n  - inside: 心 (xīn) \"heart\"  \n- **惜 (xī)**: \"cherish, value.\"  \n  - Left: 忄(xīn) \"heart\" radical  \n  - Right: 昔 (xī) \"in the past; former times\"  \n\n**Examples**:  \n- 我们要爱惜(ài xī)水资源。(Wǒmen yào àixī shuǐ zīyuán.) - We must cherish water resources.  \n- 她很爱惜(ài xī)自己的时间。(Tā hěn àixī zìjǐ de shíjiān.) - She treasures her own time.  \n- 请爱惜(ài xī)公共设施。(Qǐng àixī gōnggòng shèshī.) - Please take care of public facilities.\n\n**Usage Notes**:  \n- 爱惜(ài xī) is often used for precious or limited things (resources, time, possessions).  \n- Often appears in formal or written contexts.\n\n**Memory Aids**:  \n- \"Love (爱(ài)) + cherish (惜(xī)) = Treasuring with your heart (心(xīn)), both characters have heart components!\"`);
    const expected = [
      "- **爱 (ài)**: \"love, care.\"\n  - top: 爫 (zhǎo) \"claw\"\n  - middle: 冖 (mì) \"cover\"\n  - inside: 心 (xīn) \"heart\"",
      "- **惜 (xī)**: \"cherish, value.\"\n  - Left: 忄(xīn) \"heart\" radical\n  - Right: 昔 (xī) \"in the past; former times\""
    ]
    expect(result).toEqual(expected);

    let test0 = extractCharacterBreakdown(`# **各 (gè)** - each; every\n\n**Character Breakdown**:   \n各 (gè) is composed of 夂 (zhǐ) on the bottom, which means \"to go,\" and 口 (kǒu) on the top, meaning \"mouth.\" The combination suggests “every mouth/person goes,\" hinting at the meaning \"each/every.\"\n\n**Examples**:  \n- 各位 (gè wèi) - everyone; all of you  \n- 各国 (gè guó) - each country  \n- 各有千秋 (gè yǒu qiān qiū) - each has its own merits\n\n**Usage Notes**:  \n各 (gè) is used before measure words or nouns to indicate “each” or “every.” Often combined as 各自 (gè zì, each/one’s own).\n\n**Memory Aids**:  \nThink: \"each\" (各 gè) person (口 kǒu, mouth) goes (夂 zhǐ, to go) their own way—so, “each.”`);
    const expected0 = [
      '各 (gè) is composed of 夂 (zhǐ) on the bottom, which means "to go," and 口 (kǒu) on the top, meaning "mouth." The combination suggests “every mouth/person goes," hinting at the meaning "each/every."'
    ];
    expect(test0).toEqual(expected0);

    const test1 = extractCharacterBreakdown(`# **友好 (yǒuhǎo) - Friendly**\n\n**Character Breakdown:**  \n- 友 (yǒu): \"friend.\" Left-right structure. Left is 又 (yòu, \"again\"), right is a variant of hand, hinting at repetition or companionship.\n- 好 (hǎo): \"good.\" Left-right structure. Left is 女 (nǚ, \"woman\"), right is 子 (zǐ, \"child\"). Together, conveys \"good\" or \"well-being.\"\n\n**Examples:**\n- 他们是很友好的人。(Tāmen shì hěn yǒuhǎo de rén.) - They are very friendly people.\n- 中国和加拿大关系友好。(Zhōngguó hé Jiānádà guānxì yǒuhǎo.) - China and Canada have friendly relations.\n- 她对同事非常友好。(Tā duì tóngshì fēicháng yǒuhǎo.) - She is very friendly to her colleagues.\n\n**Usage Notes:**  \n友好 (yǒuhǎo) is an adjective, often describing people, actions, or relationships. Common in both personal and international contexts.\n\n**Memory Aids:**  \n\"Make a *friend* (友 yǒu) to have a *good* (好 hǎo) time—友好 (yǒuhǎo) means *friendly*!\"`);
    const expected1 = ["- 友 (yǒu): \"friend.\" Left-right structure. Left is 又 (yòu, \"again\"), right is a variant of hand, hinting at repetition or companionship.","- 好 (hǎo): \"good.\" Left-right structure. Left is 女 (nǚ, \"woman\"), right is 子 (zǐ, \"child\"). Together, conveys \"good\" or \"well-being.\""];
    expect(test1).toEqual(expected1);

    const test2 = extractCharacterBreakdown(`# **她** (tā) - she, her\n\n**Character Breakdown**:  \n- 她 (tā):  \n  - Left: 女 (nǚ) \"female/woman\" radical  \n  - Right: 也 (yě) \"also\", a sound component\n  \n**Examples**:  \n- 她是老师。(Tā shì lǎoshī.) - She is a teacher.  \n- 我喜欢她。(Wǒ xǐhuan tā.) - I like her.  \n- 她的家很大。(Tā de jiā hěn dà.) - Her house is big.\n\n**Usage Notes**:  \n- 她 (tā) specifically refers to females. Use 他 (tā) for males, and 它 (tā) for things/animals.\n\n**Memory Aids**:  \n- 女 (nǚ) + 也 (yě): \"A female who is also\" someone — she!  \n- 女 (nǚ) on the left reminds you it's about women.`);
    expect(test2.length).toEqual(1);
  });
});

describe('extractExamples', () => {
  test('should extract examples from standard format', () => {
    const result = extractExamples(mockFlashcardContent);
    const expected = [
      '- 我需要火柴点蜡烛。(Wǒ xūyào huǒchái diǎn làzhú.) - I need matches to light the candle.',
      '- 火柴盒在桌子上。(Huǒchái hé zài zhuōzi shang.) - The matchbox is on the table.'
    ];
    expect(result).toEqual(expected);
  });

  test('should extract multiple examples', () => {
    const result = extractExamples(mockComplexFlashcard);
    const expected = [
      "- 他心里很不安。(Tā xīnli hěn bù'ān.) - He feels very uneasy in his heart.",
      "- 这个消息让我感到不安。(Zhège xiāoxi ràng wǒ gǎndào bù'ān.) - This news makes me feel anxious.",
      "- 不安的情绪影响了他的工作。(Bù'ān de qíngxù yǐngxiǎngle tā de gōngzuò.) - Restless emotions affected his work."
    ];
    expect(result).toEqual(expected);
  });

  test('should extract single example', () => {
    const result = extractExamples(mockFlashcardWithMissingSection);
    const expected = [
      '- 我想喝水。(Wǒ xiǎng hē shuǐ.) - I want to drink water.'
    ];
    expect(result).toEqual(expected);
  });

  test('should return empty array when no examples', () => {
    const result = extractExamples(mockFlashcardMinimal);
    expect(result).toEqual([]);
  });

  test('should extract examples from love character', () => {
    const result = extractExamples(mockFlashcardLove);
    const expected = [
      '- 我爱你。(Wǒ ài nǐ.) - I love you.',
      '- 她爱唱歌。(Tā ài chànggē.) - She loves singing.',
      '- 爱是一种力量。(Ài shì yī zhǒng lìliàng.) - Love is a kind of strength.'
    ];
    expect(result).toEqual(expected);
  });

  test('should extract examples case 0', () => {
    const result = extractExamples(`# **交换 (jiāohuàn) - exchange; swap**\n\n**Character Breakdown:**  \n- **交 (jiāo)**: “to intersect, to hand over.” Top: 父 (fù, father/hand), suggesting contact or interaction.  \n- **换 (huàn)**: “to exchange, to change.” Left: 扌 (shǒu, hand radical); right: 奂 (huàn, brilliant), depicting the act of handling or changing things with hands.\n\n**Examples:**  \n- 我们交换(jiāohuàn)礼物。(Wǒmen jiāohuàn lǐwù.) - We exchange gifts.  \n- 他们交换(jiāohuàn)了电话号码。(Tāmen jiāohuànle diànhuà hàomǎ.) - They swapped phone numbers.  \n- 你想交换(jiāohuàn)座位吗？(Nǐ xiǎng jiāohuàn zuòwèi ma?) - Do you want to swap seats?\n\n**Usage Notes:**  \n交换(jiāohuàn) is for mutual exchange of items, information, or positions, often involving equal value. Common with nouns like 礼物(lǐwù, gifts), 意见(yìjiàn, opinions), 位置(wèizhì, positions).\n\n**Memory Aids:**  \nPicture two people (交(jiāo)) using their hands 扌(huàn) to swap (换(huàn)) objects. \"交\"—meeting; \"换\"—changing by hand.`);
    const expected = [
      '- 我们交换(jiāohuàn)礼物。(Wǒmen jiāohuàn lǐwù.) - We exchange gifts.', 
      '- 他们交换(jiāohuàn)了电话号码。(Tāmen jiāohuànle diànhuà hàomǎ.) - They swapped phone numbers.',
      '- 你想交换(jiāohuàn)座位吗？(Nǐ xiǎng jiāohuàn zuòwèi ma?) - Do you want to swap seats?'
    ];
    expect(result).toEqual(expected);
  });



});

describe('extractUsageNotes', () => {
  test('should extract usage notes from standard format', () => {
    const result = extractUsageNotes(mockFlashcardContent);
    const expected = [
      '- Commonly used in daily life',
      '- Can refer to both the individual match and matches collectively'
    ];
    expect(result).toEqual(expected);
  });

  test('should extract multiple usage notes', () => {
    const result = extractUsageNotes(mockComplexFlashcard);
    const expected = [
      '- Often describes emotional or psychological states',
      '- Can be used as an adjective or noun',
      '- More formal than colloquial alternatives'
    ];
    expect(result).toEqual(expected);
  });

  test('should return empty array when no usage notes', () => {
    const result = extractUsageNotes(mockFlashcardWithMissingSection);
    expect(result).toEqual([]);
  });

  test('should extract usage notes from love character', () => {
    const result = extractUsageNotes(mockFlashcardLove);
    const expected = [
      '- 爱 (ài) is both a noun ("love") and a verb ("to love").',
      '- Less commonly used to express romantic love in daily Chinese; often replaced by 喜欢 (xǐhuān) for less intense affection.',
      '- Used for family, hobbies, and actions.'
    ];
    expect(result).toEqual(expected);
  });

  test('should extract usage notes case 0', () => {
    const result = extractUsageNotes(`# **作业 (zuò yè)** - Homework; Assignment\n\n**Character Breakdown**:  \n- **作 (zuò)**: \"to do/make.\" Left: 亻 (rén) \"person\" radical. Right: 乍 (zhà) \"suddenly/begin.\"  \n- **业 (yè)**: \"work/task.\" Top: 一 (yī) \"one.\" Middle: Vertical component. Bottom: Small strokes (originally meant \"occupation\" or \"line of work\").\n\n**Examples**:  \n- 我(wǒ)今天(jīn tiān)有(yǒu)很多(hěn duō)作业(zuò yè)。 (I have a lot of homework today.)  \n- 你(nǐ)完成(wán chéng)作业(zuò yè)了吗(le ma)？ (Did you finish your homework?)  \n- 老师(lǎo shī)检查(jiǎn chá)作业(zuò yè)。 (The teacher checks the homework.)\n\n**Usage Notes**: 常用(cháng yòng, commonly used) in schools for student homework; can also mean \"task/assignment\" in work settings.\n\n**Memory Aids**: Think \"做(zuò, to do)业(yè, work)\" — 作业(zuò yè) means \"do work (homework).\" The \"person\" radical in 作(zuò) reminds you someone is doing the work!`);
    const expected = [
      '常用(cháng yòng, commonly used) in schools for student homework; can also mean "task/assignment" in work settings.'
    ];
    expect(result).toEqual(expected);
  });
});

describe('extractMemoryAids', () => {
  test('should extract memory aids from standard format', () => {
    const result = extractMemoryAids(mockFlashcardContent);
    const expected = [
      '- Think of "fire" + "wood" = the tool to make fire from wood',
      '- Picture a match igniting firewood'
    ];
    expect(result).toEqual(expected);
  });

  test('should extract memory aids from complex format', () => {
    const result = extractMemoryAids(mockComplexFlashcard);
    const expected = [
      '- "不" (not) + "安" (peace) = not peaceful, hence anxious',
      '- Picture someone pacing restlessly, unable to find peace'
    ];
    expect(result).toEqual(expected);
  });

  test('should extract single memory aid', () => {
    const result = extractMemoryAids(mockFlashcardWithMissingSection);
    const expected = [
      '- The character looks like flowing water'
    ];
    expect(result).toEqual(expected);
  });

  test('should return empty array when no memory aids', () => {
    const result = extractMemoryAids(mockFlashcardMinimal);
    expect(result).toEqual([]);
  });

  test('should extract memory aids from love character', () => {
    const result = extractMemoryAids(mockFlashcardLove);
    const expected = [
      '- Imagine a "hand/claw" (爫 zhǎo) gently protecting a "heart" (心 xīn) as a symbol of love (爱 ài).',
      '- 爱 (ài) sounds like "eye", reminding you to "see" with love.'
    ];
    expect(result).toEqual(expected);
  });
});

describe('updateCharacterReferences', () => {
  test('should update character references correctly', () => {
    const references = {};
    const characterBreakdown = [
      '- **火 (huǒ)**: Fire, flame. The radical suggests heat and burning.',
      '- **柴 (chái)**: Firewood, kindling.'
    ];
    
    const result = updateCharacterReferences('火柴', characterBreakdown, references);
    
    expect(result['火']).toBe('- **火 (huǒ)**: Fire, flame. The radical suggests heat and burning.');
    expect(result['柴']).toBe('- **柴 (chái)**: Firewood, kindling.');
  });

  test('should not overwrite existing references', () => {
    const references = {
      '火': '- **火 (huǒ)**: Existing description'
    };
    const characterBreakdown = [
      '- **火 (huǒ)**: Fire, flame. The radical suggests heat and burning.'
    ];
    
    const result = updateCharacterReferences('火', characterBreakdown, references);
    
    expect(result['火']).toBe('- **火 (huǒ)**: Existing description');
  });
});

describe('processFlashcardsData', () => {
  test('should process flashcards data correctly', () => {
    const flashcardsData = {
      '火柴': mockFlashcardContent,
      '好': mockFlashcardMinimal
    };
    
    const result = processFlashcardsData(flashcardsData);
    
    expect(result['火柴']).toBeDefined();
    expect(result['火柴'].pinyin).toBe('huǒchái');
    expect(result['火柴'].english).toBe('Match (for lighting fire)');
    expect(result['火柴'].examples).toHaveLength(2);
  });

  test('should handle invalid data gracefully', () => {
    const flashcardsData = {
      'invalid1': null,
      'invalid2': undefined,
      'invalid3': 123,
      '好': mockFlashcardMinimal
    };
    
    const result = processFlashcardsData(flashcardsData);
    
    expect(result['invalid1']).toBeUndefined();
    expect(result['invalid2']).toBeUndefined();
    expect(result['invalid3']).toBeUndefined();
    expect(result['好']).toBeDefined();
  });
});

describe('edge cases', () => {
  test('should handle empty strings', () => {
    expect(extractTitleInfo('')).toEqual({ pinyin: '', english: '' });
    expect(extractCharacterBreakdown('')).toEqual([]);
    expect(extractExamples('')).toEqual([]);
    expect(extractUsageNotes('')).toEqual([]);
    expect(extractMemoryAids('')).toEqual([]);
  });

  test('should handle malformed markdown', () => {
    const malformed = `# Incomplete title
    Some random text without proper structure`;
    
    expect(extractTitleInfo(malformed)).toEqual({ pinyin: '', english: '' });
    expect(extractCharacterBreakdown(malformed)).toEqual([]);
  });
});

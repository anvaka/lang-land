/**
 * Tests for the HSK level addition utility
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { parseHskLevels, updateGeojsonFile } from './addHskLevels.js';
import * as fs from 'fs';
import { join } from 'path';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn()
}));

describe('parseHskLevels', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('should parse CSV and create a map of words to levels', () => {
    // Mock the CSV file content
    const mockCsv = 'word,level\n爱,1\n学习,2\n工作,3';
    fs.readFileSync.mockReturnValue(mockCsv);

    const result = parseHskLevels('fakepath.csv');
    
    expect(fs.readFileSync).toHaveBeenCalledWith('fakepath.csv', 'utf8');
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(3);
    expect(result.get('爱')).toBe(1);
    expect(result.get('学习')).toBe(2);
    expect(result.get('工作')).toBe(3);
  });

  test('should handle empty lines in CSV', () => {
    // Mock the CSV file content with empty lines
    const mockCsv = 'word,level\n爱,1\n\n学习,2\n\n';
    fs.readFileSync.mockReturnValue(mockCsv);

    const result = parseHskLevels('fakepath.csv');
    
    expect(result.size).toBe(2);
    expect(result.get('爱')).toBe(1);
    expect(result.get('学习')).toBe(2);
  });
});

describe('updateGeojsonFile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('should update features with matching labels', () => {
    // Create mock HSK levels map
    const hskLevels = new Map();
    hskLevels.set('爱', 1);
    hskLevels.set('学习', 2);
    
    // Mock geojson content
    const mockGeojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { label: '爱', size: 1.5, parent: 0 },
          geometry: { /* mock geometry */ }
        },
        {
          type: 'Feature',
          properties: { label: '学习', size: 1.8, parent: 1 },
          geometry: { /* mock geometry */ }
        },
        {
          type: 'Feature',
          properties: { label: '没有HSK', size: 2.0, parent: 2 },
          geometry: { /* mock geometry */ }
        }
      ]
    };
    
    // Expected output after updates
    const expectedOutput = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { label: '爱', size: 1.5, parent: 0, l: 1 },
          geometry: { /* mock geometry */ }
        },
        {
          type: 'Feature',
          properties: { label: '学习', size: 1.8, parent: 1, l: 2 },
          geometry: { /* mock geometry */ }
        },
        {
          type: 'Feature',
          properties: { label: '没有HSK', size: 2.0, parent: 2 },
          geometry: { /* mock geometry */ }
        }
      ]
    };
    
    fs.readFileSync.mockReturnValue(JSON.stringify(mockGeojson));
    
    const updatedCount = updateGeojsonFile('fakepath.geojson', hskLevels);
    
    expect(updatedCount).toBe(2);
    expect(fs.writeFileSync).toHaveBeenCalledWith('fakepath.geojson', JSON.stringify(expectedOutput), 'utf8');
  });

  test('should not update file if no features match', () => {
    // Create mock HSK levels map
    const hskLevels = new Map();
    hskLevels.set('爱', 1);
    
    // Mock geojson content with no matching features
    const mockGeojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { label: '不匹配', size: 1.5 },
          geometry: { /* mock geometry */ }
        }
      ]
    };
    
    fs.readFileSync.mockReturnValue(JSON.stringify(mockGeojson));
    
    const updatedCount = updateGeojsonFile('fakepath.geojson', hskLevels);
    
    expect(updatedCount).toBe(0);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});

const core = require('../src/scripts/calculator-core');

describe('inchMM', () => {
  test('converts inches to millimetres', () => {
    expect(core.inchMM(1)).toBe(25.4);
    expect(core.inchMM(0)).toBe(0);
    expect(core.inchMM(0.5)).toBeCloseTo(12.7);
    expect(core.inchMM(-1)).toBe(-25.4);
  });
});

describe('round', () => {
  test('defaults to 1 decimal place', () => {
    expect(core.round(3.456)).toBe(3.5);
    expect(core.round(3.444)).toBe(3.4);
  });

  test('rounds to specified decimal places', () => {
    expect(core.round(3.456, 2)).toBe(3.46);
    expect(core.round(3.456, 0)).toBe(3);
  });

  test('handles negative numbers', () => {
    expect(core.round(-3.456)).toBe(-3.5);
    expect(core.round(-3.444, 2)).toBe(-3.44);
  });
});

describe('calculateSplitRim', () => {
  test('no change returns zeroes', () => {
    const result = core.calculateSplitRim({
      oldInner: 5, newInner: 5,
      oldOuter: 5, newOuter: 5,
      wheelWidth: 10, offset: 32, spacers: 0
    });
    expect(result.newWidth).toBe(10);
    expect(result.newOffset).toBe(32);
    expect(result.overallOffset).toBe(32);
    expect(result.archDiff).toBe(0);
    expect(result.strutDiff).toBe(0);
  });

  test('wider outer lip pushes arch clearance', () => {
    const result = core.calculateSplitRim({
      oldInner: 4, newInner: 4,
      oldOuter: 4, newOuter: 5,
      wheelWidth: 8, offset: 35, spacers: 0
    });
    expect(result.newWidth).toBe(9);
    expect(result.archDiff).toBeLessThan(0); // less arch clearance
  });

  test('spacers reduce overall offset', () => {
    const result = core.calculateSplitRim({
      oldInner: 4, newInner: 4,
      oldOuter: 4, newOuter: 4,
      wheelWidth: 8, offset: 35, spacers: 5
    });
    expect(result.overallOffset).toBe(30);
  });

  test('demo scenario: offset calculator example', () => {
    // Matches the demo values from the offset calculator page
    const result = core.calculateSplitRim({
      oldInner: 4, newInner: 5,
      oldOuter: 4, newOuter: 5,
      wheelWidth: 8, offset: 35, spacers: 0
    });
    expect(result.newWidth).toBe(10);
    // Inner +1 and outer +1 cancel out for offset change
    expect(result.newOffset).toBe(35);
  });
});

describe('calculateFitment', () => {
  test('same wheel returns zeroes for diffs', () => {
    const result = core.calculateFitment({
      oldWidth: 7, oldOffset: 35,
      newWidth: 7, newOffset: 35, spacers: 0
    });
    expect(result.archDiff).toBe(0);
    expect(result.strutDiff).toBe(0);
  });

  test('wider wheel with same offset', () => {
    const result = core.calculateFitment({
      oldWidth: 7, oldOffset: 35,
      newWidth: 8, newOffset: 35, spacers: 0
    });
    // Wider wheel with same offset = less clearance on both sides
    expect(result.archDiff).toBeLessThan(0);
    expect(result.strutDiff).toBeLessThan(0);
  });

  test('spacers affect clearance', () => {
    const withoutSpacers = core.calculateFitment({
      oldWidth: 7, oldOffset: 35,
      newWidth: 8, newOffset: 35, spacers: 0
    });
    const withSpacers = core.calculateFitment({
      oldWidth: 7, oldOffset: 35,
      newWidth: 8, newOffset: 35, spacers: 5
    });
    expect(withSpacers.overallOffset).toBe(withoutSpacers.overallOffset - 5);
    expect(withSpacers.archDiff).toBeLessThan(withoutSpacers.archDiff);
  });

  test('higher offset = more arch clearance', () => {
    const lowOffset = core.calculateFitment({
      oldWidth: 7, oldOffset: 35,
      newWidth: 7, newOffset: 30, spacers: 0
    });
    const highOffset = core.calculateFitment({
      oldWidth: 7, oldOffset: 35,
      newWidth: 7, newOffset: 40, spacers: 0
    });
    expect(highOffset.archDiff).toBeGreaterThan(lowOffset.archDiff);
  });
});

describe('equivalentOffset', () => {
  test('same width returns same offset', () => {
    expect(core.equivalentOffset(7, 7, 35)).toBe(35);
  });

  test('wider wheel needs higher offset for same clearance', () => {
    const eqOffset = core.equivalentOffset(8, 7, 35);
    expect(eqOffset).toBeGreaterThan(35);
  });

  test('narrower wheel needs lower offset for same clearance', () => {
    const eqOffset = core.equivalentOffset(6, 7, 35);
    expect(eqOffset).toBeLessThan(35);
  });
});

describe('equivalentTable', () => {
  test('generates correct number of entries', () => {
    const table = core.equivalentTable(7, 35, 6, 10, 0.5);
    expect(table).toHaveLength(9); // 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10
  });

  test('entries have width and offset', () => {
    const table = core.equivalentTable(7, 35, 6, 8, 1);
    table.forEach(entry => {
      expect(entry).toHaveProperty('width');
      expect(entry).toHaveProperty('offset');
      expect(typeof entry.offset).toBe('number');
    });
  });

  test('returns null offsets when width is 0', () => {
    const table = core.equivalentTable(0, 35, 6, 8, 1);
    table.forEach(entry => {
      expect(entry.offset).toBeNull();
    });
  });

  test('matching width entry has same offset', () => {
    const table = core.equivalentTable(7, 35, 6, 8, 1);
    const match = table.find(e => e.width === 7);
    expect(match.offset).toBe(35);
  });
});

describe('formatDiff', () => {
  test('negative diff shows LESS', () => {
    expect(core.formatDiff(-5)).toBe('5 LESS');
  });

  test('positive diff shows MORE', () => {
    expect(core.formatDiff(5)).toBe('5 MORE');
  });

  test('zero shows NO CHANGE', () => {
    expect(core.formatDiff(0)).toBe('NO CHANGE');
  });
});

describe('formatToString', () => {
  test('formats width and offset', () => {
    expect(core.formatToString(8, 32)).toBe('8j et32');
  });

  test('rounds values', () => {
    expect(core.formatToString(7.555, 32.45)).toBe('7.56j et32.5');
  });

  test('handles negative offset', () => {
    expect(core.formatToString(8, -5)).toBe('8j et-5');
  });
});

describe('validateField', () => {
  test('valid positive number', () => {
    expect(core.validateField('42')).toEqual({ valid: true, value: '42' });
  });

  test('valid decimal', () => {
    expect(core.validateField('7.5')).toEqual({ valid: true, value: '7.5' });
  });

  test('valid negative number', () => {
    expect(core.validateField('-10')).toEqual({ valid: true, value: '-10' });
  });

  test('empty string defaults to 0', () => {
    expect(core.validateField('')).toEqual({ valid: true, value: '0' });
  });

  test('whitespace-only defaults to 0', () => {
    expect(core.validateField('   ')).toEqual({ valid: true, value: '0' });
  });

  test('non-numeric is invalid', () => {
    expect(core.validateField('abc')).toEqual({ valid: false, value: 'abc' });
  });

  test('mixed content is invalid', () => {
    expect(core.validateField('12abc')).toEqual({ valid: false, value: '12abc' });
  });
});

describe('autofill', () => {
  test('infers oldOuter from wheelWidth and oldInner', () => {
    const result = core.autofill({
      oldInner: 3, oldOuter: 0, newInner: 0, newOuter: 0, wheelWidth: 8
    });
    expect(result.oldOuter).toBe(5);
  });

  test('infers oldInner from wheelWidth and oldOuter', () => {
    const result = core.autofill({
      oldInner: 0, oldOuter: 4, newInner: 0, newOuter: 0, wheelWidth: 8
    });
    expect(result.oldInner).toBe(4);
  });

  test('infers wheelWidth from inner and outer', () => {
    const result = core.autofill({
      oldInner: 3, oldOuter: 5, newInner: 0, newOuter: 0, wheelWidth: 0
    });
    expect(result.wheelWidth).toBe(8);
  });

  test('copies old values to new when new is 0', () => {
    const result = core.autofill({
      oldInner: 3, oldOuter: 5, newInner: 0, newOuter: 0, wheelWidth: 8
    });
    expect(result.newInner).toBe(3);
    expect(result.newOuter).toBe(5);
  });

  test('does not overwrite non-zero new values', () => {
    const result = core.autofill({
      oldInner: 3, oldOuter: 5, newInner: 4, newOuter: 6, wheelWidth: 8
    });
    expect(result.newInner).toBe(4);
    expect(result.newOuter).toBe(6);
  });

  test('resets wheelWidth if less than inner or outer', () => {
    const result = core.autofill({
      oldInner: 5, oldOuter: 5, newInner: 0, newOuter: 0, wheelWidth: 3
    });
    // wheelWidth < oldInner, so reset to 0, then recalculated from inner+outer
    expect(result.wheelWidth).toBe(10);
  });
});

describe('willTheyFitUrl', () => {
  test('generates valid URL with diameter', () => {
    const url = core.willTheyFitUrl(7, 35, 8, 40, 18);
    expect(url).toContain('willtheyfit.com');
    expect(url).toContain('wheelwidth=7');
    expect(url).toContain('offset=35');
    expect(url).toContain('wheelwidth2=8');
    expect(url).toContain('offset2=40');
    expect(url).toContain('diameter=18');
  });

  test('defaults diameter to 17 when 0', () => {
    const url = core.willTheyFitUrl(7, 35, 8, 40, 0);
    expect(url).toContain('diameter=17');
  });
});

describe('rimtuckUrl', () => {
  test('generates front URL with positive offset', () => {
    const url = core.rimtuckUrl(8, 35, 18, 'f');
    expect(url).toContain('rimtuck.com');
    expect(url).toContain('widthf=8');
    expect(url).toContain('offsetf=35');
    expect(url).toContain('signf=%2B');
    expect(url).toContain('diameterf=18');
  });

  test('generates rear URL with negative offset', () => {
    const url = core.rimtuckUrl(9, -10, 17, 'r');
    expect(url).toContain('widthr=9');
    expect(url).toContain('offsetr=10');
    expect(url).toContain('signr=-');
  });

  test('omits diameter when 0', () => {
    const url = core.rimtuckUrl(8, 35, 0, 'f');
    expect(url).not.toContain('diameter');
  });
});

describe('toHash', () => {
  test('serializes values', () => {
    const hash = core.toHash({ oi: '4', oo: '1', w: '8', o: '32' });
    expect(hash).toBe('oi=4&oo=1&w=8&o=32');
  });

  test('omits zero values', () => {
    const hash = core.toHash({ w: '8', o: '30', s: '0', d: '0' });
    expect(hash).toBe('w=8&o=30');
  });

  test('omits empty values', () => {
    const hash = core.toHash({ w: '9.5', o: '', d: '17' });
    expect(hash).toBe('w=9.5&d=17');
  });
});

describe('fromHash', () => {
  test('parses hash string', () => {
    const result = core.fromHash('#oi=4&oo=1&w=8&o=32');
    expect(result).toEqual({ oi: '4', oo: '1', w: '8', o: '32' });
  });

  test('handles hash without leading #', () => {
    const result = core.fromHash('w=8&o=30');
    expect(result).toEqual({ w: '8', o: '30' });
  });

  test('returns empty object for empty hash', () => {
    expect(core.fromHash('')).toEqual({});
    expect(core.fromHash('#')).toEqual({});
  });

  test('handles negative values', () => {
    const result = core.fromHash('#o=-10');
    expect(result.o).toBe('-10');
  });
});

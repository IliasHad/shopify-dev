import { describe, it, expect } from 'vitest';
import { run } from './run';
import { FunctionRunResult } from '../generated/api';

describe('delivery customization function', () => {
  it('returns no operations without configuration', () => {
    const result = run({
      deliveryCustomization: {
        metafield: null
      }
    });
    const expected: FunctionRunResult = { operations: [] };

    expect(result).toEqual(expected);
  });
});

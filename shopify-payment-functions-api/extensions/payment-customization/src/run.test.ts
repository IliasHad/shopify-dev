import { describe, it, expect } from 'vitest';
import { run } from './run';
import { FunctionRunResult } from '../generated/api';

describe('payment customization function', () => {
  it('returns no operations without configuration', () => {
    const result = run({
      paymentCustomization: {
        metafield: null
      }
    });
    const expected: FunctionRunResult = { operations: [] };

    expect(result).toEqual(expected);
  });
});
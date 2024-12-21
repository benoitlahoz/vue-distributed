import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { parse } from '..';

describe('AST parser', () => {
  it('should parse', () => {
    const obj: any = parse(resolve(__dirname, 'example.ts'));

    expect(obj).toBeTypeOf('object');
    // Alias has been bypassed for 'default'.
    // expect(obj.res.plugin).toBeUndefined();
    // expect(obj.res.default).toBeTypeOf('object');
    expect(obj.err).toBeNull();
    console.log(obj.res);
  });
});

import { arrayFilters, stringFilters, mathFilters } from '../liquidFilters';

// ============================================================================
// Array Filters Tests
// ============================================================================

describe('arrayFilters', () => {
  describe('first', () => {
    it('returns first element of array', () => {
      expect(arrayFilters.first([1, 2, 3])).toBe(1);
      expect(arrayFilters.first(['a', 'b', 'c'])).toBe('a');
    });

    it('returns undefined for empty array', () => {
      expect(arrayFilters.first([])).toBeUndefined();
    });

    it('handles undefined/null input', () => {
      expect(arrayFilters.first(undefined as unknown as [])).toBeUndefined();
    });
  });

  describe('last', () => {
    it('returns last element of array', () => {
      expect(arrayFilters.last([1, 2, 3])).toBe(3);
      expect(arrayFilters.last(['a', 'b', 'c'])).toBe('c');
    });

    it('returns undefined for empty array', () => {
      expect(arrayFilters.last([])).toBeUndefined();
    });
  });

  describe('map', () => {
    it('extracts property values from objects', () => {
      const arr = [{ title: 'A' }, { title: 'B' }, { title: 'C' }];
      expect(arrayFilters.map(arr, 'title')).toEqual(['A', 'B', 'C']);
    });

    it('returns undefined for missing properties', () => {
      const arr = [{ title: 'A' }, { name: 'B' }];
      expect(arrayFilters.map(arr, 'title')).toEqual(['A', undefined]);
    });

    it('returns empty array for non-array input', () => {
      expect(arrayFilters.map('not array' as unknown as [], 'key')).toEqual([]);
    });
  });

  describe('compact', () => {
    it('removes null and undefined values', () => {
      expect(arrayFilters.compact([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
    });

    it('keeps falsy values like 0 and empty string', () => {
      expect(arrayFilters.compact([0, '', false, null, undefined])).toEqual([0, '', false]);
    });
  });

  describe('concat', () => {
    it('concatenates two arrays', () => {
      expect(arrayFilters.concat([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
    });

    it('handles empty arrays', () => {
      expect(arrayFilters.concat([], [1, 2])).toEqual([1, 2]);
      expect(arrayFilters.concat([1, 2], [])).toEqual([1, 2]);
    });
  });

  describe('reverse', () => {
    it('reverses array', () => {
      expect(arrayFilters.reverse([1, 2, 3])).toEqual([3, 2, 1]);
    });

    it('does not mutate original array', () => {
      const original = [1, 2, 3];
      arrayFilters.reverse(original);
      expect(original).toEqual([1, 2, 3]);
    });
  });

  describe('sort', () => {
    it('sorts simple array', () => {
      expect(arrayFilters.sort([3, 1, 2])).toEqual([1, 2, 3]);
    });

    it('sorts by property key', () => {
      const arr = [{ price: 30 }, { price: 10 }, { price: 20 }];
      expect(arrayFilters.sort(arr, 'price')).toEqual([
        { price: 10 },
        { price: 20 },
        { price: 30 },
      ]);
    });

    it('sorts strings alphabetically by key', () => {
      const arr = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
      expect(arrayFilters.sort(arr, 'name')).toEqual([
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' },
      ]);
    });
  });

  describe('sort_natural', () => {
    it('sorts case-insensitively', () => {
      expect(arrayFilters.sort_natural(['Banana', 'apple', 'Cherry'])).toEqual([
        'apple',
        'Banana',
        'Cherry',
      ]);
    });

    it('sorts by key case-insensitively', () => {
      const arr = [{ name: 'Banana' }, { name: 'apple' }, { name: 'Cherry' }];
      expect(arrayFilters.sort_natural(arr, 'name')).toEqual([
        { name: 'apple' },
        { name: 'Banana' },
        { name: 'Cherry' },
      ]);
    });
  });

  describe('uniq', () => {
    it('returns unique values', () => {
      expect(arrayFilters.uniq([1, 2, 2, 3, 1, 3])).toEqual([1, 2, 3]);
    });

    it('preserves order of first occurrence', () => {
      expect(arrayFilters.uniq(['b', 'a', 'b', 'c', 'a'])).toEqual(['b', 'a', 'c']);
    });
  });

  describe('find', () => {
    it('finds object by property value', () => {
      const arr = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
      expect(arrayFilters.find(arr, 'id', 2)).toEqual({ id: 2, name: 'B' });
    });

    it('returns undefined if not found', () => {
      const arr = [{ id: 1 }, { id: 2 }];
      expect(arrayFilters.find(arr, 'id', 3)).toBeUndefined();
    });
  });

  describe('reject', () => {
    it('filters out matching items', () => {
      const arr = [
        { status: 'active' },
        { status: 'inactive' },
        { status: 'active' },
      ];
      expect(arrayFilters.reject(arr, 'status', 'inactive')).toEqual([
        { status: 'active' },
        { status: 'active' },
      ]);
    });
  });
});

// ============================================================================
// String Filters Tests
// ============================================================================

describe('stringFilters', () => {
  describe('escape_once', () => {
    it('escapes HTML entities', () => {
      expect(stringFilters.escape_once('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('does not double-escape already escaped entities', () => {
      // Already-escaped entities should not be double-escaped
      expect(stringFilters.escape_once('&lt;div&gt;')).toBe('&lt;div&gt;');
      expect(stringFilters.escape_once('&amp;')).toBe('&amp;');
    });

    it('prevents XSS via multi-encoded inputs', () => {
      // Should NOT unescape &amp;lt; to &lt; to <
      const result = stringFilters.escape_once('&amp;lt;script&amp;gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('newline_to_br', () => {
    it('converts newlines to br tags', () => {
      expect(stringFilters.newline_to_br('Line 1\nLine 2\nLine 3')).toBe(
        'Line 1<br>Line 2<br>Line 3'
      );
    });
  });

  describe('strip_html', () => {
    it('removes all HTML tags', () => {
      expect(stringFilters.strip_html('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('handles self-closing tags', () => {
      expect(stringFilters.strip_html('Line 1<br/>Line 2')).toBe('Line 1Line 2');
    });
  });

  describe('strip_newlines', () => {
    it('removes newlines', () => {
      expect(stringFilters.strip_newlines('Line 1\nLine 2\r\nLine 3')).toBe('Line 1Line 2Line 3');
    });
  });

  describe('url_encode', () => {
    it('encodes special characters', () => {
      expect(stringFilters.url_encode('hello world')).toBe('hello%20world');
      expect(stringFilters.url_encode('foo=bar&baz=qux')).toBe('foo%3Dbar%26baz%3Dqux');
    });
  });

  describe('url_decode', () => {
    it('decodes URL-encoded strings', () => {
      expect(stringFilters.url_decode('hello%20world')).toBe('hello world');
    });

    it('handles invalid encoding gracefully', () => {
      expect(stringFilters.url_decode('%invalid')).toBe('%invalid');
    });
  });

  describe('base64_encode', () => {
    it('encodes to base64', () => {
      expect(stringFilters.base64_encode('Hello, World!')).toBe('SGVsbG8sIFdvcmxkIQ==');
    });

    it('handles Unicode and emoji characters', () => {
      const encoded = stringFilters.base64_encode('Hello 👋 世界');
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
      // Should be able to decode back
      expect(stringFilters.base64_decode(encoded)).toBe('Hello 👋 世界');
    });
  });

  describe('base64_decode', () => {
    it('decodes from base64', () => {
      expect(stringFilters.base64_decode('SGVsbG8sIFdvcmxkIQ==')).toBe('Hello, World!');
    });

    it('handles invalid base64 gracefully', () => {
      expect(stringFilters.base64_decode('!!!invalid!!!')).toBe('!!!invalid!!!');
    });
  });

  describe('md5', () => {
    it('returns a 32-character hash', () => {
      const hash = stringFilters.md5('test');
      expect(hash).toHaveLength(32);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('sha256', () => {
    it('returns a 64-character hash', () => {
      const hash = stringFilters.sha256('test');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('remove_first', () => {
    it('removes first occurrence', () => {
      expect(stringFilters.remove_first('hello hello world', 'hello ')).toBe('hello world');
    });

    it('returns unchanged if not found', () => {
      expect(stringFilters.remove_first('hello', 'xyz')).toBe('hello');
    });
  });

  describe('remove_last', () => {
    it('removes last occurrence', () => {
      expect(stringFilters.remove_last('hello hello world', 'hello')).toBe('hello  world');
    });
  });

  describe('replace_first', () => {
    it('replaces first occurrence', () => {
      expect(stringFilters.replace_first('hello hello', 'hello', 'hi')).toBe('hi hello');
    });
  });

  describe('replace_last', () => {
    it('replaces last occurrence', () => {
      expect(stringFilters.replace_last('hello hello', 'hello', 'hi')).toBe('hello hi');
    });
  });

  describe('slice', () => {
    it('extracts substring from start', () => {
      expect(stringFilters.slice('hello world', 0, 5)).toBe('hello');
    });

    it('extracts to end if length not specified', () => {
      expect(stringFilters.slice('hello world', 6)).toBe('world');
    });

    it('handles negative start index', () => {
      expect(stringFilters.slice('hello world', -5)).toBe('world');
    });
  });

  describe('camelize', () => {
    it('converts hyphenated to camelCase', () => {
      expect(stringFilters.camelize('hello-world')).toBe('helloWorld');
    });

    it('converts underscored to camelCase', () => {
      expect(stringFilters.camelize('hello_world')).toBe('helloWorld');
    });

    it('converts spaces to camelCase', () => {
      expect(stringFilters.camelize('hello world')).toBe('helloWorld');
    });
  });
});

// ============================================================================
// Math Filters Tests
// ============================================================================

describe('mathFilters', () => {
  describe('abs', () => {
    it('returns absolute value', () => {
      expect(mathFilters.abs(-5)).toBe(5);
      expect(mathFilters.abs(5)).toBe(5);
    });

    it('handles string numbers', () => {
      expect(mathFilters.abs('-10' as unknown as number)).toBe(10);
    });
  });

  describe('at_least', () => {
    it('returns num if greater than min', () => {
      expect(mathFilters.at_least(15, 10)).toBe(15);
    });

    it('returns min if num is less', () => {
      expect(mathFilters.at_least(5, 10)).toBe(10);
    });
  });

  describe('at_most', () => {
    it('returns num if less than max', () => {
      expect(mathFilters.at_most(5, 10)).toBe(5);
    });

    it('returns max if num is greater', () => {
      expect(mathFilters.at_most(15, 10)).toBe(10);
    });
  });

  describe('ceil', () => {
    it('rounds up to nearest integer', () => {
      expect(mathFilters.ceil(1.2)).toBe(2);
      expect(mathFilters.ceil(1.8)).toBe(2);
    });
  });

  describe('floor', () => {
    it('rounds down to nearest integer', () => {
      expect(mathFilters.floor(1.2)).toBe(1);
      expect(mathFilters.floor(1.8)).toBe(1);
    });
  });

  describe('round', () => {
    it('rounds to nearest integer by default', () => {
      expect(mathFilters.round(3.4)).toBe(3);
      expect(mathFilters.round(3.5)).toBe(4);
    });

    it('rounds to specified precision', () => {
      expect(mathFilters.round(3.14159, 2)).toBe(3.14);
      expect(mathFilters.round(3.14159, 4)).toBe(3.1416);
    });
  });

  describe('plus', () => {
    it('adds two numbers', () => {
      expect(mathFilters.plus(5, 3)).toBe(8);
    });

    it('handles string numbers', () => {
      expect(mathFilters.plus('5' as unknown as number, '3' as unknown as number)).toBe(8);
    });
  });

  describe('minus', () => {
    it('subtracts second from first', () => {
      expect(mathFilters.minus(10, 3)).toBe(7);
    });
  });
});

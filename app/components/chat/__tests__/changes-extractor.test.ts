/**
 * Tests for changes-extractor utility
 * Tests extracting change summaries from AI response text
 */
import { extractChanges, hasChanges } from '../utils/changes-extractor';

describe('extractChanges', () => {
  describe('bullet point extraction', () => {
    it('extracts changes from bullet points with •', () => {
      const content = `Here are the changes:
• Added hero banner with overlay
• Set background color to deep blue
• Added CTA button`;

      const changes = extractChanges(content);

      expect(changes).toHaveLength(3);
      expect(changes[0]).toBe('Added hero banner with overlay');
      expect(changes[1]).toBe('Set background color to deep blue');
      expect(changes[2]).toBe('Added CTA button');
    });

    it('extracts changes from bullet points with -', () => {
      const content = `Changes made:
- Updated header styles
- Fixed responsive layout`;

      const changes = extractChanges(content);

      expect(changes).toHaveLength(2);
      expect(changes[0]).toBe('Updated header styles');
      expect(changes[1]).toBe('Fixed responsive layout');
    });

    it('extracts changes from bullet points with *', () => {
      const content = `I made these updates:
* Created new component
* Improved accessibility`;

      const changes = extractChanges(content);

      expect(changes).toHaveLength(2);
      expect(changes[0]).toBe('Created new component');
      expect(changes[1]).toBe('Improved accessibility');
    });
  });

  describe('numbered list extraction', () => {
    it('extracts changes from numbered lists', () => {
      const content = `Here's what I changed:
1. Added product grid
2. Set spacing to 16px
3. Implemented hover effect`;

      const changes = extractChanges(content);

      expect(changes).toHaveLength(3);
      expect(changes[0]).toBe('Added product grid');
      expect(changes[1]).toBe('Set spacing to 16px');
      expect(changes[2]).toBe('Implemented hover effect');
    });
  });

  describe('action verb extraction', () => {
    it('extracts sentences starting with action verbs', () => {
      const content = `Added a new hero section.
Changed the color scheme.
Updated responsive breakpoints.`;

      const changes = extractChanges(content);

      expect(changes).toContain('Added a new hero section.');
      expect(changes).toContain('Changed the color scheme.');
      expect(changes).toContain('Updated responsive breakpoints.');
    });

    it('handles "I\'ve" prefix', () => {
      const content = `I've added three new settings.
I've changed the layout to grid.`;

      const changes = extractChanges(content);

      expect(changes).toContain('Added three new settings.');
      expect(changes).toContain('Changed the layout to grid.');
    });
  });

  describe('code block handling', () => {
    it('ignores content inside code blocks', () => {
      const content = `Made these changes:
- Added hero section

\`\`\`liquid
• This is not a change
- This is code
{% schema %}
Added fake change
{% endschema %}
\`\`\`

- Updated styles`;

      const changes = extractChanges(content);

      expect(changes).toHaveLength(2);
      expect(changes).not.toContain('This is not a change');
      expect(changes).not.toContain('This is code');
      expect(changes).not.toContain('Added fake change');
    });
  });

  describe('deduplication', () => {
    it('removes duplicate changes (case insensitive)', () => {
      const content = `Changes:
- Added hero banner
- ADDED HERO BANNER
- added hero banner`;

      const changes = extractChanges(content);

      expect(changes).toHaveLength(1);
    });
  });

  describe('limits', () => {
    it('limits to 5 changes', () => {
      const content = `Many changes:
1. Change one
2. Change two
3. Change three
4. Change four
5. Change five
6. Change six
7. Change seven`;

      const changes = extractChanges(content);

      expect(changes).toHaveLength(5);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for content without changes', () => {
      const content = 'Here is the code without any changes listed.';

      const changes = extractChanges(content);

      expect(changes).toHaveLength(0);
    });

    it('handles empty content', () => {
      const changes = extractChanges('');

      expect(changes).toHaveLength(0);
    });

    it('handles content with only code blocks', () => {
      const content = '```liquid\n<div>Code only</div>\n```';

      const changes = extractChanges(content);

      expect(changes).toHaveLength(0);
    });
  });
});

describe('hasChanges', () => {
  it('returns true when content contains change keywords', () => {
    expect(hasChanges('I added a new feature')).toBe(true);
    expect(hasChanges('Changed the layout')).toBe(true);
    expect(hasChanges('Updated styles')).toBe(true);
    expect(hasChanges('Removed unused code')).toBe(true);
  });

  it('returns false when content has no change keywords', () => {
    expect(hasChanges('Here is some code')).toBe(false);
    expect(hasChanges('The weather is nice')).toBe(false);
  });

  it('ignores code blocks when checking', () => {
    const content = '```\nadded something\n```';
    expect(hasChanges(content)).toBe(false);
  });

  it('is case insensitive', () => {
    expect(hasChanges('ADDED feature')).toBe(true);
    expect(hasChanges('Changed SOMETHING')).toBe(true);
  });
});

import { getRandomEmoji, capitalize } from '../utils.js';

describe('Utils', () => {
  describe('getRandomEmoji', () => {
    it('should return a string', () => {
      const emoji = getRandomEmoji();
      expect(typeof emoji).toBe('string');
    });

    it('should return one of the valid emojis', () => {
      const validEmojis = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
      const emoji = getRandomEmoji();
      expect(validEmojis).toContain(emoji);
    });

    it('should return different emojis over multiple calls', () => {
      const emojis = new Set();
      // Run 50 times to get variety
      for (let i = 0; i < 50; i++) {
        emojis.add(getRandomEmoji());
      }
      // Should have at least 2 different emojis
      expect(emojis.size).toBeGreaterThan(1);
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('should handle single character strings', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('should only capitalize the first letter', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });
  });
});
import { getResult, getRPSChoices, getShuffledOptions, RollDice } from '../game.js';

describe('Game Logic', () => {
  describe('getRPSChoices', () => {
    it('should return an array of choice names', () => {
      const choices = getRPSChoices();
      expect(Array.isArray(choices)).toBe(true);
      expect(choices.length).toBeGreaterThan(0);
    });

    it('should include expected choices', () => {
      const choices = getRPSChoices();
      expect(choices).toContain('rock');
      expect(choices).toContain('paper');
      expect(choices).toContain('scissors');
    });
  });

  describe('getShuffledOptions', () => {
    it('should return an array of options', () => {
      const options = getShuffledOptions();
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
    });

    it('should have proper option structure', () => {
      const options = getShuffledOptions();
      options.forEach(option => {
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('description');
        expect(typeof option.label).toBe('string');
        expect(typeof option.value).toBe('string');
        expect(typeof option.description).toBe('string');
      });
    });

    it('should capitalize labels', () => {
      const options = getShuffledOptions();
      options.forEach(option => {
        expect(option.label.charAt(0)).toBe(option.label.charAt(0).toUpperCase());
      });
    });

    it('should have lowercase values', () => {
      const options = getShuffledOptions();
      options.forEach(option => {
        expect(option.value).toBe(option.value.toLowerCase());
      });
    });
  });

  describe('getResult', () => {
    it('should declare rock beats scissors', () => {
      const p1 = { id: 'user1', objectName: 'rock' };
      const p2 = { id: 'user2', objectName: 'scissors' };
      const result = getResult(p1, p2);
      expect(result).toContain('user1');
      expect(result).toContain('crushes');
    });

    it('should declare paper beats rock', () => {
      const p1 = { id: 'user1', objectName: 'paper' };
      const p2 = { id: 'user2', objectName: 'rock' };
      const result = getResult(p1, p2);
      expect(result).toContain('user1');
      expect(result).toContain('covers');
    });

    it('should declare scissors beats paper', () => {
      const p1 = { id: 'user1', objectName: 'scissors' };
      const p2 = { id: 'user2', objectName: 'paper' };
      const result = getResult(p1, p2);
      expect(result).toContain('user1');
      expect(result).toContain('cuts');
    });

    it('should handle a tie', () => {
      const p1 = { id: 'user1', objectName: 'rock' };
      const p2 = { id: 'user2', objectName: 'rock' };
      const result = getResult(p1, p2);
      expect(result).toContain('draw');
      expect(result).toContain('rock');
    });

    it('should format result with user IDs', () => {
      const p1 = { id: '123456', objectName: 'rock' };
      const p2 = { id: '789012', objectName: 'scissors' };
      const result = getResult(p1, p2);
      expect(result).toContain('<@123456>');
      expect(result).toContain('<@789012>');
    });
  });

  describe('RollDice', () => {
    it('should return an object with correct properties', () => {
      const result = RollDice(6, 'test wager', 3);
      expect(result).toHaveProperty('dice');
      expect(result).toHaveProperty('wager');
      expect(result).toHaveProperty('desired');
    });

    it('should return a number within range for 6-sided die', () => {
      const result = RollDice(6, null, null);
      expect(result.dice).toBeGreaterThanOrEqual(1);
      expect(result.dice).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result.dice)).toBe(true);
    });

    it('should return a number within range for 20-sided die', () => {
      const result = RollDice(20, null, null);
      expect(result.dice).toBeGreaterThanOrEqual(1);
      expect(result.dice).toBeLessThanOrEqual(20);
    });

    it('should preserve wager and desired values', () => {
      const wager = 'my soul';
      const desired = 6;
      const result = RollDice(6, wager, desired);
      expect(result.wager).toBe(wager);
      expect(result.desired).toBe(desired);
    });

    it('should produce different results over multiple rolls', () => {
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        results.add(RollDice(20, null, null).dice);
      }
      // Should have at least 5 different results in 20 rolls
      expect(results.size).toBeGreaterThan(5);
    });
  });
});
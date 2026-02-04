import { formatForTelLink, normalizeForSupabaseAuth } from '../utils';

describe('Utility Functions', () => {

  describe('formatForTelLink', () => {
    it('should return an empty string for null or undefined input', () => {
      expect(formatForTelLink(null)).toBe('');
      expect(formatForTelLink(undefined)).toBe('');
    });

    it('should add +98 for numbers starting with 09', () => {
      expect(formatForTelLink('09123456789')).toBe('+989123456789');
    });

    it('should add + for numbers starting with 98', () => {
      expect(formatForTelLink('989123456789')).toBe('+989123456789');
    });
    
    it('should handle numbers starting with 00', () => {
        expect(formatForTelLink('00989123456789')).toBe('+989123456789');
    });

    it('should not change numbers already starting with +', () => {
      expect(formatForTelLink('+989123456789')).toBe('+989123456789');
    });
    
    it('should handle 10 digit numbers starting with 9', () => {
      expect(formatForTelLink('9123456789')).toBe('+989123456789');
    });
    
    it('should return unparsable numbers as they are', () => {
      expect(formatForTelLink('12345')).toBe('12345');
    });
  });

  describe('normalizeForSupabaseAuth', () => {
    it('should normalize 09 numbers to +98', () => {
      expect(normalizeForSupabaseAuth('09123456789')).toBe('+989123456789');
    });

    it('should normalize 98 numbers to +98', () => {
      expect(normalizeForSupabaseAuth('989123456789')).toBe('+989123456789');
    });
    
    it('should handle numbers with spaces and dashes', () => {
      expect(normalizeForSupabaseAuth('0912-345 67 89')).toBe('+989123456789');
    });

    it('should throw an error for invalid numbers', () => {
      expect(() => normalizeForSupabaseAuth('12345')).toThrow('فرمت شماره تلفن موبایل وارد شده معتبر نیست.');
      expect(() => normalizeForSupabaseAuth('0912345678')).toThrow('فرمت شماره تلفن موبایل وارد شده معتبر نیست.');
    });
    
    it('should throw an error for empty input', () => {
        expect(() => normalizeForSupabaseAuth('')).toThrow('شماره تلفن نمی‌تواند خالی باشد.');
    });
  });
});

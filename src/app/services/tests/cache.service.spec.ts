import { TestBed } from '@angular/core/testing';
import { CacheService } from '../cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CacheService],
    });
    service = TestBed.inject(CacheService);
    service.clearAll();
  });

  afterEach(() => {
    service.clearAll();
  });

  describe('set', () => {
    it('should store data in cache', () => {
      const testData = { id: 1, name: 'Test' };
      service.set('test-key', testData);

      const cachedData = service.get<typeof testData>('test-key');
      expect(cachedData).toEqual(testData);
    });

    it('should store data with default TTL of 5 minutes', () => {
      const testData = 'test value';
      service.set('test-key', testData);

      const cachedData = service.get<string>('test-key');
      expect(cachedData).toBe(testData);
    });

    it('should store data with custom TTL', () => {
      const testData = 'test value';
      service.set('test-key', testData, 1000);

      const cachedData = service.get<string>('test-key');
      expect(cachedData).toBe(testData);
    });

    it('should overwrite existing data with same key', () => {
      service.set('test-key', 'first value');
      service.set('test-key', 'second value');

      const cachedData = service.get<string>('test-key');
      expect(cachedData).toBe('second value');
    });

    it('should store different types of data', () => {
      service.set('string-key', 'string value');
      service.set('number-key', 42);
      service.set('object-key', { name: 'test' });
      service.set('array-key', [1, 2, 3]);
      service.set('boolean-key', true);

      expect(service.get<string>('string-key')).toBe('string value');
      expect(service.get<number>('number-key')).toBe(42);
      expect(service.get<{ name: string }>('object-key')).toEqual({
        name: 'test',
      });
      expect(service.get<number[]>('array-key')).toEqual([1, 2, 3]);
      expect(service.get<boolean>('boolean-key')).toBe(true);
    });
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      const cachedData = service.get<string>('non-existent-key');
      expect(cachedData).toBeNull();
    });

    it('should return cached data within TTL period', () => {
      const testData = 'test value';
      service.set('test-key', testData, 10000);

      const cachedData = service.get<string>('test-key');
      expect(cachedData).toBe(testData);
    });

    it('should return null for expired data', (done) => {
      const testData = 'test value';
      service.set('test-key', testData, 50);

      setTimeout(() => {
        const cachedData = service.get<string>('test-key');
        expect(cachedData).toBeNull();
        done();
      }, 100);
    });

    it('should delete expired data from cache', (done) => {
      const testData = 'test value';
      service.set('test-key', testData, 50);

      setTimeout(() => {
        service.get<string>('test-key');
        const cachedDataAfterExpiry = service.get<string>('test-key');
        expect(cachedDataAfterExpiry).toBeNull();
        done();
      }, 100);
    });

    it('should handle multiple keys independently', () => {
      service.set('key1', 'value1', 10000);
      service.set('key2', 'value2', 10000);

      expect(service.get<string>('key1')).toBe('value1');
      expect(service.get<string>('key2')).toBe('value2');
    });

    it('should not affect other keys when one expires', (done) => {
      service.set('short-lived', 'expires soon', 50);
      service.set('long-lived', 'stays longer', 10000);

      setTimeout(() => {
        expect(service.get<string>('short-lived')).toBeNull();
        expect(service.get<string>('long-lived')).toBe('stays longer');
        done();
      }, 100);
    });
  });

  describe('clear', () => {
    it('should remove specific key from cache', () => {
      service.set('test-key', 'test value');
      service.clear('test-key');

      const cachedData = service.get<string>('test-key');
      expect(cachedData).toBeNull();
    });

    it('should not affect other keys when clearing one key', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');

      service.clear('key1');

      expect(service.get<string>('key1')).toBeNull();
      expect(service.get<string>('key2')).toBe('value2');
    });

    it('should handle clearing non-existent key gracefully', () => {
      expect(() => service.clear('non-existent-key')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should remove all keys from cache', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      service.clearAll();

      expect(service.get<string>('key1')).toBeNull();
      expect(service.get<string>('key2')).toBeNull();
      expect(service.get<string>('key3')).toBeNull();
    });

    it('should allow new data to be set after clearing all', () => {
      service.set('old-key', 'old value');
      service.clearAll();
      service.set('new-key', 'new value');

      expect(service.get<string>('old-key')).toBeNull();
      expect(service.get<string>('new-key')).toBe('new value');
    });

    it('should handle clearing empty cache gracefully', () => {
      expect(() => service.clearAll()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid successive sets and gets', () => {
      for (let i = 0; i < 100; i++) {
        service.set(`key-${i}`, `value-${i}`);
      }

      for (let i = 0; i < 100; i++) {
        expect(service.get<string>(`key-${i}`)).toBe(`value-${i}`);
      }
    });

    it('should handle mixed operations', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      expect(service.get<string>('key1')).toBe('value1');

      service.clear('key1');
      expect(service.get<string>('key1')).toBeNull();
      expect(service.get<string>('key2')).toBe('value2');

      service.set('key3', 'value3');
      service.clearAll();
      expect(service.get<string>('key2')).toBeNull();
      expect(service.get<string>('key3')).toBeNull();
    });

    it('should handle complex objects with nested data', () => {
      const complexData = {
        id: 1,
        name: 'Complex Object',
        nested: {
          level1: {
            level2: {
              value: 'deep value',
            },
          },
        },
        array: [1, 2, { prop: 'value' }],
      };

      service.set('complex-key', complexData);
      const retrieved = service.get<typeof complexData>('complex-key');

      expect(retrieved).toEqual(complexData);
      expect(retrieved?.nested.level1.level2.value).toBe('deep value');
    });
  });
});

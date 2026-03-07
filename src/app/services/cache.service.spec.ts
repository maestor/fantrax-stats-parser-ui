import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let now = 0;

  beforeEach(() => {
    service = new CacheService();
    now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores and returns cached values before expiry', () => {
    service.set('players', { count: 12 }, 500);

    expect(service.get<{ count: number }>('players')).toEqual({ count: 12 });
  });

  it('expires cached values and removes them after ttl', () => {
    service.set('players', { count: 12 }, 100);

    now = 1_050;
    expect(service.get<{ count: number }>('players')).toEqual({ count: 12 });

    now = 1_101;
    expect(service.get<{ count: number }>('players')).toBeNull();
    expect(service.get<{ count: number }>('players')).toBeNull();
  });

  it('clears a single key without affecting others', () => {
    service.set('players', { count: 12 });
    service.set('goalies', { count: 5 });

    service.clear('players');

    expect(service.get<{ count: number }>('players')).toBeNull();
    expect(service.get<{ count: number }>('goalies')).toEqual({ count: 5 });
  });

  it('clears all cached entries', () => {
    service.set('players', { count: 12 });
    service.set('goalies', { count: 5 });

    service.clearAll();

    expect(service.get<{ count: number }>('players')).toBeNull();
    expect(service.get<{ count: number }>('goalies')).toBeNull();
  });
});

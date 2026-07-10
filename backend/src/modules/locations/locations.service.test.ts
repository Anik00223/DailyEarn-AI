import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchLocations } from './locations.service';
import { redisGet, redisSet } from '../../config/redis';

// Mock Redis functions
vi.mock('../../config/redis', () => ({
  redisGet: vi.fn(),
  redisSet: vi.fn(),
}));

describe('locations.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should return empty list if query is too short', async () => {
    const results = await searchLocations('a');
    expect(results).toEqual([]);
    expect(redisGet).not.toHaveBeenCalled();
  });

  it('should return cached locations from Redis on hit', async () => {
    const cachedData = [
      { city: 'Silchar', state: 'Assam', display: 'Silchar, Assam' },
    ];
    vi.mocked(redisGet).mockResolvedValue(JSON.stringify(cachedData));

    const results = await searchLocations('silchar');
    expect(results).toEqual(cachedData);
    expect(redisGet).toHaveBeenCalledWith('location:search:silchar');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fetch from Nominatim and cache in Redis on cache miss', async () => {
    vi.mocked(redisGet).mockResolvedValue(null);

    const mockOSMResponse = [
      {
        display_name: 'Silchar, Cachar, Assam, India',
        address: {
          city: 'Silchar',
          county: 'Cachar',
          state: 'Assam',
          country: 'India',
        },
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOSMResponse,
      })
    );

    const results = await searchLocations('silchar');

    expect(results).toEqual([
      {
        city: 'Silchar',
        state: 'Assam',
        display: 'Silchar, Cachar, Assam',
      },
    ]);
    expect(redisGet).toHaveBeenCalledWith('location:search:silchar');
    expect(global.fetch).toHaveBeenCalled();
    expect(redisSet).toHaveBeenCalledWith(
      'location:search:silchar',
      JSON.stringify(results),
      86400
    );
  });

  it('should handle API HTTP errors gracefully and return empty list', async () => {
    vi.mocked(redisGet).mockResolvedValue(null);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    const results = await searchLocations('silchar');
    expect(results).toEqual([]);
    expect(redisSet).not.toHaveBeenCalled();
  });
});

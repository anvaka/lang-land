/**
 * Service for managing region geojson loading and caching
 */
class RegionsService {
  constructor() {
    // Cache to store loaded region data
    this.regionCache = new Map();
    // Track regions currently being loaded to prevent duplicate requests
    this.loadingRegions = new Set();
  }

  /**
   * Load region data for given IDs if not already cached
   * @param {Array<string>} regionIds - Array of region IDs to load
   * @returns {Promise<Object>} - Object with loaded region data by ID
   */
  async loadRegions(regionIds) {
    if (!regionIds || regionIds.length === 0) return {};

    const loadPromises = [];
    const regionsToLoad = [];

    // Filter out already cached or loading regions
    for (const id of regionIds) {
      if (!this.regionCache.has(id) && !this.loadingRegions.has(id)) {
        regionsToLoad.push(id);
        this.loadingRegions.add(id);
        
        const loadPromise = this.fetchRegion(id)
          .then(data => {
            this.regionCache.set(id, data);
            this.loadingRegions.delete(id);
            return { id, data };
          })
          .catch(error => {
            console.error(`Failed to load region ${id}:`, error);
            this.loadingRegions.delete(id);
            return { id, data: null };
          });
          
        loadPromises.push(loadPromise);
      }
    }

    // Wait for all regions to load
    if (loadPromises.length > 0) {
      await Promise.all(loadPromises);
    }

    // Return all requested regions from cache
    const result = {};
    for (const id of regionIds) {
      if (this.regionCache.has(id)) {
        result[id] = this.regionCache.get(id);
      }
    }
    
    return result;
  }

  /**
   * Fetch a single region file
   * @param {string} id - Region ID
   * @returns {Promise<Object>} - GeoJSON data for the region
   */
  async fetchRegion(id) {
    const response = await fetch(`regions/${id}_regions.geojson`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Check if a region is already cached
   * @param {string} id - Region ID
   * @returns {boolean} - Whether the region is cached
   */
  hasRegion(id) {
    return this.regionCache.has(id);
  }

  /**
   * Get a cached region by ID
   * @param {string} id - Region ID
   * @returns {Object|null} - GeoJSON data for the region or null if not cached
   */
  getRegion(id) {
    return this.regionCache.get(id) || null;
  }
}

// Export singleton instance
export const regionsService = new RegionsService();
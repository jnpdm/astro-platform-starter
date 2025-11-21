/**
 * Configuration Cache Utility
 * 
 * Provides in-memory caching for questionnaire and documentation configurations
 * to reduce file system reads and improve performance.
 * 
 * Requirements: 8.1, 8.2
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

class ConfigCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private readonly TTL = 5 * 60 * 1000; // 5 minutes cache TTL

    /**
     * Get cached configuration or load and cache it
     */
    async get<T>(key: string, loader: () => Promise<T>): Promise<T> {
        const cached = this.cache.get(key);

        // Return cached data if valid
        if (cached && Date.now() - cached.timestamp < this.TTL) {
            return cached.data as T;
        }

        // Load fresh data
        const data = await loader();

        // Cache the data
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    /**
     * Invalidate a specific cache entry
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cached entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
export const configCache = new ConfigCache();

/**
 * Load questionnaire configuration with caching
 */
export async function loadQuestionnaireConfig(questionnaireId: string) {
    return configCache.get(
        `questionnaire:${questionnaireId}`,
        async () => {
            const config = await import(`../config/questionnaires/${questionnaireId}.json`);
            return config.default;
        }
    );
}

/**
 * Load documentation configuration with caching
 */
export async function loadDocumentationConfig() {
    return configCache.get(
        'documentation',
        async () => {
            const config = await import('../config/documentation.json');
            return config.default;
        }
    );
}

/**
 * Load gates configuration with caching
 */
export async function loadGatesConfig() {
    return configCache.get(
        'gates',
        async () => {
            const config = await import('../config/gates.json');
            return config.default;
        }
    );
}

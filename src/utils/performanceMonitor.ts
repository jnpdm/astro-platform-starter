/**
 * Performance Monitoring Utility
 * 
 * Provides utilities for monitoring and logging performance metrics
 * in the browser and during development.
 * 
 * Requirements: 8.1, 8.2
 */

interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private marks: Map<string, number> = new Map();
    private enabled: boolean = false;

    constructor() {
        // Enable in development or when explicitly requested
        this.enabled = import.meta.env.DEV ||
            (typeof window !== 'undefined' && window.location.search.includes('perf=true'));
    }

    /**
     * Start measuring a performance metric
     */
    start(name: string): void {
        if (!this.enabled) return;

        this.marks.set(name, performance.now());
    }

    /**
     * End measuring a performance metric
     */
    end(name: string): number | null {
        if (!this.enabled) return null;

        const startTime = this.marks.get(name);
        if (!startTime) {
            console.warn(`Performance mark "${name}" not found`);
            return null;
        }

        const duration = performance.now() - startTime;
        this.marks.delete(name);

        const metric: PerformanceMetric = {
            name,
            duration,
            timestamp: Date.now()
        };

        this.metrics.push(metric);

        // Log in development
        if (import.meta.env.DEV) {
            console.log(`⏱️  ${name}: ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    /**
     * Measure a function execution time
     */
    async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
        if (!this.enabled) {
            return await fn();
        }

        this.start(name);
        try {
            const result = await fn();
            this.end(name);
            return result;
        } catch (error) {
            this.end(name);
            throw error;
        }
    }

    /**
     * Get all recorded metrics
     */
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Get metrics by name pattern
     */
    getMetricsByPattern(pattern: string | RegExp): PerformanceMetric[] {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return this.metrics.filter(m => regex.test(m.name));
    }

    /**
     * Get average duration for a metric name
     */
    getAverage(name: string): number | null {
        const matching = this.metrics.filter(m => m.name === name);
        if (matching.length === 0) return null;

        const total = matching.reduce((sum, m) => sum + m.duration, 0);
        return total / matching.length;
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics = [];
        this.marks.clear();
    }

    /**
     * Log a summary of all metrics
     */
    logSummary(): void {
        if (!this.enabled || this.metrics.length === 0) return;

        console.group('📊 Performance Summary');

        // Group by name
        const grouped = new Map<string, number[]>();
        for (const metric of this.metrics) {
            if (!grouped.has(metric.name)) {
                grouped.set(metric.name, []);
            }
            grouped.get(metric.name)!.push(metric.duration);
        }

        // Calculate statistics
        for (const [name, durations] of grouped) {
            const count = durations.length;
            const total = durations.reduce((sum, d) => sum + d, 0);
            const avg = total / count;
            const min = Math.min(...durations);
            const max = Math.max(...durations);

            console.log(`${name}:`);
            console.log(`  Count: ${count}`);
            console.log(`  Avg:   ${avg.toFixed(2)}ms`);
            console.log(`  Min:   ${min.toFixed(2)}ms`);
            console.log(`  Max:   ${max.toFixed(2)}ms`);
        }

        console.groupEnd();
    }

    /**
     * Monitor Web Vitals (if available)
     */
    monitorWebVitals(): void {
        if (typeof window === 'undefined' || !this.enabled) return;

        // Monitor Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1] as any;

                    if (lastEntry) {
                        console.log(`🎨 LCP: ${lastEntry.renderTime || lastEntry.loadTime}ms`);
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                // Monitor First Input Delay (FID)
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        console.log(`⚡ FID: ${entry.processingStart - entry.startTime}ms`);
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });

                // Monitor Cumulative Layout Shift (CLS)
                let clsScore = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        if (!entry.hadRecentInput) {
                            clsScore += entry.value;
                        }
                    });
                    console.log(`📐 CLS: ${clsScore.toFixed(4)}`);
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (error) {
                console.warn('Failed to monitor Web Vitals:', error);
            }
        }
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in browser
if (typeof window !== 'undefined') {
    performanceMonitor.monitorWebVitals();

    // Log summary on page unload
    window.addEventListener('beforeunload', () => {
        performanceMonitor.logSummary();
    });
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(name?: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        const metricName = name || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = async function (...args: any[]) {
            return performanceMonitor.measure(metricName, () =>
                originalMethod.apply(this, args)
            );
        };

        return descriptor;
    };
}

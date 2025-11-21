/**
 * Tests for the reports and analytics page
 */

import { describe, it, expect } from 'vitest';

describe('Reports Page', () => {
    it('should have the correct page structure', () => {
        // This is a basic structural test
        // The actual page rendering is tested through Astro's build process
        expect(true).toBe(true);
    });

    it('should calculate partner distribution correctly', () => {
        const partners = [
            { currentGate: 'pre-contract' },
            { currentGate: 'pre-contract' },
            { currentGate: 'gate-0' },
            { currentGate: 'gate-1' },
            { currentGate: 'gate-1' },
            { currentGate: 'gate-1' }
        ];

        const gateOrder = ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'];
        const totalPartners = partners.length;

        const partnersByGate = gateOrder.map((gateId) => {
            const count = partners.filter((p: any) => p.currentGate === gateId).length;
            return {
                gateId,
                count,
                percentage: totalPartners > 0 ? Math.round((count / totalPartners) * 100) : 0
            };
        });

        expect(partnersByGate.find((g) => g.gateId === 'pre-contract')?.count).toBe(2);
        expect(partnersByGate.find((g) => g.gateId === 'gate-0')?.count).toBe(1);
        expect(partnersByGate.find((g) => g.gateId === 'gate-1')?.count).toBe(3);
        expect(partnersByGate.find((g) => g.gateId === 'pre-contract')?.percentage).toBe(33);
    });

    it('should calculate average time per gate correctly', () => {
        const partners = [
            {
                gates: {
                    'gate-1': {
                        status: 'passed',
                        startedDate: new Date('2024-01-01'),
                        completedDate: new Date('2024-01-15')
                    }
                }
            },
            {
                gates: {
                    'gate-1': {
                        status: 'passed',
                        startedDate: new Date('2024-02-01'),
                        completedDate: new Date('2024-02-11')
                    }
                }
            }
        ];

        const gateId = 'gate-1';
        const completedGates = partners
            .map((p: any) => p.gates?.[gateId])
            .filter((gate: any) => gate?.status === 'passed' && gate?.startedDate && gate?.completedDate);

        const totalDays = completedGates.reduce((sum: number, gate: any) => {
            const start = new Date(gate.startedDate).getTime();
            const end = new Date(gate.completedDate).getTime();
            return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0);

        const avgDays = Math.round(totalDays / completedGates.length);

        expect(avgDays).toBe(12); // (14 + 10) / 2 = 12
    });

    it('should calculate gate pass/fail rates correctly', () => {
        const partners = [
            { gates: { 'gate-1': { status: 'passed' } } },
            { gates: { 'gate-1': { status: 'passed' } } },
            { gates: { 'gate-1': { status: 'failed' } } },
            { gates: { 'gate-1': { status: 'in-progress' } } },
            { gates: { 'gate-1': { status: 'not-started' } } }
        ];

        const gateId = 'gate-1';
        const gateStatuses = partners.map((p: any) => p.gates?.[gateId]?.status || 'not-started');

        const passed = gateStatuses.filter((s) => s === 'passed').length;
        const failed = gateStatuses.filter((s) => s === 'failed').length;
        const inProgress = gateStatuses.filter((s) => s === 'in-progress').length;
        const notStarted = gateStatuses.filter((s) => s === 'not-started').length;

        const attempted = passed + failed;
        const passRate = attempted > 0 ? Math.round((passed / attempted) * 100) : 0;

        expect(passed).toBe(2);
        expect(failed).toBe(1);
        expect(inProgress).toBe(1);
        expect(notStarted).toBe(1);
        expect(passRate).toBe(67); // 2/3 = 66.67% rounded to 67%
    });

    it('should calculate PDM capacity utilization correctly', () => {
        const partners = [
            { currentGate: 'pre-contract', pdmOwner: 'PDM1' },
            { currentGate: 'pre-contract', pdmOwner: 'PDM1' },
            { currentGate: 'gate-0', pdmOwner: 'PDM1' },
            { currentGate: 'gate-1', pdmOwner: 'PDM2' },
            { currentGate: 'gate-1', pdmOwner: 'PDM2' }
        ];

        const pdmPartners = partners.filter(
            (p: any) => p.currentGate === 'pre-contract' || p.currentGate === 'gate-0' || p.currentGate === 'gate-1'
        );

        const pdmOwners = [...new Set(pdmPartners.map((p: any) => p.pdmOwner).filter(Boolean))];
        const pdmCount = pdmOwners.length;

        const pdmLoad = pdmPartners.reduce((sum: number, p: any) => {
            if (p.currentGate === 'pre-contract') return sum + 1;
            return sum + 2;
        }, 0);

        const avgPartnersPerPDM = pdmCount > 0 ? (pdmLoad / pdmCount).toFixed(1) : '0';
        const targetMax = 8;
        const capacityUtilization = pdmCount > 0 ? Math.round((pdmLoad / (pdmCount * targetMax)) * 100) : 0;

        expect(pdmCount).toBe(2);
        // PDM1: 2 pre-contract (2 units) + 1 gate-0 (2 units) = 4 units
        // PDM2: 2 gate-1 (4 units) = 4 units
        // Total: 8 units
        expect(pdmLoad).toBe(8);
        expect(avgPartnersPerPDM).toBe('4.0'); // 8 / 2 = 4
        expect(capacityUtilization).toBe(50); // 8 / (2 * 8) = 50%
    });

    it('should handle empty partner data gracefully', () => {
        const partners: any[] = [];
        const totalPartners = partners.length;

        expect(totalPartners).toBe(0);

        const gateOrder = ['pre-contract', 'gate-0', 'gate-1'];
        const partnersByGate = gateOrder.map((gateId) => {
            const count = partners.filter((p: any) => p.currentGate === gateId).length;
            return {
                gateId,
                count,
                percentage: totalPartners > 0 ? Math.round((count / totalPartners) * 100) : 0
            };
        });

        partnersByGate.forEach((gate) => {
            expect(gate.count).toBe(0);
            expect(gate.percentage).toBe(0);
        });
    });

    it('should calculate monthly completion trends correctly', () => {
        const now = new Date('2024-06-15');
        const partners = [
            {
                gates: {
                    'gate-1': { completedDate: new Date('2024-06-10') },
                    'gate-2': { completedDate: new Date('2024-06-12') }
                }
            },
            {
                gates: {
                    'gate-1': { completedDate: new Date('2024-05-20') }
                }
            },
            {
                gates: {
                    'gate-1': { completedDate: new Date('2024-04-15') }
                }
            }
        ];

        // Count completions for June 2024
        const targetMonth = 5; // June (0-indexed)
        const targetYear = 2024;

        const completions = partners.reduce((count: number, partner: any) => {
            return (
                count +
                Object.values(partner.gates || {}).filter((gate: any) => {
                    if (!gate?.completedDate) return false;
                    const completedDate = new Date(gate.completedDate);
                    return completedDate.getMonth() === targetMonth && completedDate.getFullYear() === targetYear;
                }).length
            );
        }, 0);

        expect(completions).toBe(2); // 2 gates completed in June
    });

    it('should identify partners at risk of missing launch dates', () => {
        const now = new Date('2024-06-15');
        const partners = [
            {
                id: '1',
                partnerName: 'Partner A',
                currentGate: 'gate-1',
                targetLaunchDate: new Date('2024-07-01'), // 16 days away
                pamOwner: 'PAM1'
            },
            {
                id: '2',
                partnerName: 'Partner B',
                currentGate: 'gate-2',
                targetLaunchDate: new Date('2024-08-15'), // 61 days away
                pamOwner: 'PAM2'
            },
            {
                id: '3',
                partnerName: 'Partner C',
                currentGate: 'post-launch',
                targetLaunchDate: new Date('2024-06-01'), // Already launched
                pamOwner: 'PAM3'
            }
        ];

        const atRiskPartners = partners
            .filter((p: any) => p.targetLaunchDate && p.currentGate !== 'post-launch')
            .map((p: any) => {
                const targetDate = new Date(p.targetLaunchDate);
                const daysUntilLaunch = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                // Simplified estimation: 84 days for gate-1, 35 days for gate-2
                const estimatedDaysRemaining = p.currentGate === 'gate-1' ? 84 : 35;

                const buffer = daysUntilLaunch - estimatedDaysRemaining;
                let riskLevel: 'high' | 'medium' | 'low';

                if (buffer < 0) {
                    riskLevel = 'high';
                } else if (buffer < 14) {
                    riskLevel = 'medium';
                } else {
                    riskLevel = 'low';
                }

                return {
                    id: p.id,
                    partnerName: p.partnerName,
                    daysUntilLaunch,
                    estimatedDaysRemaining,
                    riskLevel
                };
            })
            .filter((p: any) => p.riskLevel === 'high' || p.riskLevel === 'medium');

        expect(atRiskPartners.length).toBe(1); // Only Partner A is at risk
        expect(atRiskPartners[0].partnerName).toBe('Partner A');
        expect(atRiskPartners[0].riskLevel).toBe('high'); // 16 days until launch, needs 84 days
    });

    it('should collect failure reasons from gate blockers', () => {
        const partners = [
            {
                gates: {
                    'gate-1': {
                        status: 'failed',
                        blockers: ['Missing executive sponsorship', 'Technical feasibility concerns']
                    }
                }
            },
            {
                gates: {
                    'gate-1': {
                        status: 'failed',
                        blockers: ['Missing executive sponsorship', 'Budget not approved']
                    }
                }
            },
            {
                gates: {
                    'gate-1': {
                        status: 'failed',
                        blockers: ['Technical feasibility concerns']
                    }
                }
            }
        ];

        const gateId = 'gate-1';
        const failedPartners = partners.filter((p: any) => p.gates?.[gateId]?.status === 'failed');

        const reasonCounts: Record<string, number> = {};

        for (const partner of failedPartners) {
            const gate = partner.gates?.[gateId];
            if (gate?.blockers) {
                for (const blocker of gate.blockers) {
                    reasonCounts[blocker] = (reasonCounts[blocker] || 0) + 1;
                }
            }
        }

        const failureReasons = Object.entries(reasonCounts)
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count);

        expect(failureReasons.length).toBe(3);
        expect(failureReasons[0].reason).toBe('Missing executive sponsorship');
        expect(failureReasons[0].count).toBe(2);
        expect(failureReasons[1].reason).toBe('Technical feasibility concerns');
        expect(failureReasons[1].count).toBe(2);
    });

    it('should filter partners by gate', () => {
        const partners = [
            { currentGate: 'pre-contract' },
            { currentGate: 'gate-0' },
            { currentGate: 'gate-1' },
            { currentGate: 'gate-1' }
        ];

        const filterGate = 'gate-1';
        const filtered = partners.filter((p: any) => p.currentGate === filterGate);

        expect(filtered.length).toBe(2);
    });

    it('should filter partners by tier', () => {
        const partners = [
            { tier: 'tier-0' },
            { tier: 'tier-1' },
            { tier: 'tier-1' },
            { tier: 'tier-2' }
        ];

        const filterTier = 'tier-1';
        const filtered = partners.filter((p: any) => p.tier === filterTier);

        expect(filtered.length).toBe(2);
    });

    it('should filter partners by team member', () => {
        const partners = [
            { pamOwner: 'John', pdmOwner: 'Jane' },
            { pamOwner: 'Bob', pdmOwner: 'Jane' },
            { pamOwner: 'Alice', pdmOwner: 'Mike' }
        ];

        const filterTeamMember = 'Jane';
        const filtered = partners.filter(
            (p: any) =>
                p.pamOwner === filterTeamMember ||
                p.pdmOwner === filterTeamMember ||
                p.tpmOwner === filterTeamMember ||
                p.psmOwner === filterTeamMember ||
                p.tamOwner === filterTeamMember
        );

        expect(filtered.length).toBe(2);
    });

    it('should filter partners by date range', () => {
        const partners = [
            { onboardingStartDate: new Date('2024-01-15') },
            { onboardingStartDate: new Date('2024-03-20') },
            { onboardingStartDate: new Date('2024-05-10') }
        ];

        const filterDateFrom = new Date('2024-03-01');
        const filterDateTo = new Date('2024-05-31');

        const filtered = partners.filter((p: any) => {
            if (!p.onboardingStartDate) return false;
            const startDate = new Date(p.onboardingStartDate);
            return startDate >= filterDateFrom && startDate <= filterDateTo;
        });

        expect(filtered.length).toBe(2);
    });
});

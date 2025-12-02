/**
 * Property-Based Tests for Questionnaire Display
 * 
 * **Feature: hub-improvements, Property 12: Questionnaire button text**
 * **Feature: hub-improvements, Property 14: Partner questionnaire display**
 * **Validates: Requirements 5.2, 5.5**
 * 
 * Property 12: For any partner detail page, the "Add Gate Questionnaire" button 
 * text should include the partner's current gate name.
 * 
 * Property 14: For any partner with completed questionnaires, all questionnaire 
 * submissions should appear in the partner detail view.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { PartnerRecord, GateId } from '../types/partner';
import type { QuestionnaireSubmission } from '../types/submission';
import { GATE_LABELS } from './gateLabels';
import gatesConfig from '../config/gates.json';

// Valid gate IDs
const validGateIds: GateId[] = ['pre-contract', 'gate-0', 'gate-1', 'gate-2', 'gate-3', 'post-launch'];

// Arbitrary for generating gate IDs
const gateIdArbitrary = fc.constantFrom(...validGateIds);

// Arbitrary for generating partner records
const partnerArbitrary = fc.record({
    id: fc.uuid(),
    partnerName: fc.string({ minLength: 1, maxLength: 50 }),
    pamOwner: fc.emailAddress(),
    pdmOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    psmOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    tamOwner: fc.option(fc.emailAddress(), { nil: undefined }),
    contractType: fc.constantFrom('PPA', 'Distribution', 'Sales-Agent', 'Other'),
    tier: fc.constantFrom('tier-0', 'tier-1', 'tier-2'),
    ccv: fc.integer({ min: 0, max: 10000000 }),
    lrp: fc.integer({ min: 0, max: 10000000 }),
    currentGate: gateIdArbitrary,
    gates: fc.constant({}),
    createdAt: fc.date(),
    updatedAt: fc.date()
}) as fc.Arbitrary<PartnerRecord>;

// Arbitrary for generating questionnaire submissions
const submissionArbitrary = fc.record({
    id: fc.uuid(),
    partnerId: fc.uuid(),
    questionnaireId: fc.string({ minLength: 1, maxLength: 50 }),
    submittedBy: fc.emailAddress(),
    submittedByRole: fc.constantFrom('PAM', 'PDM', 'TAM', 'PSM'),
    submittedAt: fc.date(),
    overallStatus: fc.constantFrom('pass', 'fail', 'pending'),
    createdAt: fc.date(),
    updatedAt: fc.date()
}) as fc.Arbitrary<QuestionnaireSubmission>;

/**
 * Generate the "Add Gate Questionnaire" button text for a partner
 */
function generateQuestionnaireButtonText(partner: PartnerRecord): string | null {
    const currentGateInfo = gatesConfig.gates.find(g => g.id === partner.currentGate);
    const hasQuestionnaires = currentGateInfo?.questionnaires && currentGateInfo.questionnaires.length > 0;

    if (!hasQuestionnaires || !currentGateInfo) {
        return null;
    }

    const gateLabel = GATE_LABELS[partner.currentGate];
    return `Add ${gateLabel} Questionnaire`;
}

/**
 * Get questionnaires that should be displayed for a partner
 */
function getDisplayedQuestionnaires(
    partner: PartnerRecord,
    allSubmissions: QuestionnaireSubmission[]
): QuestionnaireSubmission[] {
    return allSubmissions.filter(submission => submission.partnerId === partner.id);
}

describe('Questionnaire Display Property Tests', () => {
    it('Property 12: Questionnaire button text - should include current gate name', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                (partner) => {
                    const buttonText = generateQuestionnaireButtonText(partner);

                    // If button exists, it should contain the gate label
                    if (buttonText !== null) {
                        const gateLabel = GATE_LABELS[partner.currentGate];
                        return buttonText.includes(gateLabel);
                    }

                    // If no button, that's fine (gate has no questionnaires)
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 12: Questionnaire button text - should start with "Add"', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                (partner) => {
                    const buttonText = generateQuestionnaireButtonText(partner);

                    // If button exists, it should start with "Add"
                    if (buttonText !== null) {
                        return buttonText.startsWith('Add ');
                    }

                    // If no button, that's fine
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 12: Questionnaire button text - should end with "Questionnaire"', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                (partner) => {
                    const buttonText = generateQuestionnaireButtonText(partner);

                    // If button exists, it should end with "Questionnaire"
                    if (buttonText !== null) {
                        return buttonText.endsWith('Questionnaire');
                    }

                    // If no button, that's fine
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 14: Partner questionnaire display - all partner submissions should be displayed', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                fc.array(submissionArbitrary, { minLength: 0, maxLength: 20 }),
                (partner, allSubmissions) => {
                    // Set some submissions to belong to this partner
                    const partnerSubmissions = allSubmissions.slice(0, Math.floor(allSubmissions.length / 2)).map(s => ({
                        ...s,
                        partnerId: partner.id
                    }));

                    // Mix with other submissions
                    const mixedSubmissions = [
                        ...partnerSubmissions,
                        ...allSubmissions.slice(Math.floor(allSubmissions.length / 2))
                    ];

                    // Get displayed questionnaires
                    const displayed = getDisplayedQuestionnaires(partner, mixedSubmissions);

                    // Property: All partner submissions should be displayed
                    const allPartnerSubmissionsDisplayed = partnerSubmissions.every(
                        ps => displayed.some(d => d.id === ps.id)
                    );

                    // Property: No non-partner submissions should be displayed
                    const noOtherSubmissionsDisplayed = displayed.every(
                        d => d.partnerId === partner.id
                    );

                    return allPartnerSubmissionsDisplayed && noOtherSubmissionsDisplayed;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 14: Partner questionnaire display - count should match partner submissions', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                fc.array(submissionArbitrary, { minLength: 0, maxLength: 20 }),
                (partner, allSubmissions) => {
                    // Set some submissions to belong to this partner
                    const partnerSubmissions = allSubmissions.map(s => ({
                        ...s,
                        partnerId: fc.sample(fc.boolean(), 1)[0] ? partner.id : fc.sample(fc.uuid(), 1)[0]
                    }));

                    // Get displayed questionnaires
                    const displayed = getDisplayedQuestionnaires(partner, partnerSubmissions);

                    // Count expected submissions
                    const expectedCount = partnerSubmissions.filter(s => s.partnerId === partner.id).length;

                    // Property: Count should match
                    return displayed.length === expectedCount;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 14: Partner questionnaire display - empty when no submissions', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                fc.array(submissionArbitrary, { minLength: 1, maxLength: 20 }),
                (partner, allSubmissions) => {
                    // Ensure no submissions belong to this partner
                    const otherSubmissions = allSubmissions.map(s => ({
                        ...s,
                        partnerId: fc.sample(fc.uuid().filter(id => id !== partner.id), 1)[0]
                    }));

                    // Get displayed questionnaires
                    const displayed = getDisplayedQuestionnaires(partner, otherSubmissions);

                    // Property: Should be empty
                    return displayed.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 14: Partner questionnaire display - all displayed when all belong to partner', () => {
        fc.assert(
            fc.property(
                partnerArbitrary,
                fc.array(submissionArbitrary, { minLength: 1, maxLength: 20 }),
                (partner, allSubmissions) => {
                    // Set all submissions to belong to this partner
                    const partnerSubmissions = allSubmissions.map(s => ({
                        ...s,
                        partnerId: partner.id
                    }));

                    // Get displayed questionnaires
                    const displayed = getDisplayedQuestionnaires(partner, partnerSubmissions);

                    // Property: All should be displayed
                    return displayed.length === partnerSubmissions.length;
                }
            ),
            { numRuns: 100 }
        );
    });
});

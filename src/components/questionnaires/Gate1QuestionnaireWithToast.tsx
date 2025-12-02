/**
 * Wrapper component that provides Toast context to Gate1Questionnaire
 */

import { ToastProvider } from '../../contexts/ToastContext';
import Gate1Questionnaire from './Gate1Questionnaire';
import type { QuestionnaireConfig } from '../../types/questionnaire';

interface Gate1QuestionnaireWithToastProps {
    config: QuestionnaireConfig;
    existingData?: any;
    partnerId: string;
    mode?: 'edit' | 'view';
    templateVersion?: number;
}

export default function Gate1QuestionnaireWithToast(props: Gate1QuestionnaireWithToastProps) {
    return (
        <ToastProvider>
            <Gate1Questionnaire {...props} />
        </ToastProvider>
    );
}

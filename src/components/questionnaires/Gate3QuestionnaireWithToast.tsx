/**
 * Wrapper component that provides Toast context to Gate3Questionnaire
 */

import { ToastProvider } from '../../contexts/ToastContext';
import Gate3Questionnaire from './Gate3Questionnaire';
import type { QuestionnaireConfig } from '../../types/questionnaire';

interface Gate3QuestionnaireWithToastProps {
    config: QuestionnaireConfig;
    existingData?: any;
    partnerId: string;
    mode: 'edit' | 'view';
}

export default function Gate3QuestionnaireWithToast(props: Gate3QuestionnaireWithToastProps) {
    return (
        <ToastProvider>
            <Gate3Questionnaire {...props} />
        </ToastProvider>
    );
}

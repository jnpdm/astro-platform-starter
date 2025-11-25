/**
 * Wrapper component that provides Toast context to Gate0Questionnaire
 * This is needed because client:only creates separate component islands
 */

import { ToastProvider } from '../../contexts/ToastContext';
import Gate0Questionnaire from './Gate0Questionnaire';
import type { QuestionnaireConfig } from '../../types/questionnaire';

interface Gate0QuestionnaireWithToastProps {
    config: QuestionnaireConfig;
    existingData?: any;
    partnerId: string;
    mode?: 'edit' | 'view';
}

export default function Gate0QuestionnaireWithToast(props: Gate0QuestionnaireWithToastProps) {
    return (
        <ToastProvider>
            <Gate0Questionnaire {...props} />
        </ToastProvider>
    );
}

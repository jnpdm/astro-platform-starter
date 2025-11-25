/**
 * Wrapper component that provides Toast context to Gate2Questionnaire
 */

import { ToastProvider } from '../../contexts/ToastContext';
import Gate2Questionnaire from './Gate2Questionnaire';
import type { QuestionnaireConfig } from '../../types/questionnaire';

interface Gate2QuestionnaireWithToastProps {
    config: QuestionnaireConfig;
    existingData?: any;
    partnerId: string;
    mode?: 'edit' | 'view';
}

export default function Gate2QuestionnaireWithToast(props: Gate2QuestionnaireWithToastProps) {
    return (
        <ToastProvider>
            <Gate2Questionnaire {...props} />
        </ToastProvider>
    );
}

/**
 * Wrapper component that provides Toast context to PreContractQuestionnaire
 */

import { ToastProvider } from '../../contexts/ToastContext';
import PreContractQuestionnaire from './PreContractQuestionnaire';
import type { QuestionnaireConfig } from '../../types/questionnaire';

interface PreContractQuestionnaireWithToastProps {
    config: QuestionnaireConfig;
    existingData?: any;
    partnerId: string;
    mode?: 'edit' | 'view';
    templateVersion?: number;
}

export default function PreContractQuestionnaireWithToast(props: PreContractQuestionnaireWithToastProps) {
    return (
        <ToastProvider>
            <PreContractQuestionnaire {...props} />
        </ToastProvider>
    );
}

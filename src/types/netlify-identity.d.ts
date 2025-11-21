/**
 * Type declarations for Netlify Identity Widget
 */

declare global {
    interface Window {
        netlifyIdentity?: NetlifyIdentity;
        kuiperAuth?: KuiperAuth;
    }
}

export interface NetlifyIdentityUser {
    id: string;
    email: string;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
        [key: string]: any;
    };
    app_metadata?: {
        role?: string;
        roles?: string[];
        provider?: string;
        [key: string]: any;
    };
    created_at: string;
    updated_at?: string;
    confirmed_at?: string;
    confirmation_sent_at?: string;
    recovery_sent_at?: string;
    email_change_sent_at?: string;
    new_email?: string;
    invited_at?: string;
    action_link?: string;
    aud?: string;
    role?: string;
}

export interface NetlifyIdentity {
    init: (config?: NetlifyIdentityConfig) => void;
    open: (tab?: 'login' | 'signup') => void;
    close: () => void;
    currentUser: () => NetlifyIdentityUser | null;
    logout: () => Promise<void>;
    refresh: (force?: boolean) => Promise<NetlifyIdentityUser | null>;
    on: (event: NetlifyIdentityEvent, callback: (user?: NetlifyIdentityUser | Error) => void) => void;
    off: (event: NetlifyIdentityEvent, callback?: (user?: NetlifyIdentityUser | Error) => void) => void;
    store?: {
        user: NetlifyIdentityUser | null;
        modal: {
            page: string;
        };
    };
}

export interface NetlifyIdentityConfig {
    container?: string;
    locale?: string;
    APIUrl?: string;
    logo?: boolean;
    namePlaceholder?: string;
    [key: string]: any;
}

export type NetlifyIdentityEvent =
    | 'init'
    | 'login'
    | 'logout'
    | 'signup'
    | 'error'
    | 'open'
    | 'close';

export interface KuiperAuth {
    login: () => void;
    logout: () => void;
    signup: () => void;
    getCurrentUser: () => any;
}

export { };

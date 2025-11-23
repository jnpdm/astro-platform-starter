/// <reference types="astro/client" />

import type { AuthUser } from './middleware/auth';

declare namespace App {
    interface Locals {
        user?: AuthUser;
    }
}

// Global window extensions for Auth0
interface Window {
    kuiperAuth?: {
        login: () => Promise<void>;
        logout: () => Promise<void>;
        getCurrentUser: () => AuthUser | null;
        isAuthenticated: () => boolean;
    };
}

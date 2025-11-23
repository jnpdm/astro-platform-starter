/// <reference types="astro/client" />

import type { AuthUser } from './middleware/auth';

declare namespace App {
    interface Locals {
        user?: AuthUser;
    }
}

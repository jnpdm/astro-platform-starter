/**
 * Digital signature interfaces
 * Defines the structure for capturing and storing digital signatures
 */

export type SignatureType = 'typed' | 'drawn';

export interface Signature {
    type: SignatureType;
    data: string; // base64 for drawn signatures, plain text for typed signatures
    signerName: string;
    signerEmail: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
}

export interface SignatureMetadata {
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    location?: string;
}

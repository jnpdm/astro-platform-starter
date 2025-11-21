import { useState, useRef, useEffect } from 'react';
import type { Signature, SignatureType } from '../../types/signature';
import { useToast } from '../../contexts/ToastContext';

export interface SignatureCaptureProps {
    onSignature: (signature: Signature) => void;
    mode?: SignatureType;
    signerEmail?: string;
    disabled?: boolean;
}

export function SignatureCapture({
    onSignature,
    mode: initialMode = 'typed',
    signerEmail = '',
    disabled = false,
}: SignatureCaptureProps) {
    const toast = useToast();
    const [mode, setMode] = useState<SignatureType>(initialMode);
    const [typedName, setTypedName] = useState('');
    const [email, setEmail] = useState(signerEmail);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewSignature, setPreviewSignature] = useState<Signature | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Initialize canvas
    useEffect(() => {
        if (mode === 'drawn' && canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                // Set canvas size
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * window.devicePixelRatio;
                canvas.height = rect.height * window.devicePixelRatio;
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;

                context.scale(window.devicePixelRatio, window.devicePixelRatio);
                context.lineCap = 'round';
                context.strokeStyle = '#000000';
                context.lineWidth = 2;

                contextRef.current = context;
            }
        }
    }, [mode]);

    // Capture metadata
    const captureMetadata = async () => {
        const timestamp = new Date();
        const userAgent = navigator.userAgent;

        // Get IP address (in production, this would be done server-side)
        let ipAddress = 'unknown';
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            ipAddress = data.ip;
        } catch (error) {
            console.warn('Could not fetch IP address:', error);
        }

        return { timestamp, ipAddress, userAgent };
    };

    // Drawing handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (disabled) return;

        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;

        setIsDrawing(true);
        setHasDrawn(true);

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        context.beginPath();
        context.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || disabled) return;

        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        context.lineTo(x, y);
        context.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    // Generate signature
    const generateSignature = async (): Promise<Signature | null> => {
        const metadata = await captureMetadata();

        if (mode === 'typed') {
            if (!typedName.trim() || !email.trim()) {
                return null;
            }

            return {
                type: 'typed',
                data: typedName.trim(),
                signerName: typedName.trim(),
                signerEmail: email.trim(),
                ...metadata,
            };
        } else {
            if (!hasDrawn || !email.trim()) {
                return null;
            }

            const canvas = canvasRef.current;
            if (!canvas) return null;

            const dataUrl = canvas.toDataURL('image/png');

            return {
                type: 'drawn',
                data: dataUrl,
                signerName: email.split('@')[0] || 'Unknown',
                signerEmail: email.trim(),
                ...metadata,
            };
        }
    };

    // Preview signature
    const handlePreview = async () => {
        const signature = await generateSignature();
        if (signature) {
            setPreviewSignature(signature);
            setShowPreview(true);
        } else {
            if (mode === 'typed' && !typedName.trim()) {
                toast.showError('Please enter your name');
            } else if (mode === 'drawn' && !hasDrawn) {
                toast.showError('Please draw your signature');
            } else if (!email.trim()) {
                toast.showError('Please enter your email address');
            } else {
                toast.showError('Please complete all required fields');
            }
        }
    };

    // Confirm and submit signature
    const handleConfirm = () => {
        if (previewSignature && termsAccepted) {
            onSignature(previewSignature);
            setShowPreview(false);
            toast.showSuccess('Signature captured successfully');
        } else if (!termsAccepted) {
            toast.showError('Please accept the terms to continue');
        }
    };

    // Cancel preview
    const handleCancelPreview = () => {
        setShowPreview(false);
        setPreviewSignature(null);
    };

    // Check if signature is ready
    const isSignatureReady = () => {
        if (mode === 'typed') {
            return typedName.trim().length > 0 && email.trim().length > 0;
        } else {
            return hasDrawn && email.trim().length > 0;
        }
    };

    return (
        <div className="signature-capture px-4 sm:px-0">
            {!showPreview ? (
                <>
                    {/* Mode selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Signature Method
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => setMode('typed')}
                                disabled={disabled}
                                className={`px-4 py-3 sm:py-2 rounded-md border min-h-[44px] font-medium ${mode === 'typed'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                ✍️ Type Name
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('drawn')}
                                disabled={disabled}
                                className={`px-4 py-3 sm:py-2 rounded-md border min-h-[44px] font-medium ${mode === 'drawn'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                🖊️ Draw Signature
                            </button>
                        </div>
                    </div>

                    {/* Email input */}
                    <div className="mb-4">
                        <label htmlFor="signer-email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                        </label>
                        <input
                            id="signer-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={disabled}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="your.email@example.com"
                        />
                    </div>

                    {/* Typed signature mode */}
                    {mode === 'typed' && (
                        <div className="mb-4">
                            <label htmlFor="typed-name" className="block text-sm font-medium text-gray-700 mb-2">
                                Type Your Full Name *
                            </label>
                            <input
                                id="typed-name"
                                type="text"
                                value={typedName}
                                onChange={(e) => setTypedName(e.target.value)}
                                disabled={disabled}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="John Doe"
                                style={{ fontFamily: 'cursive', fontSize: '1.5rem' }}
                            />
                            {typedName && (
                                <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                                    <p className="text-sm text-gray-600 mb-1">Preview:</p>
                                    <p style={{ fontFamily: 'cursive', fontSize: '1.5rem' }}>{typedName}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Drawn signature mode */}
                    {mode === 'drawn' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Draw Your Signature *
                            </label>
                            <div className="text-xs text-gray-500 mb-2">
                                Use your finger or stylus to draw your signature below
                            </div>
                            <div className="border-2 border-gray-300 rounded-md bg-white touch-none">
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    className="w-full cursor-crosshair touch-none"
                                    style={{ height: '200px', touchAction: 'none' }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={clearCanvas}
                                disabled={disabled || !hasDrawn}
                                className="mt-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                            >
                                🗑️ Clear Signature
                            </button>
                        </div>
                    )}

                    {/* Preview button */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handlePreview}
                            disabled={disabled || !isSignatureReady()}
                            className="px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] font-medium"
                        >
                            Preview Signature
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Signature preview */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Signature Preview</h3>

                        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 mb-4">
                            {previewSignature?.type === 'typed' ? (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Typed Signature:</p>
                                    <p style={{ fontFamily: 'cursive', fontSize: '2rem' }}>
                                        {previewSignature.data}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Drawn Signature:</p>
                                    <img
                                        src={previewSignature?.data}
                                        alt="Signature preview"
                                        className="max-w-full h-auto border border-gray-300 bg-white"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Metadata display */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                            <p className="text-sm font-medium text-blue-900 mb-2">Signature Details:</p>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li><strong>Name:</strong> {previewSignature?.signerName}</li>
                                <li><strong>Email:</strong> {previewSignature?.signerEmail}</li>
                                <li><strong>Timestamp:</strong> {previewSignature?.timestamp.toLocaleString()}</li>
                                <li><strong>IP Address:</strong> {previewSignature?.ipAddress}</li>
                                <li><strong>User Agent:</strong> {previewSignature?.userAgent.substring(0, 50)}...</li>
                            </ul>
                        </div>

                        {/* Terms acceptance */}
                        <div className="mb-4">
                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1 mr-2"
                                />
                                <span className="text-sm text-gray-700">
                                    I confirm that this is my digital signature and I agree to be bound by this submission.
                                    I understand that this signature has the same legal effect as a handwritten signature.
                                </span>
                            </label>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                type="button"
                                onClick={handleCancelPreview}
                                className="px-4 py-3 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 min-h-[44px] font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={!termsAccepted}
                                className="px-6 py-3 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] font-medium"
                            >
                                Confirm & Submit
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

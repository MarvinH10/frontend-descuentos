declare module 'react-qr-scanner' {
    import { ComponentType } from 'react';

    export interface QrScannerProps {
        delay?: number;
        facingMode?: 'user' | 'environment';
        onError?: (error: Error) => void;
        onScan?: (data: string | null) => void;
        style?: React.CSSProperties;
        constraints?: MediaTrackConstraints;
    }

    const QrScanner: ComponentType<QrScannerProps>;
    export default QrScanner;
}

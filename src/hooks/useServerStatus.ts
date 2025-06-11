import { useState, useEffect, useCallback } from 'react';
import { odooService } from '../api/odooService';

export interface UseServerStatusState {
    isOnline: boolean;
    loading: boolean;
    lastChecked: Date | null;
    error: string | null;
}

export interface UseServerStatusActions {
    checkStatus: () => Promise<void>;
    startAutoCheck: (intervalMs?: number) => void;
    stopAutoCheck: () => void;
}

export interface UseServerStatusReturn extends UseServerStatusState, UseServerStatusActions { }

/**
 * Hook personalizado para monitorear el estado del servidor backend
 * Permite verificación manual y automática del estado del servidor
 */
export const useServerStatus = (
    autoCheck: boolean = true,
    intervalMs: number = 30000
): UseServerStatusReturn => {
    const [state, setState] = useState<UseServerStatusState>({
        isOnline: false,
        loading: true,
        lastChecked: null,
        error: null,
    });

    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    /**
     * Verifica el estado del servidor
     */
    const checkStatus = useCallback(async (): Promise<void> => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const isOnline = await odooService.checkServerStatus();
            setState(prev => ({
                ...prev,
                isOnline,
                loading: false,
                lastChecked: new Date(),
                error: null,
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isOnline: false,
                loading: false,
                lastChecked: new Date(),
                error: error instanceof Error ? error.message : 'Error al verificar servidor',
            }));
        }
    }, []);

    /**
     * Inicia la verificación automática del servidor
     */
    const startAutoCheck = useCallback((customIntervalMs?: number): void => {
        if (intervalId) {
            clearInterval(intervalId);
        }

        const interval = setInterval(checkStatus, customIntervalMs || intervalMs);
        setIntervalId(interval);
    }, [checkStatus, intervalMs, intervalId]);

    /**
     * Detiene la verificación automática del servidor
     */
    const stopAutoCheck = useCallback((): void => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    }, [intervalId]);

    useEffect(() => {
        checkStatus();

        if (autoCheck) {
            startAutoCheck();
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);

    useEffect(() => {
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    return {
        isOnline: state.isOnline,
        loading: state.loading,
        lastChecked: state.lastChecked,
        error: state.error,

        checkStatus,
        startAutoCheck,
        stopAutoCheck,
    };
};
import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

/**
 * Hook personalizado para manejar localStorage de forma reactiva
 * Sincroniza el estado con localStorage y maneja errores
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error al leer localStorage para la clave "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: SetValue<T>) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error al escribir en localStorage para la clave "${key}":`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(`Error al remover localStorage para la clave "${key}":`, error);
        }
    }, [key, initialValue]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.error(`Error al parsear localStorage para la clave "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue, removeValue];
}

/**
 * Hook para manejar historial de búsquedas
 */
export const useSearchHistory = (maxItems: number = 10) => {
    const [history, setHistory, clearHistory] = useLocalStorage<string[]>('search_history', []);

    const addToHistory = useCallback((barcode: string) => {
        if (!barcode.trim()) return;

        setHistory(prev => {
            const filtered = prev.filter(item => item !== barcode);
            const newHistory = [barcode, ...filtered];
            return newHistory.slice(0, maxItems);
        });
    }, [setHistory, maxItems]);

    const removeFromHistory = useCallback((barcode: string) => {
        setHistory(prev => prev.filter(item => item !== barcode));
    }, [setHistory]);

    return {
        history,
        addToHistory,
        removeFromHistory,
        clearHistory,
    };
};
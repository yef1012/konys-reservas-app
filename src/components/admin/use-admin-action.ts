import { useRef, useState } from 'react';

import type { Result } from '@/types/restaurant';

/** Espera la respuesta del servidor y bloquea envíos repetidos del mismo formulario. */
export function useAdminAction() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const run = async (action: () => Promise<Result>, success = '', onSuccess?: () => void) => {
    if (locked.current) return false;
    locked.current = true;
    setPending(true);
    setError('');
    setMessage('');
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setMessage(success);
      onSuccess?.();
      return true;
    } catch {
      setError('No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.');
      return false;
    } finally {
      locked.current = false;
      setPending(false);
    }
  };

  return { run, pending, error, message, setError };
}

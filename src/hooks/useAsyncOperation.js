import { useState, useCallback, useRef } from 'react';
import { useAlerta } from '../context/AlertContext';

/**
 * Hook para gestionar el ciclo de vida de operaciones asíncronas con feedback visual,
 * barra de progreso en tiempo real y soporte para cancelación con limpieza.
 */
export function useAsyncOperation({ tituloErrorPorDefecto = 'Error en Operación' } = {}) {
  const [cargando, setCargando] = useState(false);
  const [mensajeCarga, setMensajeCarga] = useState('Procesando solicitud...');
  const [progreso, setProgreso] = useState(0);
  const [cancelando, setCancelando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const { mostrarErrorOperacion } = useAlerta();

  const ejecutar = useCallback(async (accion, { mensajeProgreso = 'Procesando...', tituloError = tituloErrorPorDefecto } = {}) => {
    try {
      setCargando(true);
      setCancelando(false);
      setMensajeCarga(mensajeProgreso);
      setProgreso(5);
      setError(null);

      abortControllerRef.current = new AbortController();

      const actualizarProgreso = (mensaje, pct = null) => {
        if (mensaje) setMensajeCarga(mensaje);
        if (pct !== null && pct !== undefined) {
          setProgreso(Math.max(0, Math.min(100, Math.round(pct))));
        }
      };

      const res = typeof accion === 'function'
        ? await accion(actualizarProgreso, abortControllerRef.current.signal)
        : await accion;

      setResultado(res);
      setProgreso(100);
      return res;
    } catch (err) {
      // Si el usuario canceló deliberadamente, no mostrar alerta de error
      if (err.message === 'Operación cancelada' || err.name === 'AbortError') {
        return null;
      }
      setError(err);
      mostrarErrorOperacion(tituloError, err.message || 'Ocurrió un error inesperado al procesar.');
      return null;
    } finally {
      setCargando(false);
      setCancelando(false);
      abortControllerRef.current = null;
    }
  }, [mostrarErrorOperacion, tituloErrorPorDefecto]);

  const cancelar = useCallback(async (onLimpiar = null) => {
    setCancelando(true);
    setMensajeCarga('Cancelando operación y liberando memoria...');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (typeof onLimpiar === 'function') {
      try {
        await onLimpiar();
      } catch (_) {}
    }

    setResultado(null);
    setError(null);
    setProgreso(0);
    setCargando(false);
    setCancelando(false);
  }, []);

  const reiniciar = useCallback(() => {
    setResultado(null);
    setError(null);
    setProgreso(0);
    setCargando(false);
    setCancelando(false);
  }, []);

  return {
    cargando,
    mensajeCarga,
    progreso,
    cancelando,
    resultado,
    error,
    ejecutar,
    cancelar,
    reiniciar,
    setResultado
  };
}

import { useState, useCallback } from 'react';
import { useAlerta } from '../context/AlertContext';

/**
 * Hook para gestionar el ciclo de vida de operaciones asíncronas con feedback visual
 */
export function useAsyncOperation({ tituloErrorPorDefecto = 'Error en Operación' } = {}) {
  const [cargando, setCargando] = useState(false);
  const [mensajeCarga, setMensajeCarga] = useState('Procesando solicitud...');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const { mostrarErrorOperacion } = useAlerta();

  const ejecutar = useCallback(async (accionPromesa, { mensajeProgreso = 'Procesando...', tituloError = tituloErrorPorDefecto } = {}) => {
    try {
      setCargando(true);
      setMensajeCarga(mensajeProgreso);
      setError(null);

      const res = await accionPromesa;
      setResultado(res);
      return res;
    } catch (err) {
      setError(err);
      mostrarErrorOperacion(tituloError, err.message || 'Ocurrió un error inesperado al procesar.');
      return null;
    } finally {
      setCargando(false);
    }
  }, [mostrarErrorOperacion, tituloErrorPorDefecto]);

  const reiniciar = useCallback(() => {
    setResultado(null);
    setError(null);
    setCargando(false);
  }, []);

  return {
    cargando,
    mensajeCarga,
    resultado,
    error,
    ejecutar,
    reiniciar,
    setResultado
  };
}

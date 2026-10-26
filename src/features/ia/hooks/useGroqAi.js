import { useState, useCallback } from 'react';
import { useDocumentPicker } from '../../../hooks/useDocumentPicker';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { resumirPdfIaApi, traducirPdfIaApi } from '../../../api/ia.api';
import { useAlerta } from '../../../context/AlertContext';

export function useGroqAi() {
  const { mostrarErrorFaltaArchivo } = useAlerta();
  const [tabActivo, setTabActivo] = useState('resumen'); // 'resumen' | 'traduccion'
  const [idiomaDestino, setIdiomaDestino] = useState('Inglés');
  const [idiomaOrigen, setIdiomaOrigen] = useState('Español');
  const [copiado, setCopiado] = useState(false);

  const {
    archivo: archivoPdf,
    seleccionarArchivo: seleccionarPdf,
    limpiarArchivo: limpiarPdf,
    cargandoSeleccion
  } = useDocumentPicker({
    tipoMime: 'application/pdf',
    extensionesPermitidas: ['.pdf'],
    etiquetaFormato: 'PDF'
  });

  const {
    cargando: procesando,
    ejecutar,
    resultado,
    setResultado,
    reiniciar
  } = useAsyncOperation({ tituloErrorPorDefecto: 'Error en Groq AI' });

  // Resumen ejecutivo
  const ejecutarResumen = useCallback(async () => {
    if (!archivoPdf) {
      mostrarErrorFaltaArchivo('PDF');
      return null;
    }

    const res = await ejecutar(
      resumirPdfIaApi({ archivoUri: archivoPdf.uri }),
      { mensajeProgreso: 'Analizando contenido y generando resumen con Groq...' }
    );

    if (res && res.resumen) {
      setResultado(res.resumen);
    }
    return res;
  }, [archivoPdf, ejecutar, mostrarErrorFaltaArchivo, setResultado]);

  // Traducción
  const ejecutarTraduccion = useCallback(async () => {
    if (!archivoPdf) {
      mostrarErrorFaltaArchivo('PDF');
      return null;
    }

    const res = await ejecutar(
      traducirPdfIaApi({
        archivoUri: archivoPdf.uri,
        idiomaDestino,
        idiomaOrigen
      }),
      { mensajeProgreso: `Traduciendo PDF a ${idiomaDestino} con Groq AI...` }
    );

    if (res && res.traduccion) {
      setResultado(res.traduccion);
    }
    return res;
  }, [archivoPdf, idiomaDestino, idiomaOrigen, ejecutar, mostrarErrorFaltaArchivo, setResultado]);

  return {
    archivoPdf,
    tabActivo,
    setTabActivo,
    idiomaDestino,
    setIdiomaDestino,
    idiomaOrigen,
    setIdiomaOrigen,
    procesando,
    cargandoSeleccion,
    resultado,
    copiado,
    setCopiado,
    seleccionarPdf,
    limpiarPdf,
    ejecutarResumen,
    ejecutarTraduccion,
    reiniciar
  };
}

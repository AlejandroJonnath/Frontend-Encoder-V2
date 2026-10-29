import { useState, useCallback } from 'react';
import { useDocumentPicker } from '../../../hooks/useDocumentPicker';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { comprimirPdfApi } from '../../../api/pdf.api';
import { useAlerta } from '../../../context/AlertContext';
import { generarNombreSalida } from '../../../utils/fileFormatters';
import { limpiarCacheDocumentos } from '../../../utils/apiUploader';

export function useCompressPdf() {
  const { mostrarErrorFaltaArchivo } = useAlerta();
  const [calidad, setCalidad] = useState('ebook');

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
    cargando: comprimiendo,
    mensajeCarga,
    progreso,
    cancelando,
    resultado,
    ejecutar,
    cancelar,
    reiniciar,
    setResultado
  } = useAsyncOperation({ tituloErrorPorDefecto: 'Error en Compresión' });

  const ejecutarCompresion = useCallback(async () => {
    if (!archivoPdf) {
      mostrarErrorFaltaArchivo('PDF');
      return null;
    }

    const nombreSalida = generarNombreSalida(archivoPdf.name, '_compress', '.pdf');

    const res = await ejecutar(
      (actualizarProgreso, signal) => comprimirPdfApi({
        archivoUri: archivoPdf.uri,
        calidad,
        nombreArchivoSalida: nombreSalida,
        onProgreso: actualizarProgreso,
        signal
      }),
      { mensajeProgreso: 'Iniciando compresión de PDF...' }
    );

    if (res) {
      const tamanioOriginal = res.tamanioOriginal || archivoPdf.size || 0;
      const tamanioComprimido = res.tamanioComprimido || archivoPdf.size || 0;
      const reduccion = res.porcentajeReduccion !== undefined
        ? res.porcentajeReduccion
        : (tamanioOriginal > 0
            ? Math.max(0, Math.round(((tamanioOriginal - tamanioComprimido) / tamanioOriginal) * 100))
            : 0);

      setResultado({
        nombreSalida,
        tamanioOriginal,
        tamanioComprimido,
        reduccion
      });
    }

    return res;
  }, [archivoPdf, calidad, ejecutar, mostrarErrorFaltaArchivo, setResultado]);

  const cancelarCompresion = useCallback(async () => {
    await cancelar(async () => {
      if (archivoPdf?.uri) {
        await limpiarCacheDocumentos(archivoPdf.uri);
      }
      limpiarPdf();
    });
  }, [cancelar, archivoPdf, limpiarPdf]);

  const seleccionarNuevoPdf = useCallback(async () => {
    reiniciar();
    return await seleccionarPdf();
  }, [reiniciar, seleccionarPdf]);

  return {
    archivoPdf,
    calidad,
    setCalidad,
    comprimiendo,
    mensajeCarga,
    progreso,
    cancelando,
    cargandoSeleccion,
    resultado,
    seleccionarNuevoPdf,
    limpiarPdf,
    ejecutarCompresion,
    cancelarCompresion,
    reiniciar
  };
}

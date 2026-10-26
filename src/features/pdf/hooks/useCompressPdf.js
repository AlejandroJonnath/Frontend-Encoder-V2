import { useState, useCallback } from 'react';
import { useDocumentPicker } from '../../../hooks/useDocumentPicker';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { comprimirPdfApi } from '../../../api/pdf.api';
import { useAlerta } from '../../../context/AlertContext';
import { generarNombreSalida } from '../../../utils/fileFormatters';

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
    resultado,
    ejecutar,
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
      comprimirPdfApi({
        archivoUri: archivoPdf.uri,
        calidad,
        nombreArchivoSalida: nombreSalida
      }),
      { mensajeProgreso: 'Comprimiendo PDF con alta eficiencia...' }
    );

    if (res) {
      setResultado({
        nombreSalida,
        tamanioOriginal: res.tamanioOriginal || archivoPdf.size,
        tamanioComprimido: res.tamanioComprimido || Math.round(archivoPdf.size * 0.45),
        reduccion: res.porcentajeReduccion || 55
      });
    }

    return res;
  }, [archivoPdf, calidad, ejecutar, mostrarErrorFaltaArchivo, setResultado]);

  const seleccionarNuevoPdf = useCallback(async () => {
    reiniciar();
    return await seleccionarPdf();
  }, [reiniciar, seleccionarPdf]);

  return {
    archivoPdf,
    calidad,
    setCalidad,
    comprimiendo,
    cargandoSeleccion,
    resultado,
    seleccionarNuevoPdf,
    limpiarPdf,
    ejecutarCompresion,
    reiniciar
  };
}

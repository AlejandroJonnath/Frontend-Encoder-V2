import { useState, useCallback } from 'react';
import { useDocumentPicker } from '../../../hooks/useDocumentPicker';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import {
  convertirDocumentoAPdfApi,
  inspeccionarExcelApi,
  procesarExcelAPdfApi
} from '../../../api/conversion.api';
import { useAlerta } from '../../../context/AlertContext';
import { generarNombreSalida } from '../../../utils/fileFormatters';

export function useDocumentConversion({
  tipo = 'word',
  extensionesPermitidas = ['.docx', '.doc'],
  tipoMime = '*/*',
  etiquetaFormato = 'Word'
} = {}) {
  const { mostrarErrorFaltaArchivo, mostrarErrorCampos } = useAlerta();
  const [reporteExcel, setReporteExcel] = useState(null);
  const [selectorExcelVisible, setSelectorExcelVisible] = useState(false);
  const [archivoTemporalId, setArchivoTemporalId] = useState(null);

  const {
    archivo,
    seleccionarArchivo,
    limpiarArchivo,
    cargandoSeleccion
  } = useDocumentPicker({
    tipoMime,
    extensionesPermitidas,
    etiquetaFormato
  });

  const {
    cargando: convirtiendo,
    ejecutar,
    resultado,
    reiniciar
  } = useAsyncOperation({ tituloErrorPorDefecto: 'Error en Conversión' });

  // Conversión simple (Word, PPT, TXT, Imagen)
  const ejecutarConversionSimple = useCallback(async () => {
    if (!archivo) {
      mostrarErrorFaltaArchivo(etiquetaFormato);
      return null;
    }

    const nombreSalida = generarNombreSalida(archivo.name, '_converted', '.pdf');

    return await ejecutar(
      convertirDocumentoAPdfApi({
        tipo,
        archivoUri: archivo.uri,
        nombreArchivoSalida: nombreSalida
      }),
      { mensajeProgreso: `Convirtiendo ${etiquetaFormato} a PDF de alta resolución...` }
    );
  }, [archivo, tipo, etiquetaFormato, ejecutar, mostrarErrorFaltaArchivo]);

  // Inspección de Excel
  const inspeccionarExcel = useCallback(async () => {
    if (!archivo) {
      mostrarErrorFaltaArchivo('Excel');
      return null;
    }

    return await ejecutar(
      (async () => {
        const res = await inspeccionarExcelApi({ archivoUri: archivo.uri });
        if (res && res.reporte) {
          setReporteExcel(res.reporte);
          setArchivoTemporalId(res.archivoTemporalId);
          setSelectorExcelVisible(true);
        }
        return res;
      })(),
      { mensajeProgreso: 'Analizando hojas de cálculo...' }
    );
  }, [archivo, ejecutar, mostrarErrorFaltaArchivo]);

  // Procesar hojas seleccionadas de Excel
  const procesarHojasExcel = useCallback(async (hojasSeleccionadas) => {
    if (!archivoTemporalId || !hojasSeleccionadas || hojasSeleccionadas.length === 0) {
      mostrarErrorCampos('Debes seleccionar al menos una hoja de cálculo.');
      return null;
    }

    setSelectorExcelVisible(false);

    return await ejecutar(
      procesarExcelAPdfApi({
        archivoTemporalId,
        hojasSeleccionadas
      }),
      { mensajeProgreso: 'Generando PDF con las hojas seleccionadas...' }
    );
  }, [archivoTemporalId, ejecutar, mostrarErrorCampos]);

  return {
    archivo,
    convirtiendo,
    cargandoSeleccion,
    resultado,
    reporteExcel,
    selectorExcelVisible,
    setSelectorExcelVisible,
    seleccionarArchivo,
    limpiarArchivo,
    ejecutarConversionSimple,
    inspeccionarExcel,
    procesarHojasExcel,
    reiniciar
  };
}

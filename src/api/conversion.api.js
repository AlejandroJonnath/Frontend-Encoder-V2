import { procesarOperacionNativa, peticionApiJson } from '../utils/apiUploader';

/*
 * Servicio para inspeccionar hojas de cálculo de Excel
 */
export async function inspeccionarExcelApi({ archivoUri }) {

  return await procesarOperacionNativa({
    endpoint: '/excel/inspeccionar',
    archivoUri,
    campoNombre: 'excel',
    compartirInmediato: false
  });

}

/*
 * Servicio para procesar y convertir hojas seleccionadas de Excel a PDF
 */
export async function procesarExcelAPdfApi({ archivoTemporalId, hojasSeleccionadas }) {

  return await peticionApiJson({
    endpoint: '/excel/procesar-pdf',
    metodo: 'POST',
    body: {
      archivoTemporalId,
      hojasSeleccionadas: Array.isArray(hojasSeleccionadas) ? hojasSeleccionadas : [hojasSeleccionadas]
    }
  });

}

/**
 * Servicio para convertir documentos (Word, PPT, TXT, Imágenes) a PDF
 */
export async function convertirDocumentoAPdfApi({

  tipo, // 'word' | 'powerpoint' | 'txt' | 'imagen'
  archivoUri,
  nombreArchivoSalida

}) {

  return await procesarOperacionNativa({
    endpoint: `/convertir/${tipo}`,
    archivoUri,
    campoNombre: 'archivo',
    nombreArchivoSalida,
    compartirInmediato: true
  });

}

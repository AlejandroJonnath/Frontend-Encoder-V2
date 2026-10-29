import { procesarOperacionNativa, peticionApiJson } from '../utils/apiUploader';

/**
 * Servicio para comprimir un archivo PDF
 */
export async function comprimirPdfApi({ archivoUri, calidad = 'ebook', nombreArchivoSalida, onProgreso = null, signal = null }) {
  return await procesarOperacionNativa({
    endpoint: '/pdf/comprimir',
    archivoUri,
    campoNombre: 'pdf',
    parametros: { calidad },
    nombreArchivoSalida,
    compartirInmediato: true,
    onProgreso,
    signal
  });
}

/**
 * Servicio para subir un PDF individual a una sesión de unión múltiple
 */
export async function subirPdfParaUnirApi({ archivoUri, sesionId }) {
  return await procesarOperacionNativa({
    endpoint: '/pdf/sesion-unir/subir',
    archivoUri,
    campoNombre: 'pdf',
    parametros: { sesionId },
    compartirInmediato: false
  });
}

/**
 * Servicio para procesar y unir todos los PDFs de una sesión por lotes
 */
export async function procesarUnirSesionApi({ sesionId, nombresOrdenados }) {
  return await peticionApiJson({
    endpoint: '/pdf/sesion-unir/procesar',
    metodo: 'POST',
    body: { sesionId, nombresOrdenados }
  });
}

/**
 * Servicio para agregar una nota gráfica a un PDF
 */
export async function agregarNotaPdfApi({ archivoUri, textoNota, posicion, nombreArchivoSalida }) {
  return await procesarOperacionNativa({
    endpoint: '/pdf/agregar-nota',
    archivoUri,
    campoNombre: 'pdf',
    parametros: {
      nota: textoNota,
      posicion: typeof posicion === 'object' ? JSON.stringify(posicion) : posicion
    },
    nombreArchivoSalida,
    compartirInmediato: true
  });
}

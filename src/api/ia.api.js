import { procesarOperacionNativa } from '../utils/apiUploader';

/**
 * Servicio para generar un resumen ejecutivo de un PDF usando Groq AI
 */
export async function resumirPdfIaApi({ archivoUri }) {
  return await procesarOperacionNativa({
    endpoint: '/ia/resumir',
    archivoUri,
    campoNombre: 'pdf',
    compartirInmediato: false
  });
}

/**
 * Servicio para traducir el contenido de un PDF usando Groq AI
 */
export async function traducirPdfIaApi({ archivoUri, idiomaDestino, idiomaOrigen }) {
  return await procesarOperacionNativa({
    endpoint: '/ia/traducir',
    archivoUri,
    campoNombre: 'pdf',
    parametros: {
      idiomaDestino,
      idiomaOrigen: idiomaOrigen || 'Detección automática'
    },
    compartirInmediato: false
  });
}

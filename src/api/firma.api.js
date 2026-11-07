import { procesarOperacionNativa } from '../utils/apiUploader';

/**
 * Servicio para subir un certificado digital .p12 y obtener un token temporal
 */
export async function subirCertificadoP12Api({ archivoP12Uri, signal = null }) {
  return await procesarOperacionNativa({
    endpoint: '/pdf/subir-p12',
    archivoUri: archivoP12Uri,
    campoNombre: 'p12',
    compartirInmediato: false,
    signal
  });
}

/**
 * Servicio para firmar un PDF digitalmente con FirmaEC / .p12
 */
export async function firmarPdfApi({
  archivoPdfUri,
  tokenP12,
  p12Base64,
  contrasena,
  posicion,
  razon = 'Firma Electrónica Documental',
  nombreArchivoSalida,
  signal = null,
  onProgreso = null
}) {
  const parametros = {
    contrasena,
    posicion: typeof posicion === 'object' ? JSON.stringify(posicion) : posicion,
    razon
  };

  if (tokenP12) {
    parametros.tokenP12 = tokenP12;
  }
  if (p12Base64) {
    parametros.p12Base64 = p12Base64;
  }

  return await procesarOperacionNativa({
    endpoint: '/pdf/firmar',
    archivoUri: archivoPdfUri,
    campoNombre: 'pdf',
    parametros,
    nombreArchivoSalida,
    compartirInmediato: true,
    signal,
    onProgreso
  });
}

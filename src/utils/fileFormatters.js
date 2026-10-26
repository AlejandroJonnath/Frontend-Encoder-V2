/**
 * Utilidades para formatear tamaños y nombres de archivos
 */

/**
 * Convierte un valor numérico de bytes en una cadena legible (B, KB, MB, GB)
 */
export function formatearBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extrae el nombre sin la extensión
 */
export function extraerNombreBase(nombreCompleto = '') {
  if (!nombreCompleto) return 'documento';
  return nombreCompleto.replace(/\.[^/.]+$/, '');
}

/**
 * Genera un nombre de salida sugerido agregando un sufijo y ajustando la extensión
 */
export function generarNombreSalida(nombreOriginal = 'documento.pdf', sufijo = '_procesado', nuevaExtension = '.pdf') {
  const base = extraerNombreBase(nombreOriginal);
  const extLimpia = nuevaExtension.startsWith('.') ? nuevaExtension : `.${nuevaExtension}`;
  return `${base}${sufijo}${extLimpia}`;
}

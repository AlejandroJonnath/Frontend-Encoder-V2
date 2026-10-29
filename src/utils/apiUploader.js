import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { CONFIGURACION } from '../config/constantes';
import { supabase } from '../config/supabase';

const TIPO_SUBIDA_MULTIPART = FileSystem?.FileSystemUploadType?.MULTIPART ?? 1;

// Registro de última verificación de servidor despierto (para evitar pings redundantes)
let ultimaVerificacionServidor = 0;
const INTERVALO_CACHE_SALUD_MS = 5 * 60 * 1000; // 5 minutos de caché activo

/**
 * Limpia archivos temporales y caché de DocumentPicker para liberar almacenamiento del dispositivo
 */
export async function limpiarCacheDocumentos(archivoUri = null) {
  try {
    if (archivoUri && (archivoUri.startsWith('file://') || archivoUri.startsWith('/'))) {
      await FileSystem.deleteAsync(archivoUri, { idempotent: true }).catch(() => {});
    }

    const dirPicker = `${FileSystem.cacheDirectory}DocumentPicker/`;
    const infoDir = await FileSystem.getInfoAsync(dirPicker).catch(() => ({ exists: false }));
    if (infoDir.exists) {
      await FileSystem.deleteAsync(dirPicker, { idempotent: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Cache] Error limpiando caché temporal:', err.message);
  }
}

/**
 * Obtiene el token JWT de la sesión activa de Supabase
 */
async function obtenerTokenAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (err) {
    console.warn('[Network] No se pudo obtener el token de sesión:', err.message);
    return null;
  }
}

/**
 * Despierta o verifica la disponibilidad del backend en Render (mitiga el Cold Start de 50s del plan gratuito)
 */
export async function asegurarServidorDespierto(onProgreso = null) {
  const ahora = Date.now();
  if (ahora - ultimaVerificacionServidor < INTERVALO_CACHE_SALUD_MS) {
    return true;
  }

  const urlSalud = CONFIGURACION.URL_API_BACKEND
    ? CONFIGURACION.URL_API_BACKEND.replace(/\/api\/?$/, '/salud')
    : null;

  if (!urlSalud || !urlSalud.startsWith('http')) {
    return true;
  }

  try {
    const controladorRapido = new AbortController();
    const timeoutRapido = setTimeout(() => controladorRapido.abort(), 4000);

    const ping = await fetch(urlSalud, {
      method: 'GET',
      signal: controladorRapido.signal
    }).catch(() => null);

    clearTimeout(timeoutRapido);

    if (ping && ping.ok) {
      ultimaVerificacionServidor = Date.now();
      return true;
    }
  } catch (_) {
    // Si falla el ping rápido, el servidor probablemente está en reposo (cold start de Render)
  }

  // Si no respondió de inmediato, notificar al usuario y esperar que Render despierte
  if (onProgreso) {
    onProgreso('Conectando con el servidor en la nube (iniciando instancia)...');
  }

  try {
    const controladorEspera = new AbortController();
    const timeoutEspera = setTimeout(() => controladorEspera.abort(), 45000);

    const pingLargo = await fetch(urlSalud, {
      method: 'GET',
      signal: controladorEspera.signal
    });

    clearTimeout(timeoutEspera);

    if (pingLargo && pingLargo.ok) {
      ultimaVerificacionServidor = Date.now();
      return true;
    }
  } catch (err) {
    console.warn('[Network] Aviso al esperar inicio del servidor:', err.message);
  }

  return false;
}

/**
 * Lee cualquier URI de archivo local o de DocumentPicker en Base64
 * utilizando el networking nativo de React Native (bypasea el Scoped Storage de Expo Go)
 */
export async function leerUriComoBase64(uri) {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultado = reader.result;
        if (typeof resultado === 'string') {
          const partes = resultado.split(',');
          resolve(partes.length > 1 ? partes[1] : partes[0]);
        } else {
          reject(new Error('Formato no válido al leer archivo'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo con FileReader'));
      reader.readAsDataURL(blob);
    });
  } catch (errFetch) {
    // Fallback con FileSystem si fetch no estuviera disponible
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType?.Base64 || 'base64'
    });
  }
}

/**
 * Extrae el nombre original del archivo desde su URI, preservando la extensión real.
 */
function extraerNombreOriginalDeUri(uri) {
  try {
    const segmentos = uri.split('/');
    const nombreDesdeUri = decodeURIComponent(segmentos[segmentos.length - 1] || 'archivo.bin');
    return nombreDesdeUri.replace(/^\d+_/, '');
  } catch (_) {
    return 'archivo.bin';
  }
}

/**
 * Extrae el mensaje de error más descriptivo desde un cuerpo de respuesta JSON o texto
 */
function extraerMensajeError(cuerpo, codigoEstado) {
  if (typeof cuerpo === 'string') {
    try {
      const parsed = JSON.parse(cuerpo);
      if (parsed.mensaje) return parsed.mensaje;
    } catch (_) {}
  } else if (cuerpo && typeof cuerpo === 'object' && cuerpo.mensaje) {
    return cuerpo.mensaje;
  }

  if (codigoEstado === 502 || codigoEstado === 503 || codigoEstado === 504) {
    return 'El servidor en la nube se está iniciando o experimentó una pausa temporal (502). Por favor, intenta de nuevo en un momento.';
  }
  if (codigoEstado === 401 || codigoEstado === 403) {
    return 'Tu sesión ha expirado o no tienes permisos para realizar esta operación. Inicia sesión nuevamente.';
  }
  if (codigoEstado === 413) {
    return 'El archivo es demasiado grande para ser procesado por el servidor.';
  }

  return `Error en el servidor (${codigoEstado})`;
}

/**
 * Realiza una petición JSON directa al backend con inyección automática de Auth
 */
export async function peticionApiJson({
  endpoint,
  metodo = 'POST',
  body = null,
  headersPersonalizados = {},
  onProgreso = null
}) {
  await asegurarServidorDespierto(onProgreso);

  const url = `${CONFIGURACION.URL_API_BACKEND}${endpoint}`;
  const token = await obtenerTokenAuth();

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-retorno-json': 'true',
    ...headersPersonalizados
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const opciones = {
    method: metodo,
    headers
  };

  if (body) {
    opciones.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(url, opciones);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.exito) {
    const mensajeError = extraerMensajeError(data, res.status);
    const error = new Error(mensajeError);
    error.codigoEstado = data.codigoEstado || res.status;
    throw error;
  }

  return data;
}

/**
 * Procesa la subida y respuesta de cualquier operación documental con inyección de Auth,
 * soporte de barra de progreso en tiempo real y cancelación reactiva.
 */
export async function procesarOperacionNativa({
  endpoint,
  archivoUri,
  campoNombre = 'pdf',
  parametros = {},
  nombreArchivoSalida,
  compartirInmediato = true,
  onProgreso = null,
  signal = null
}) {
  // Si la operación ya fue cancelada antes de empezar
  if (signal?.aborted) {
    throw new Error('Operación cancelada');
  }

  // 0. Asegurar que el servidor esté activo (evita que uploads de 10MB cuelguen en un contenedor en reposo)
  await asegurarServidorDespierto(onProgreso);

  if (signal?.aborted) {
    throw new Error('Operación cancelada');
  }

  const urlBase = `${CONFIGURACION.URL_API_BACKEND}${endpoint}`;
  const token = await obtenerTokenAuth();
  let data = null;

  // Preparar URL con parámetros de consulta
  const queryParams = new URLSearchParams();
  if (parametros && typeof parametros === 'object') {
    Object.entries(parametros).forEach(([k, v]) => {
      if (v !== undefined && v !== null && k !== 'p12Base64') {
        queryParams.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
    });
  }

  const qs = queryParams.toString();
  const urlFinal = qs ? `${urlBase}?${qs}` : urlBase;

  const headers = {
    'Accept': 'application/json',
    'x-retorno-json': 'true'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (parametros && Object.keys(parametros).length > 0) {
    const paramsCabecera = {};
    Object.entries(parametros).forEach(([k, v]) => {
      if (k !== 'p12Base64' && (typeof v !== 'string' || v.length < 500)) {
        paramsCabecera[k] = v;
      }
    });
    headers['x-parametros'] = JSON.stringify(paramsCabecera);
    if (parametros.sesionId) {
      headers['x-sesion-id'] = String(parametros.sesionId);
    }
  }

  if (onProgreso) {
    onProgreso('Iniciando subida del documento...', 5);
  }

  let uploadTaskActual = null;
  let downloadTaskActual = null;

  // Conectar listener de cancelación externa al signal
  const alAbortar = () => {
    try {
      if (uploadTaskActual && typeof uploadTaskActual.cancelAsync === 'function') {
        uploadTaskActual.cancelAsync().catch(() => {});
      }
      if (downloadTaskActual && typeof downloadTaskActual.cancelAsync === 'function') {
        downloadTaskActual.cancelAsync().catch(() => {});
      }
    } catch (_) {}
  };

  if (signal) {
    signal.addEventListener('abort', alAbortar);
  }

  // 1. Intento primario: FileSystem.createUploadTask (multipart nativo con progreso continuo)
  let falloNativoLocal = false;
  let reintentoRealizado = false;

  while (!data) {
    if (signal?.aborted) {
      throw new Error('Operación cancelada');
    }

    let intervaloGhostscript = null;

    try {
      const task = FileSystem.createUploadTask(
        urlFinal,
        archivoUri,
        {
          fieldName: campoNombre,
          httpMethod: 'POST',
          uploadType: TIPO_SUBIDA_MULTIPART,
          headers
        },
        (progreso) => {
          if (signal?.aborted) return;
          if (progreso.totalBytesExpectedToSend > 0) {
            const ratio = progreso.totalBytesSent / progreso.totalBytesExpectedToSend;
            const pctSubida = Math.min(100, Math.round(ratio * 100));
            // Subida ocupa del 5% al 50%
            const pctGlobal = Math.round(5 + ratio * 45);
            if (pctSubida < 100) {
              onProgreso?.(`Subiendo documento (${pctSubida}%)...`, pctGlobal);
            } else {
              onProgreso?.('Documento recibido en el servidor...', 50);
            }
          }
        }
      );

      uploadTaskActual = task;

      // Iniciar simulación suave mientras Ghostscript procesa el archivo en el backend (50% a 78%)
      let progresoGs = 50;
      intervaloGhostscript = setInterval(() => {
        if (signal?.aborted) {
          clearInterval(intervaloGhostscript);
          return;
        }
        if (progresoGs < 78) {
          progresoGs += 3;
          onProgreso?.('Optimizando con Ghostscript y remuestreando...', progresoGs);
        }
      }, 450);

      const uploadResult = await task.uploadAsync();
      clearInterval(intervaloGhostscript);

      if (signal?.aborted) {
        throw new Error('Operación cancelada');
      }

      if (uploadResult && uploadResult.status >= 200 && uploadResult.status < 300) {
        data = JSON.parse(uploadResult.body);
        if (onProgreso) {
          onProgreso('Optimización completada en el servidor...', 80);
        }
        break;
      }

      // Si el servidor devolvió 502/503/504 y no hemos reintentado:
      if (uploadResult && (uploadResult.status === 502 || uploadResult.status === 503 || uploadResult.status === 504) && !reintentoRealizado) {
        reintentoRealizado = true;
        if (onProgreso) {
          onProgreso('El servidor está terminando de inicializarse. Reintentando subida...', 20);
        }
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }

      const errorMsg = extraerMensajeError(uploadResult?.body, uploadResult?.status);
      const error = new Error(errorMsg);
      error.codigoEstado = uploadResult?.status;
      throw error;

    } catch (errUpload) {
      if (intervaloGhostscript) clearInterval(intervaloGhostscript);

      if (signal?.aborted || errUpload.message === 'Operación cancelada') {
        throw new Error('Operación cancelada');
      }

      if (errUpload.codigoEstado) {
        throw errUpload;
      }

      console.warn('[Network] Falló uploadAsync nativo local, evaluando fallback Base64:', errUpload.message);
      falloNativoLocal = true;
      break;
    }
  }

  // 2. Canal fallback Base64 JSON (SOLO si falló la lectura nativa del dispositivo y el archivo es < 15MB)
  if (!data && falloNativoLocal && !signal?.aborted) {
    try {
      if (onProgreso) {
        onProgreso('Procesando archivo mediante canal alternativo...', 40);
      }

      const base64 = await leerUriComoBase64(archivoUri);
      const nombreOriginal = extraerNombreOriginalDeUri(archivoUri);

      const headersFetch = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-retorno-json': 'true'
      };

      if (token) {
        headersFetch['Authorization'] = `Bearer ${token}`;
      }

      const respuestaFetch = await fetch(urlBase, {
        method: 'POST',
        headers: headersFetch,
        body: JSON.stringify({
          archivoBase64: base64,
          nombreArchivo: nombreOriginal,
          ...parametros
        }),
        signal
      });

      const jsonResp = await respuestaFetch.json().catch(() => ({}));

      if (!respuestaFetch.ok || !jsonResp.exito) {
        const msg = extraerMensajeError(jsonResp, respuestaFetch.status);
        const error = new Error(msg);
        error.codigoEstado = jsonResp.codigoEstado || respuestaFetch.status;
        throw error;
      }

      data = jsonResp;
    } catch (errFallback) {
      if (signal?.aborted || errFallback.name === 'AbortError') {
        throw new Error('Operación cancelada');
      }
      console.error('[Network] Error en canal fallback:', errFallback.message);
      throw new Error(errFallback.message || 'No se pudo conectar con el servidor.');
    }
  }

  if (signal?.aborted) {
    throw new Error('Operación cancelada');
  }

  if (!data || !data.exito) {
    throw new Error(data?.mensaje || 'Error en la respuesta del servidor.');
  }

  // 3. Descarga y compartición automática del archivo resultante con progreso medible
  if (data.descargaUrl && compartirInmediato) {
    if (signal?.aborted) {
      throw new Error('Operación cancelada');
    }

    const nombreFinal = nombreArchivoSalida || data.nombreArchivo || 'documento.pdf';
    const uriDestinoLocal = `${FileSystem.documentDirectory}${nombreFinal}`;

    try {
      const downloadTask = FileSystem.createDownloadResumable(
        data.descargaUrl,
        uriDestinoLocal,
        {},
        (progresoDescarga) => {
          if (signal?.aborted) return;
          if (progresoDescarga.totalBytesExpectedToWrite > 0) {
            const ratio = progresoDescarga.totalBytesWritten / progresoDescarga.totalBytesExpectedToWrite;
            const pctDescarga = Math.min(100, Math.round(ratio * 100));
            // Descarga abarca del 80% al 98%
            const pctGlobal = Math.round(80 + ratio * 18);
            onProgreso?.(`Descargando archivo optimizado (${pctDescarga}%)...`, pctGlobal);
          }
        }
      );

      downloadTaskActual = downloadTask;
      const downloadResult = await downloadTask.downloadAsync();

      if (signal?.aborted) {
        await FileSystem.deleteAsync(uriDestinoLocal, { idempotent: true }).catch(() => {});
        throw new Error('Operación cancelada');
      }

      if (onProgreso) {
        onProgreso('¡Listo para compartir!', 100);
      }

      const puedeCompartir = await Sharing.isAvailableAsync();
      if (puedeCompartir && downloadResult?.uri) {
        await Sharing.shareAsync(downloadResult.uri, {
          dialogTitle: `Compartir ${nombreFinal}`,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Archivo generado', `Guardado con éxito como ${nombreFinal}`);
      }
    } catch (errDownload) {
      if (signal?.aborted || errDownload.message === 'Operación cancelada') {
        await FileSystem.deleteAsync(uriDestinoLocal, { idempotent: true }).catch(() => {});
        throw new Error('Operación cancelada');
      }
      throw errDownload;
    }
  }

  if (signal) {
    signal.removeEventListener('abort', alAbortar);
  }

  return data;
}

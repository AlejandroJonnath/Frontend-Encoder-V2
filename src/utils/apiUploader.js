import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { CONFIGURACION } from '../config/constantes';
import { supabase } from '../config/supabase';

const TIPO_SUBIDA_MULTIPART = FileSystem?.FileSystemUploadType?.MULTIPART ?? 1;

// Registro de última verificación de servidor despierto (para evitar pings redundantes)
let ultimaVerificacionServidor = 0;
const INTERVALO_CACHE_SALUD_MS = 60 * 1000; // 1 minuto

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
 * Procesa la subida y respuesta de cualquier operación documental con inyección de Auth.
 */
export async function procesarOperacionNativa({
  endpoint,
  archivoUri,
  campoNombre = 'pdf',
  parametros = {},
  nombreArchivoSalida,
  compartirInmediato = true,
  onProgreso = null
}) {
  // 0. Asegurar que el servidor esté activo (evita que uploads de 10MB cuelguen en un contenedor en reposo)
  await asegurarServidorDespierto(onProgreso);

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
    onProgreso('Subiendo y procesando documento...');
  }

  // 1. Intento primario: FileSystem.uploadAsync (multipart nativo por streams)
  let falloNativoLocal = false;
  let reintentoRealizado = false;

  while (!data) {
    try {
      const uploadResult = await FileSystem.uploadAsync(urlFinal, archivoUri, {
        fieldName: campoNombre,
        httpMethod: 'POST',
        uploadType: TIPO_SUBIDA_MULTIPART,
        headers
      });

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        data = JSON.parse(uploadResult.body);
        break;
      }

      // Si el servidor devolvió 502/503/504 (típico arranque en frío de Render) y no hemos reintentado:
      if ((uploadResult.status === 502 || uploadResult.status === 503 || uploadResult.status === 504) && !reintentoRealizado) {
        reintentoRealizado = true;
        if (onProgreso) {
          onProgreso('El servidor está terminando de inicializarse. Reintentando subida...');
        }
        await new Promise(r => setTimeout(r, 4000));
        continue; // Reintentar uploadAsync
      }

      // Si el servidor respondió con un código HTTP, NUNCA caer en Base64 ciegamente:
      // el problema es del servidor o de credenciales, no del canal multipart local.
      const errorMsg = extraerMensajeError(uploadResult.body, uploadResult.status);
      const error = new Error(errorMsg);
      error.codigoEstado = uploadResult.status;
      throw error;

    } catch (errUpload) {
      // Si el error ya tiene un codigoEstado HTTP (el servidor respondió), propagarlo de inmediato
      if (errUpload.codigoEstado) {
        throw errUpload;
      }

      // Si fue un fallo nativo local del cliente (ej. Scoped Storage / URI no accesible nativamente):
      console.warn('[Network] Falló uploadAsync nativo local, evaluando fallback Base64:', errUpload.message);
      falloNativoLocal = true;
      break;
    }
  }

  // 2. Canal fallback Base64 JSON (SOLO si falló la lectura nativa del dispositivo y el archivo es < 15MB)
  if (!data && falloNativoLocal) {
    try {
      if (onProgreso) {
        onProgreso('Procesando archivo mediante canal alternativo...');
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
        })
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
      console.error('[Network] Error en canal fallback:', errFallback.message);
      throw new Error(errFallback.message || 'No se pudo conectar con el servidor.');
    }
  }

  if (!data || !data.exito) {
    throw new Error(data?.mensaje || 'Error en la respuesta del servidor.');
  }

  // 3. Descarga y compartición automática del archivo resultante
  if (data.descargaUrl && compartirInmediato) {
    if (onProgreso) {
      onProgreso('Descargando archivo optimizado...');
    }

    const nombreFinal = nombreArchivoSalida || data.nombreArchivo || 'documento.pdf';
    const uriDestinoLocal = `${FileSystem.documentDirectory}${nombreFinal}`;

    const downloadResult = await FileSystem.downloadAsync(
      data.descargaUrl,
      uriDestinoLocal
    );

    const puedeCompartir = await Sharing.isAvailableAsync();
    if (puedeCompartir) {
      await Sharing.shareAsync(downloadResult.uri, {
        dialogTitle: `Compartir ${nombreFinal}`,
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf'
      });
    } else {
      Alert.alert('Archivo generado', `Guardado con éxito como ${nombreFinal}`);
    }
  }

  return data;
}

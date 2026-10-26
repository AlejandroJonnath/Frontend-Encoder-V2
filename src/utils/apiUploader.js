import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { CONFIGURACION } from '../config/constantes';
import { supabase } from '../config/supabase';

const TIPO_SUBIDA_MULTIPART = FileSystem?.FileSystemUploadType?.MULTIPART ?? 1;

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
 * Realiza una petición JSON directa al backend con inyección automática de Auth
 */
export async function peticionApiJson({
  endpoint,
  metodo = 'POST',
  body = null,
  headersPersonalizados = {}
}) {
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
    const mensajeError = data.mensaje || `Error en el servidor (${res.status})`;
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
  compartirInmediato = true
}) {
  const urlBase = `${CONFIGURACION.URL_API_BACKEND}${endpoint}`;
  const token = await obtenerTokenAuth();
  let data = null;

  // 1. Intento primario: FileSystem.uploadAsync (multipart nativo)
  try {
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

    const uploadResult = await FileSystem.uploadAsync(urlFinal, archivoUri, {
      fieldName: campoNombre,
      httpMethod: 'POST',
      uploadType: TIPO_SUBIDA_MULTIPART,
      headers
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      data = JSON.parse(uploadResult.body);
    } else {
      let msg = `Error al subir archivo (${uploadResult.status})`;
      try {
        const bodyParsed = JSON.parse(uploadResult.body);
        if (bodyParsed.mensaje) msg = bodyParsed.mensaje;
      } catch (_) {}
      throw new Error(msg);
    }
  } catch (errUpload) {
    // 2. Canal fallback Base64 JSON
    try {
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
        const msg = jsonResp.mensaje || `Error al procesar el archivo (${respuestaFetch.status})`;
        const error = new Error(msg);
        error.codigoEstado = jsonResp.codigoEstado || respuestaFetch.status;
        throw error;
      }

      data = jsonResp;
    } catch (errFallback) {
      console.error('[Network] Error en canal de subida:', errFallback.message);
      throw new Error(errFallback.message || 'No se pudo conectar con el servidor.');
    }
  }

  if (!data || !data.exito) {
    throw new Error(data?.mensaje || 'Error en la respuesta del servidor.');
  }

  // 3. Descarga y compartición automática del archivo resultante
  if (data.descargaUrl && compartirInmediato) {
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

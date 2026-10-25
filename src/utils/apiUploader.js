import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { CONFIGURACION } from '../config/constantes';

const TIPO_SUBIDA_MULTIPART = FileSystem?.FileSystemUploadType?.MULTIPART ?? 1;

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
 * DocumentPicker puede generar URIs como:
 *   file:///cache/DocumentPicker/1234567890_documento.docx
 * Esta función devuelve "documento.docx" eliminando el prefijo de timestamp.
 */
function extraerNombreOriginalDeUri(uri) {
  try {
    const segmentos = uri.split('/');
    const nombreDesdeUri = decodeURIComponent(segmentos[segmentos.length - 1] || 'archivo.bin');
    // Limpiar posibles timestamps de caché de DocumentPicker (ej: "1234567890_doc.docx" → "doc.docx")
    return nombreDesdeUri.replace(/^\d+_/, '');
  } catch (_) {
    return 'archivo.bin';
  }
}

/**
 * Procesa la subida y respuesta de cualquier operación documental.
 *
 * ESTRATEGIA DE DOS CANALES:
 * 1. Canal primario: FileSystem.uploadAsync (multipart nativo, más rápido)
 * 2. Canal fallback: fetch con Base64 JSON (garantiza lectura en Expo Go Android,
 *    donde las URIs de caché de DocumentPicker no son legibles por uploadAsync)
 *
 * IMPORTANTE: el fallback usa el nombre ORIGINAL del archivo de entrada (extraído del URI),
 * NO el nombreArchivoSalida. Usar el nombre de salida causaba que el backend viera ".pdf"
 * como extensión de un archivo Word/Excel y lo rechazara por tipo inválido.
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
    if (parametros && Object.keys(parametros).length > 0) {
      // Filtrar strings largos (como base64) para no exceder el límite de 8KB de cabeceras HTTP
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
      throw new Error(`Status ${uploadResult.status}: ${uploadResult.body}`);
    }
  } catch (errUpload) {
    // 2. Canal fallback Base64 JSON
    // Bypasea las restricciones de Scoped Storage de Expo Go Android.
    //
    // ⚠️ CRÍTICO - nombreArchivo:
    //   Se usa el nombre ORIGINAL extraído del URI de ENTRADA (ej: "informe.docx"),
    //   NO el nombreArchivoSalida (ej: "informe_converted.pdf").
    //   Si se usara el de salida, el backend vería ".pdf" y rechazaría el Word/Excel.
    try {
      const base64 = await leerUriComoBase64(archivoUri);
      const nombreOriginal = extraerNombreOriginalDeUri(archivoUri);

      const respuestaFetch = await fetch(urlBase, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-retorno-json': 'true'
        },
        body: JSON.stringify({
          archivoBase64: base64,
          nombreArchivo: nombreOriginal,   // ← extensión real del archivo de entrada
          ...parametros
        })
      });

      if (!respuestaFetch.ok) {
        let msg = 'Error en el servidor al procesar el archivo.';
        try {
          const errData = await respuestaFetch.json();
          if (errData.mensaje) msg = errData.mensaje;
        } catch (_) {}
        throw new Error(msg);
      }

      data = await respuestaFetch.json();
    } catch (errFallback) {
      console.error('Error en canal alternativo:', errFallback.message);
      throw new Error(errFallback.message || 'No se pudo procesar el archivo.');
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

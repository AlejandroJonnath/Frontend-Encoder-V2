import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Guarda un archivo recibido como base64 o blob y activa el diálogo nativo de compartir
 * asegurando la nomenclatura exacta exigida:
 * - _signed.pdf
 * - _compress.pdf
 * - _join.pdf
 * - _addnote.pdf
 */
export async function guardarYCompartirArchivo(dataBlobOBase64, nombreArchivoSalida) {
  try {
    const uriDestino = `${FileSystem.documentDirectory}${nombreArchivoSalida}`;

    if (typeof dataBlobOBase64 === 'string' && dataBlobOBase64.startsWith('data:')) {
      // Si viene como data URI en base64
      const base64Data = dataBlobOBase64.split(',')[1];
      await FileSystem.writeAsStringAsync(uriDestino, base64Data, {
        encoding: FileSystem.EncodingType?.Base64 || 'base64',
      });
    } else {
      await FileSystem.writeAsStringAsync(uriDestino, dataBlobOBase64, {
        encoding: FileSystem.EncodingType?.UTF8 || 'utf8',
      });
    }

    const puedeCompartir = await Sharing.isAvailableAsync();
    if (puedeCompartir) {
      await Sharing.shareAsync(uriDestino, {
        dialogTitle: `Compartir ${nombreArchivoSalida}`,
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf'
      });
    } else {
      Alert.alert('Archivo guardado', `Se guardó correctamente como: ${nombreArchivoSalida}`);
    }

    return uriDestino;
  } catch (err) {
    console.error('Error al guardar o compartir archivo:', err.message);
    Alert.alert('Error al compartir', err.message);
    throw err;
  }
}

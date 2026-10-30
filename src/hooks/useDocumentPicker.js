import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAlerta } from '../context/AlertContext';

const LIMITE_TAMANIO_2GB = 2 * 1024 * 1024 * 1024;

/**
 * Hook reutilizable para seleccionar y pre-validar archivos con DocumentPicker
 */
export function useDocumentPicker({
  tipoMime = '*/*',
  extensionesPermitidas = [],
  tamanioMaxBytes = LIMITE_TAMANIO_2GB,
  etiquetaFormato = 'documento'
} = {}) {
  const [archivo, setArchivo] = useState(null);
  const [cargandoSeleccion, setCargandoSeleccion] = useState(false);
  const { mostrarErrorFormatoInvalido, mostrarErrorOperacion } = useAlerta();

  const seleccionarArchivo = useCallback(async () => {
    try {
      setCargandoSeleccion(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: tipoMime,
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const doc = res.assets[0];

        // 1. Validar extensión permitida si se especificó
        if (extensionesPermitidas.length > 0) {
          const nombreLower = (doc.name || '').toLowerCase();
          const coincide = extensionesPermitidas.some(ext => nombreLower.endsWith(ext.toLowerCase()));
          if (!coincide) {
            mostrarErrorFormatoInvalido(extensionesPermitidas.join(', '));
            return null;
          }
        }

        // 2. Pre-validar tamaño máximo en el cliente
        if (doc.size && doc.size > tamanioMaxBytes) {
          mostrarErrorOperacion(
            'Archivo demasiado pesado',
            `El archivo seleccionado excede el límite máximo permitido de ${Math.round(tamanioMaxBytes / (1024 * 1024 * 1024))}GB.`
          );
          return null;
        }

        // 3. Garantizar que la URI esté accesible en el cache de la aplicación
        let uriAccesible = doc.uri;
        try {
          if (FileSystem?.cacheDirectory && !uriAccesible.startsWith(FileSystem.cacheDirectory) && !uriAccesible.startsWith(FileSystem.documentDirectory)) {
            const nombreLimpio = (doc.name || 'documento.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
            const destinoCache = `${FileSystem.cacheDirectory}picker_${Date.now()}_${nombreLimpio}`;
            await FileSystem.copyAsync({
              from: uriAccesible,
              to: destinoCache
            });
            uriAccesible = destinoCache;
          }
        } catch (_) {
          // Si copyAsync no puede moverlo (ej. restricción de scope en Expo Go), se preserva la URI original
        }

        const docPreparado = {
          ...doc,
          uri: uriAccesible
        };

        setArchivo(docPreparado);
        return docPreparado;
      }
      return null;
    } catch (err) {
      mostrarErrorOperacion('Error al acceder al archivo', err.message);
      return null;
    } finally {
      setCargandoSeleccion(false);
    }
  }, [tipoMime, extensionesPermitidas, tamanioMaxBytes, mostrarErrorFormatoInvalido, mostrarErrorOperacion]);

  const limpiarArchivo = useCallback(() => {
    setArchivo(null);
  }, []);

  return {
    archivo,
    setArchivo,
    seleccionarArchivo,
    limpiarArchivo,
    cargandoSeleccion,
  };
}

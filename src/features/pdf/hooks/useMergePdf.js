import { useState, useCallback, useRef } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAlerta } from '../../../context/AlertContext';
import { subirPdfParaUnirApi, procesarUnirSesionApi } from '../../../api/pdf.api';
import { generarNombreSalida } from '../../../utils/fileFormatters';
import { asegurarServidorDespierto } from '../../../utils/apiUploader';

export function useMergePdf() {
  const { mostrarErrorCampos, mostrarErrorOperacion } = useAlerta();
  const [archivosPdf, setArchivosPdf] = useState([]);
  const [uniendo, setUniendo] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [progresoTexto, setProgresoTexto] = useState('');
  const abortControllerRef = useRef(null);

  const agregarPdfs = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const assetsPreparados = await Promise.all(res.assets.map(async (doc) => {
          let uriAccesible = doc.uri;
          try {
            if (FileSystem?.cacheDirectory && !uriAccesible.startsWith(FileSystem.cacheDirectory) && !uriAccesible.startsWith(FileSystem.documentDirectory)) {
              const nombreLimpio = (doc.name || 'doc.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
              const destino = `${FileSystem.cacheDirectory}merge_${Date.now()}_${nombreLimpio}`;
              await FileSystem.copyAsync({ from: uriAccesible, to: destino });
              uriAccesible = destino;
            }
          } catch (_) {}
          return { ...doc, uri: uriAccesible };
        }));
        setArchivosPdf(prev => [...prev, ...assetsPreparados]);
      }
    } catch (err) {
      mostrarErrorOperacion('Error de acceso', 'No se pudieron seleccionar los archivos.');
    }
  }, [mostrarErrorOperacion]);

  const eliminarArchivo = useCallback((index) => {
    setArchivosPdf(prev => prev.filter((_, i) => i !== index));
  }, []);

  const moverArriba = useCallback((index) => {
    if (index === 0) return;
    setArchivosPdf(prev => {
      const nuevos = [...prev];
      const temp = nuevos[index - 1];
      nuevos[index - 1] = nuevos[index];
      nuevos[index] = temp;
      return nuevos;
    });
  }, []);

  const moverAbajo = useCallback((index) => {
    setArchivosPdf(prev => {
      if (index === prev.length - 1) return prev;
      const nuevos = [...prev];
      const temp = nuevos[index + 1];
      nuevos[index + 1] = nuevos[index];
      nuevos[index] = temp;
      return nuevos;
    });
  }, []);

  const cancelarUnion = useCallback(() => {
    setCancelando(true);
    setProgresoTexto('Cancelando operación...');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUniendo(false);
    setCancelando(false);
    setProgresoTexto('');
  }, []);

  const ejecutarUnion = useCallback(async () => {
    if (archivosPdf.length < 2) {
      mostrarErrorCampos('Agrega al menos dos archivos PDF para poder unirlos en un solo documento.');
      return false;
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setUniendo(true);
      setCancelando(false);
      const sesionId = `merge_${Date.now()}`;

      // Despertar el servidor antes de la primera subida (evita timeout en cold start de Render)
      setProgresoTexto('Conectando con el servidor...');
      await asegurarServidorDespierto((msg) => setProgresoTexto(msg));

      if (signal.aborted) throw new Error('Operación cancelada');

      for (let i = 0; i < archivosPdf.length; i++) {
        if (signal.aborted) throw new Error('Operación cancelada');
        setProgresoTexto(`Subiendo archivo ${i + 1} de ${archivosPdf.length}...`);
        await subirPdfParaUnirApi({
          archivoUri: archivosPdf[i].uri,
          sesionId
        });
      }

      if (signal.aborted) throw new Error('Operación cancelada');
      setProgresoTexto('Uniendo y optimizando el documento final...');

      const data = await procesarUnirSesionApi({
        sesionId,
        nombresOrdenados: archivosPdf.map(a => a.name)
      });

      if (signal.aborted) throw new Error('Operación cancelada');

      if (!data.exito || !data.descargaUrl) {
        throw new Error(data.mensaje || 'Error al procesar la unión de PDFs.');
      }

      const nombreSalida = generarNombreSalida(archivosPdf[0].name, '_join', '.pdf');
      const uriDestino = `${FileSystem.documentDirectory}${nombreSalida}`;

      const downloadResult = await FileSystem.downloadAsync(data.descargaUrl, uriDestino);

      if (signal.aborted) {
        await FileSystem.deleteAsync(uriDestino, { idempotent: true }).catch(() => {});
        throw new Error('Operación cancelada');
      }

      if (downloadResult && downloadResult.status >= 400) {
        let errorMsg = 'Error al descargar el PDF unificado.';
        try {
          const bodyError = await FileSystem.readAsStringAsync(uriDestino);
          const parsed = JSON.parse(bodyError);
          if (parsed.mensaje) errorMsg = parsed.mensaje;
        } catch (_) {}
        await FileSystem.deleteAsync(uriDestino, { idempotent: true }).catch(() => {});
        throw new Error(errorMsg);
      }

      const infoArchivo = await FileSystem.getInfoAsync(uriDestino);
      if (!infoArchivo.exists || (infoArchivo.size !== undefined && infoArchivo.size < 50)) {
        await FileSystem.deleteAsync(uriDestino, { idempotent: true }).catch(() => {});
        throw new Error('El archivo generado no es un documento válido o está vacío.');
      }

      const puedeCompartir = await Sharing.isAvailableAsync();
      if (puedeCompartir) {
        await Sharing.shareAsync(downloadResult.uri, {
          dialogTitle: `Compartir ${nombreSalida}`,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf'
        });
      }

      return true;
    } catch (err) {
      if (err.message !== 'Operación cancelada' && err.name !== 'AbortError') {
        mostrarErrorOperacion('Error al unir PDFs', err.message);
      }
      return false;
    } finally {
      setUniendo(false);
      setCancelando(false);
      setProgresoTexto('');
      abortControllerRef.current = null;
    }
  }, [archivosPdf, mostrarErrorCampos, mostrarErrorOperacion]);

  const limpiar = useCallback(() => {
    setArchivosPdf([]);
    setUniendo(false);
    setCancelando(false);
    setProgresoTexto('');
  }, []);

  return {
    archivosPdf,
    uniendo,
    cancelando,
    progresoTexto,
    agregarPdfs,
    eliminarArchivo,
    moverArriba,
    moverAbajo,
    ejecutarUnion,
    cancelarUnion,
    limpiar
  };
}

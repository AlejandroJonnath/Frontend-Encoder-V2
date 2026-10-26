import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAlerta } from '../../../context/AlertContext';
import { subirPdfParaUnirApi, procesarUnirSesionApi } from '../../../api/pdf.api';
import { generarNombreSalida } from '../../../utils/fileFormatters';

export function useMergePdf() {
  const { mostrarErrorCampos, mostrarErrorOperacion } = useAlerta();
  const [archivosPdf, setArchivosPdf] = useState([]);
  const [uniendo, setUniendo] = useState(false);
  const [progresoTexto, setProgresoTexto] = useState('');

  const agregarPdfs = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setArchivosPdf(prev => [...prev, ...res.assets]);
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

  const ejecutarUnion = useCallback(async () => {
    if (archivosPdf.length < 2) {
      mostrarErrorCampos('Agrega al menos dos archivos PDF para poder unirlos en un solo documento.');
      return false;
    }

    try {
      setUniendo(true);
      const sesionId = `merge_${Date.now()}`;

      for (let i = 0; i < archivosPdf.length; i++) {
        setProgresoTexto(`Subiendo archivo ${i + 1} de ${archivosPdf.length}...`);
        await subirPdfParaUnirApi({
          archivoUri: archivosPdf[i].uri,
          sesionId
        });
      }

      setProgresoTexto('Uniendo y optimizando el documento final...');

      const data = await procesarUnirSesionApi({
        sesionId,
        nombresOrdenados: archivosPdf.map(a => a.name)
      });

      if (!data.exito || !data.descargaUrl) {
        throw new Error(data.mensaje || 'Error al procesar la unión de PDFs.');
      }

      const nombreSalida = generarNombreSalida(archivosPdf[0].name, '_join', '.pdf');
      const uriDestino = `${FileSystem.documentDirectory}${nombreSalida}`;

      const downloadResult = await FileSystem.downloadAsync(data.descargaUrl, uriDestino);
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
      mostrarErrorOperacion('Error al unir PDFs', err.message);
      return false;
    } finally {
      setUniendo(false);
      setProgresoTexto('');
    }
  }, [archivosPdf, mostrarErrorCampos, mostrarErrorOperacion]);

  const limpiar = useCallback(() => {
    setArchivosPdf([]);
    setUniendo(false);
    setProgresoTexto('');
  }, []);

  return {
    archivosPdf,
    uniendo,
    progresoTexto,
    agregarPdfs,
    eliminarArchivo,
    moverArriba,
    moverAbajo,
    ejecutarUnion,
    limpiar
  };
}

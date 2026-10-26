import { useState, useCallback } from 'react';
import { useDocumentPicker } from '../../../hooks/useDocumentPicker';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { agregarNotaPdfApi } from '../../../api/pdf.api';
import { useAlerta } from '../../../context/AlertContext';
import { generarNombreSalida } from '../../../utils/fileFormatters';

export function useAddNote() {
  const { mostrarErrorFaltaArchivo, mostrarErrorCampos } = useAlerta();
  const [textoNota, setTextoNota] = useState('');
  const [posicionNota, setPosicionNota] = useState({ x: 100, y: 100, pagina: 1 });
  const [modalVisorVisible, setModalVisorVisible] = useState(false);

  const {
    archivo: archivoPdf,
    seleccionarArchivo: seleccionarPdf,
    limpiarArchivo: limpiarPdf,
    cargandoSeleccion
  } = useDocumentPicker({
    tipoMime: 'application/pdf',
    extensionesPermitidas: ['.pdf'],
    etiquetaFormato: 'PDF'
  });

  const {
    cargando: procesando,
    ejecutar,
    resultado,
    reiniciar
  } = useAsyncOperation({ tituloErrorPorDefecto: 'Error al agregar nota' });

  const ejecutarAgregarNota = useCallback(async () => {
    if (!archivoPdf) {
      mostrarErrorFaltaArchivo('PDF');
      return null;
    }
    if (!textoNota.trim()) {
      mostrarErrorCampos('Escribe el contenido de la nota adhesiva antes de continuar.');
      return null;
    }

    const nombreSalida = generarNombreSalida(archivoPdf.name, '_addnote', '.pdf');

    return await ejecutar(
      agregarNotaPdfApi({
        archivoUri: archivoPdf.uri,
        textoNota: textoNota.trim(),
        posicion: posicionNota,
        nombreArchivoSalida: nombreSalida
      }),
      { mensajeProgreso: 'Incrustando nota vectorial en el PDF...' }
    );
  }, [archivoPdf, textoNota, posicionNota, ejecutar, mostrarErrorFaltaArchivo, mostrarErrorCampos]);

  return {
    archivoPdf,
    textoNota,
    setTextoNota,
    posicionNota,
    setPosicionNota,
    procesando,
    cargandoSeleccion,
    resultado,
    modalVisorVisible,
    setModalVisorVisible,
    seleccionarPdf,
    limpiarPdf,
    ejecutarAgregarNota,
    reiniciar
  };
}

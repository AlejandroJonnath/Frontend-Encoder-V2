import { useState, useCallback, useEffect } from 'react';
import { useDocumentPicker } from '../../../hooks/useDocumentPicker';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { agregarNotaPdfApi } from '../../../api/pdf.api';
import { useAlerta } from '../../../context/AlertContext';
import { useAuth } from '../../../context/AuthContext';
import { generarNombreSalida } from '../../../utils/fileFormatters';

export function useAddNote() {
  const { mostrarErrorFaltaArchivo, mostrarErrorCampos } = useAlerta();
  const { usuario, perfil } = useAuth();
  
  const nombrePorDefecto = perfil?.nombre || usuario?.user_metadata?.first_name || usuario?.user_metadata?.full_name || '';
  const [nombreAutor, setNombreAutor] = useState(nombrePorDefecto);
  const [textoNota, setTextoNota] = useState('');
  const [posicionNota, setPosicionNota] = useState({ x: 100, y: 100, pagina: 1 });
  const [modalVisorVisible, setModalVisorVisible] = useState(false);

  useEffect(() => {
    if (!nombreAutor && (perfil?.nombre || usuario?.user_metadata?.first_name)) {
      setNombreAutor(perfil?.nombre || usuario?.user_metadata?.first_name || '');
    }
  }, [perfil, usuario]);

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
    mensajeCarga,
    progreso,
    cancelando,
    ejecutar,
    cancelar: cancelarNota,
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
      (actualizarProgreso, signal) => agregarNotaPdfApi({
        archivoUri: archivoPdf.uri,
        textoNota: textoNota.trim(),
        posicion: posicionNota,
        autor: nombreAutor.trim() || 'Usuario',
        nombreArchivoSalida: nombreSalida,
        signal,
        onProgreso: actualizarProgreso
      }),
      { mensajeProgreso: 'Incrustando nota vectorial en el PDF...' }
    );
  }, [archivoPdf, textoNota, posicionNota, nombreAutor, ejecutar, mostrarErrorFaltaArchivo, mostrarErrorCampos]);

  return {
    archivoPdf,
    nombreAutor,
    setNombreAutor,
    textoNota,
    setTextoNota,
    posicionNota,
    setPosicionNota,
    procesando,
    mensajeCarga,
    progreso,
    cancelando,
    cargandoSeleccion,
    resultado,
    modalVisorVisible,
    setModalVisorVisible,
    seleccionarPdf,
    limpiarPdf,
    ejecutarAgregarNota,
    cancelarNota,
    reiniciar
  };
}

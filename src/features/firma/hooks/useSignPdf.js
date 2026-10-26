import { useState, useCallback } from 'react';
import { useDocumentPicker } from '../../../hooks/useDocumentPicker';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation';
import { subirCertificadoP12Api, firmarPdfApi } from '../../../api/firma.api';
import { useAlerta } from '../../../context/AlertContext';
import { generarNombreSalida } from '../../../utils/fileFormatters';

export function useSignPdf() {
  const { mostrarErrorFaltaArchivo, mostrarErrorCampos } = useAlerta();
  const [contrasenaP12, setContrasenaP12] = useState('');
  const [posicionFirma, setPosicionFirma] = useState({ x: 50, y: 50, pagina: 1, ancho: 130, alto: 40 });
  const [modalVisorVisible, setModalVisorVisible] = useState(false);

  // Selector de PDF
  const {
    archivo: archivoPdf,
    seleccionarArchivo: seleccionarPdf,
    limpiarArchivo: limpiarPdf,
    cargandoSeleccion: cargandoPdf
  } = useDocumentPicker({
    tipoMime: 'application/pdf',
    extensionesPermitidas: ['.pdf'],
    etiquetaFormato: 'PDF'
  });

  // Selector de Certificado .P12 / .PFX
  const {
    archivo: archivoP12,
    seleccionarArchivo: seleccionarP12,
    limpiarArchivo: limpiarP12,
    cargandoSeleccion: cargandoP12
  } = useDocumentPicker({
    tipoMime: '*/*',
    extensionesPermitidas: ['.p12', '.pfx'],
    etiquetaFormato: 'Certificado .p12'
  });

  const {
    cargando: firmando,
    ejecutar,
    resultado,
    reiniciar
  } = useAsyncOperation({ tituloErrorPorDefecto: 'Error en Firma Electrónica' });

  const ejecutarFirma = useCallback(async () => {
    if (!archivoPdf) {
      mostrarErrorFaltaArchivo('PDF');
      return null;
    }
    if (!archivoP12) {
      mostrarErrorFaltaArchivo('.p12 o .pfx');
      return null;
    }
    if (!contrasenaP12.trim()) {
      mostrarErrorCampos('Ingresa la contraseña de tu archivo .p12 para continuar.');
      return null;
    }

    const nombreSalida = generarNombreSalida(archivoPdf.name, '_signed', '.pdf');

    return await ejecutar((async () => {
      // 1. Subir certificado y obtener token temporal
      const resP12 = await subirCertificadoP12Api({
        archivoP12Uri: archivoP12.uri
      });

      if (!resP12 || !resP12.tokenP12) {
        throw new Error(resP12?.mensaje || 'No se pudo procesar el certificado digital.');
      }

      // 2. Firmar documento
      return await firmarPdfApi({
        archivoPdfUri: archivoPdf.uri,
        tokenP12: resP12.tokenP12,
        contrasena: contrasenaP12,
        posicion: posicionFirma,
        razon: 'Firma Electrónica Autorizada',
        nombreArchivoSalida: nombreSalida
      });
    })(), { mensajeProgreso: 'Validando certificado y estampando firma digital...' });
  }, [archivoPdf, archivoP12, contrasenaP12, posicionFirma, ejecutar, mostrarErrorFaltaArchivo, mostrarErrorCampos]);

  return {
    archivoPdf,
    archivoP12,
    contrasenaP12,
    setContrasenaP12,
    posicionFirma,
    setPosicionFirma,
    firmando,
    cargandoPdf,
    cargandoP12,
    resultado,
    modalVisorVisible,
    setModalVisorVisible,
    seleccionarPdf,
    limpiarPdf,
    seleccionarP12,
    limpiarP12,
    ejecutarFirma,
    reiniciar
  };
}

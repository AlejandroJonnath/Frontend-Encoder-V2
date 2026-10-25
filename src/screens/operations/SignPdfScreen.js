import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  SafeAreaView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import ScreenContainer from '../../components/ScreenContainer';
import PdfRealDocumentViewer from '../../components/PdfRealDocumentViewer';
import { procesarOperacionNativa, leerUriComoBase64 } from '../../utils/apiUploader';

export default function SignPdfScreen({ onVolver }) {
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [archivoP12, setArchivoP12] = useState(null);
  const [contrasenaP12, setContrasenaP12] = useState('');
  const [posicionFirma, setPosicionFirma] = useState({ x: 50, y: 50, pagina: 1, ancho: 200, alto: 70 });
  const [firmando, setFirmando] = useState(false);
  const [modalVisorVisible, setModalVisorVisible] = useState(false);

  const seleccionarPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setArchivoPdf(res.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el PDF.');
    }
  };

  const seleccionarP12 = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const doc = res.assets[0];
        if (!doc.name.toLowerCase().endsWith('.p12') && !doc.name.toLowerCase().endsWith('.pfx')) {
          Alert.alert('Archivo no válido', 'Debes seleccionar un archivo con extensión .p12 o .pfx');
          return;
        }
        setArchivoP12(doc);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo .p12');
    }
  };

  const ejecutarFirma = async () => {
    // Validar con los valores del estado actuales
    if (!archivoPdf) {
      Alert.alert('Falta el PDF', 'Selecciona el documento que deseas firmar.');
      return;
    }
    if (!archivoP12) {
      Alert.alert('Falta el certificado', 'Carga tu archivo de firma electrónica .p12 o .pfx.');
      return;
    }
    if (!contrasenaP12.trim()) {
      Alert.alert('Contraseña requerida', 'Ingresa la contraseña de tu archivo .p12.');
      return;
    }

    try {
      setFirmando(true);

      // 1. Subir el certificado .p12 para asegurar integridad binaria sin truncamiento en cabeceras
      const resP12 = await procesarOperacionNativa({
        endpoint: '/pdf/subir-p12',
        archivoUri: archivoP12.uri,
        campoNombre: 'p12',
        compartirInmediato: false
      });

      if (!resP12 || !resP12.tokenP12) {
        throw new Error(resP12?.mensaje || 'No se pudo procesar el certificado .p12.');
      }

      const nombreBase = archivoPdf.name.replace(/\.pdf$/i, '');
      const nombreSalida = `${nombreBase}_signed.pdf`;

      // 2. Firmar el PDF enviando el token del certificado
      await procesarOperacionNativa({
        endpoint: '/pdf/firmar',
        archivoUri: archivoPdf.uri,
        campoNombre: 'pdf',
        parametros: {
          tokenP12: resP12.tokenP12,
          contrasena: contrasenaP12,
          posicion: JSON.stringify(posicionFirma),
          razon: 'Firma Electrónica Autorizada'
        },
        nombreArchivoSalida: nombreSalida,
        compartirInmediato: true
      });

    } catch (err) {
      Alert.alert('Error en Firma', err.message || 'Verifica la contraseña del certificado .p12.');
    } finally {
      setFirmando(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Firmar con .p12 (FirmaEC)"
      subtitulo="Firma digital válida • Previsualizador interactivo"
      iconoTitulo="🖋️"
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Guía */}
        <View style={estilos.bannerGuia}>
          <Text style={estilos.tituloGuia}>💡 Previsualizador Real Estilo FirmaEC</Text>
          <Text style={estilos.textoGuia}>
            Visualiza el contenido real de tu PDF y arrastra la estampa azul exactamente donde desees que se aplique la firma digital.
          </Text>
        </View>

        {/* Paso 1: PDF */}
        <View style={estilos.cardPaso}>
          <View style={estilos.headerPaso}>
            <View style={estilos.badgeNumero}><Text style={estilos.textoNumero}>1</Text></View>
            <Text style={estilos.tituloPaso}>Documento PDF a Firmar</Text>
          </View>

          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarPdf} activeOpacity={0.7}>
            <Text style={estilos.iconoPicker}>{archivoPdf ? '📄' : '📁'}</Text>
            <View style={estilos.infoPicker}>
              <Text style={estilos.textoPickerPrincipal}>
                {archivoPdf ? archivoPdf.name : 'Seleccionar Documento PDF'}
              </Text>
              <Text style={estilos.textoPickerSub}>
                {archivoPdf ? `${(archivoPdf.size / (1024 * 1024)).toFixed(2)} MB cargado` : 'Toca para abrir tus archivos'}
              </Text>
            </View>
            {archivoPdf && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Paso 2: Ubicar Firma mediante Viñeta Enfocada */}
        {archivoPdf && (
          <View style={estilos.cardPaso}>
            <View style={estilos.headerPaso}>
              <View style={estilos.badgeNumero}><Text style={estilos.textoNumero}>2</Text></View>
              <Text style={estilos.tituloPaso}>Posición de la Firma</Text>
            </View>

            <View style={estilos.cajaResumenPosicion}>
              <View style={estilos.iconoPosicion}><Text style={{ fontSize: 24 }}>📍</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.textoPosicionTitulo}>Página {posicionFirma.pagina}</Text>
                <Text style={estilos.textoPosicionCoords}>
                  Coordenadas: X={Math.round(posicionFirma.x)} pt • Y={Math.round(posicionFirma.y)} pt
                </Text>
              </View>
              <View style={estilos.badgeFijado}>
                <Text style={estilos.textoBadgeFijado}>✓ Fijada</Text>
              </View>
            </View>

            <TouchableOpacity
              style={estilos.btnAbrirViñeta}
              onPress={() => setModalVisorVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={estilos.textoBtnAbrirViñeta}>🔍 Abrir Viñeta de Ubicación (Pantalla Completa)</Text>
            </TouchableOpacity>

            <Text style={estilos.textoGuiaViñeta}>
              Abre el documento en una viñeta enfocada para arrastrar o pulsar la firma con total libertad sin que la pantalla del celular se mueva.
            </Text>
          </View>
        )}

        {/* Paso 3: Certificado .p12 y clave */}
        <View style={estilos.cardPaso}>
          <View style={estilos.headerPaso}>
            <View style={estilos.badgeNumero}><Text style={estilos.textoNumero}>3</Text></View>
            <Text style={estilos.tituloPaso}>Certificado Digital (.p12 / .pfx)</Text>
          </View>

          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarP12} activeOpacity={0.7}>
            <Text style={estilos.iconoPicker}>{archivoP12 ? '🔑' : '🔐'}</Text>
            <View style={estilos.infoPicker}>
              <Text style={estilos.textoPickerPrincipal}>
                {archivoP12 ? archivoP12.name : 'Seleccionar Archivo .p12 o .pfx'}
              </Text>
              <Text style={estilos.textoPickerSub}>
                {archivoP12 ? 'Certificado cargado' : 'Emitido por BCE, Security Data, etc.'}
              </Text>
            </View>
            {archivoP12 && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>

          <View style={estilos.campoClave}>
            <Text style={estilos.etiquetaClave}>Contraseña del Certificado</Text>
            <TextInput
              style={estilos.inputClave}
              placeholder="Escribe la clave de tu firma digital"
              placeholderTextColor="#64748B"
              secureTextEntry
              value={contrasenaP12}
              onChangeText={setContrasenaP12}
            />
          </View>
        </View>

        {/* Botón de Acción Principal */}
        <TouchableOpacity
          style={[estilos.btnFirmar, (firmando || !archivoPdf || !archivoP12) && { opacity: 0.6 }]}
          onPress={ejecutarFirma}
          disabled={firmando || !archivoPdf || !archivoP12}
          activeOpacity={0.8}
        >
          {firmando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={estilos.textoBtnFirmar}>
              Firmar y Compartir (_signed.pdf)
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Viñeta Enfocada a Pantalla Completa para Ubicar Firma */}
      <Modal
        visible={modalVisorVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisorVisible(false)}
      >
        <SafeAreaView style={estilos.modalContenedor}>
          <View style={estilos.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.modalTitulo}>📍 Ubicar Firma en Documento</Text>
              <Text style={estilos.modalSubtitulo}>
                Arrastra la estampa azul o pulsa sobre la hoja donde deseas firmar
              </Text>
            </View>
            <TouchableOpacity
              style={estilos.btnCerrarModal}
              onPress={() => setModalVisorVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={estilos.textoBtnCerrarModal}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={estilos.modalCuerpo}>
            {archivoPdf && (
              <PdfRealDocumentViewer
                archivoPdfUri={archivoPdf.uri}
                alCambiarPosicion={setPosicionFirma}
                etiqueta="FirmaEC"
                pantallaCompleta={true}
              />
            )}
          </View>

          <View style={estilos.modalFooter}>
            <View style={estilos.modalInfoCoords}>
              <Text style={estilos.modalCoordsTexto}>
                Página {posicionFirma.pagina} • X: {Math.round(posicionFirma.x)} pt • Y: {Math.round(posicionFirma.y)} pt
              </Text>
            </View>
            <TouchableOpacity
              style={estilos.btnConfirmarModal}
              onPress={() => setModalVisorVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={estilos.textoBtnConfirmarModal}>✓ Guardar y Fijar Ubicación</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    padding: 18,
  },
  bannerGuia: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 16,
  },
  tituloGuia: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textoGuia: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  cardPaso: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  headerPaso: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeNumero: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textoNumero: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tituloPaso: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
  },
  iconoPicker: {
    fontSize: 24,
    marginRight: 12,
  },
  infoPicker: {
    flex: 1,
  },
  textoPickerPrincipal: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  textoPickerSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  checkVerde: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  campoClave: {
    marginTop: 14,
  },
  etiquetaClave: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputClave: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  btnFirmar: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  textoBtnFirmar: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  cajaResumenPosicion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 12,
  },
  iconoPosicion: {
    marginRight: 10,
  },
  textoPosicionTitulo: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  textoPosicionCoords: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  badgeFijado: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  textoBadgeFijado: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  btnAbrirViñeta: {
    backgroundColor: '#0369A1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  textoBtnAbrirViñeta: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  textoGuiaViñeta: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  modalContenedor: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0F172A',
  },
  modalTitulo: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubtitulo: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  btnCerrarModal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  textoBtnCerrarModal: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCuerpo: {
    flex: 1,
    padding: 10,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalInfoCoords: {
    marginBottom: 8,
    alignItems: 'center',
  },
  modalCoordsTexto: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  btnConfirmarModal: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoBtnConfirmarModal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

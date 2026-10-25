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
import ScreenContainer from '../../components/ScreenContainer';
import PdfRealDocumentViewer from '../../components/PdfRealDocumentViewer';
import { procesarOperacionNativa } from '../../utils/apiUploader';

export default function AddNoteScreen({ onVolver }) {
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [textoNota, setTextoNota] = useState('');
  const [posicionNota, setPosicionNota] = useState({ x: 100, y: 100, pagina: 1 });
  const [procesando, setProcesando] = useState(false);
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
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  const ejecutarAgregarNota = async () => {
    if (!archivoPdf) {
      Alert.alert('Documento requerido', 'Selecciona el PDF donde deseas agregar la nota.');
      return;
    }
    if (!textoNota.trim()) {
      Alert.alert('Texto requerido', 'Escribe el contenido de la nota adhesiva.');
      return;
    }

    try {
      setProcesando(true);

      const nombreBase = archivoPdf.name.replace(/\.pdf$/i, '');
      const nombreSalida = `${nombreBase}_addnote.pdf`;

      await procesarOperacionNativa({
        endpoint: '/pdf/agregar-nota',
        archivoUri: archivoPdf.uri,
        campoNombre: 'pdf',
        parametros: {
          nota: textoNota,
          posicion: JSON.stringify(posicionNota)
        },
        nombreArchivoSalida: nombreSalida,
        compartirInmediato: true
      });

    } catch (err) {
      Alert.alert('Error al agregar nota', err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Notas en PDF"
      subtitulo="Añade notas adhesivas sobre el documento real"
      iconoTitulo="📝"
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <Text style={estilos.tituloGuia}>📌 Previsualizador Real</Text>
          <Text style={estilos.textoGuia}>
            Escribe el texto de tu nota y arrastra el recuadro sobre la página para colocarla exactamente donde desees.
          </Text>
        </View>

        {/* Paso 1: Documento */}
        <View style={estilos.cardPaso}>
          <View style={estilos.headerPaso}>
            <View style={estilos.badgeNumero}><Text style={estilos.textoNumero}>1</Text></View>
            <Text style={estilos.tituloPaso}>Documento PDF</Text>
          </View>

          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarPdf} activeOpacity={0.7}>
            <Text style={estilos.iconoPicker}>{archivoPdf ? '📄' : '📁'}</Text>
            <View style={estilos.infoPicker}>
              <Text style={estilos.textoPickerPrincipal}>
                {archivoPdf ? archivoPdf.name : 'Seleccionar Documento PDF'}
              </Text>
              <Text style={estilos.textoPickerSub}>
                {archivoPdf ? 'Archivo cargado con éxito' : 'Toca para examinar archivos'}
              </Text>
            </View>
            {archivoPdf && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Paso 2: Redacción */}
        <View style={estilos.cardPaso}>
          <View style={estilos.headerPaso}>
            <View style={estilos.badgeNumero}><Text style={estilos.textoNumero}>2</Text></View>
            <Text style={estilos.tituloPaso}>Contenido de la Nota</Text>
          </View>

          <TextInput
            style={estilos.inputArea}
            placeholder="Escribe aquí tu comentario, revisión o instrucción..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={3}
            value={textoNota}
            onChangeText={setTextoNota}
          />
        </View>

        {/* Paso 3: Ubicación con Viñeta Enfocada */}
        {archivoPdf && (
          <View style={estilos.cardPaso}>
            <View style={estilos.headerPaso}>
              <View style={estilos.badgeNumero}><Text style={estilos.textoNumero}>3</Text></View>
              <Text style={estilos.tituloPaso}>Ubicación de la Nota</Text>
            </View>

            <View style={estilos.cajaResumenPosicion}>
              <View style={estilos.iconoPosicion}><Text style={{ fontSize: 24 }}>📌</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.textoPosicionTitulo}>Página {posicionNota.pagina}</Text>
                <Text style={estilos.textoPosicionCoords}>
                  Coordenadas: X={Math.round(posicionNota.x)} pt • Y={Math.round(posicionNota.y)} pt
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
              Abre el documento en una viñeta enfocada para arrastrar o pulsar la nota sin que la pantalla del celular se mueva.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[estilos.btnAccion, (procesando || !archivoPdf || !textoNota) && { opacity: 0.5 }]}
          onPress={ejecutarAgregarNota}
          disabled={procesando || !archivoPdf || !textoNota}
          activeOpacity={0.8}
        >
          {procesando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={estilos.textoBtnAccion}>
              Insertar Nota y Compartir (_addnote.pdf)
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Viñeta Enfocada a Pantalla Completa para Ubicar Nota */}
      <Modal
        visible={modalVisorVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisorVisible(false)}
      >
        <SafeAreaView style={estilos.modalContenedor}>
          <View style={estilos.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.modalTitulo}>📌 Ubicar Nota en Documento</Text>
              <Text style={estilos.modalSubtitulo}>
                Arrastra la nota amarilla o pulsa sobre la hoja donde deseas insertarla
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
                alCambiarPosicion={setPosicionNota}
                etiqueta="Nota Adhesiva"
                pantallaCompleta={true}
              />
            )}
          </View>

          <View style={estilos.modalFooter}>
            <View style={estilos.modalInfoCoords}>
              <Text style={estilos.modalCoordsTexto}>
                Página {posicionNota.pagina} • X: {Math.round(posicionNota.x)} pt • Y: {Math.round(posicionNota.y)} pt
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
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 16,
  },
  tituloGuia: {
    color: '#FBBF24',
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
    backgroundColor: '#D97706',
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
    borderColor: 'rgba(245, 158, 11, 0.3)',
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
  },
  inputArea: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 14,
    minHeight: 85,
    textAlignVertical: 'top',
  },
  btnAccion: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  textoBtnAccion: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cajaResumenPosicion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
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
    backgroundColor: '#B45309',
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
    color: '#FBBF24',
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

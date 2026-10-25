import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  SafeAreaView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import PdfRealDocumentViewer from '../../components/PdfRealDocumentViewer';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { theme } from '../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

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
      iconoTitulo={<Feather name="edit-3" size={17} color={theme.colors.foreground} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="accent">VISOR INTERACTIVO</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Anotaciones Visuales</Text>
          <Text style={estilos.textoGuia}>
            Escribe el texto de tu comentario y arrastra el recuadro sobre la hoja para ubicarlo con total precisión.
          </Text>
        </View>

        {/* Paso 1: Documento */}
        <Card style={estilos.cardPaso}>
          <CardHeader style={estilos.headerPaso}>
            <View style={estilos.badgePaso}>
              <Text style={estilos.textoNumeroPaso}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <CardTitle style={estilos.tituloPaso}>Documento PDF</CardTitle>
              <CardDescription>Archivo a intervenir</CardDescription>
            </View>
          </CardHeader>

          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={seleccionarPdf} activeOpacity={0.7}>
              <View style={estilos.iconoDropzone}>
                <Feather
                  name={archivoPdf ? "file-text" : "upload-cloud"}
                  size={20}
                  color={archivoPdf ? theme.colors.foreground : theme.colors.mutedForeground}
                />
              </View>
              <View style={estilos.infoDropzone}>
                <Text style={estilos.textoPrincipalDropzone} numberOfLines={1}>
                  {archivoPdf ? archivoPdf.name : 'Seleccionar Documento PDF'}
                </Text>
                <Text style={estilos.textoSecundarioDropzone}>
                  {archivoPdf ? 'Archivo cargado con éxito' : 'Toca para examinar tus archivos'}
                </Text>
              </View>
              {archivoPdf && <Badge variant="success">Listo</Badge>}
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Paso 2: Redacción */}
        <Card style={estilos.cardPaso}>
          <CardHeader style={estilos.headerPaso}>
            <View style={estilos.badgePaso}>
              <Text style={estilos.textoNumeroPaso}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <CardTitle style={estilos.tituloPaso}>Contenido de la Nota</CardTitle>
              <CardDescription>Comentario, revisión o instrucción</CardDescription>
            </View>
          </CardHeader>

          <CardContent>
            <TextInput
              style={estilos.inputArea}
              placeholder="Escribe aquí tu comentario o instrucción..."
              placeholderTextColor={theme.colors.mutedForeground}
              multiline
              numberOfLines={3}
              value={textoNota}
              onChangeText={setTextoNota}
            />
          </CardContent>
        </Card>

        {/* Paso 3: Ubicación */}
        {archivoPdf && (
          <Card style={estilos.cardPaso}>
            <CardHeader style={estilos.headerPaso}>
              <View style={estilos.badgePaso}>
                <Text style={estilos.textoNumeroPaso}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <CardTitle style={estilos.tituloPaso}>Ubicación de la Nota</CardTitle>
                <CardDescription>Posición en la hoja del PDF</CardDescription>
              </View>
            </CardHeader>

            <CardContent>
              <View style={estilos.cajaResumenPosicion}>
                <Feather name="map-pin" size={18} color={theme.colors.foreground} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.textoPosicionTitulo}>Página {posicionNota.pagina}</Text>
                  <Text style={estilos.textoPosicionCoords}>
                    X: {Math.round(posicionNota.x)} pt • Y: {Math.round(posicionNota.y)} pt
                  </Text>
                </View>
                <Badge variant="secondary">Fijada</Badge>
              </View>

              <Button
                variant="outline"
                onPress={() => setModalVisorVisible(true)}
                icon={<Feather name="maximize-2" size={14} color={theme.colors.foreground} />}
                style={estilos.btnAbrirViñeta}
              >
                Abrir Viñeta de Ubicación
              </Button>

              <Text style={estilos.textoGuiaViñeta}>
                Permite arrastrar la nota sobre el visor en pantalla completa sin desplazamiento no deseado.
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Botón Acción */}
        <Button
          variant="default"
          size="lg"
          onPress={ejecutarAgregarNota}
          disabled={procesando || !archivoPdf || !textoNota}
          cargando={procesando}
          icon={!procesando && <Feather name="check-circle" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnAccion}
        >
          Insertar Nota y Compartir
        </Button>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal Visor Pantalla Completa */}
      <Modal
        visible={modalVisorVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisorVisible(false)}
      >
        <SafeAreaView style={estilos.modalContenedor}>
          <View style={estilos.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.modalTitulo}>Ubicar Nota en Documento</Text>
              <Text style={estilos.modalSubtitulo}>
                Arrastra el recuadro hasta el área requerida
              </Text>
            </View>
            <TouchableOpacity
              style={estilos.btnCerrarModal}
              onPress={() => setModalVisorVisible(false)}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color={theme.colors.foreground} />
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
            <Button
              variant="default"
              size="lg"
              onPress={() => setModalVisorVisible(false)}
              icon={<Feather name="check" size={16} color={theme.colors.primaryForeground} />}
            >
              Fijar Ubicación
            </Button>
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
    padding: 16,
  },
  bannerGuia: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  bannerHeader: {
    marginBottom: 8,
  },
  tituloGuia: {
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  textoGuia: {
    color: theme.colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  cardPaso: {
    marginBottom: 16,
  },
  headerPaso: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgePaso: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textoNumeroPaso: {
    color: theme.colors.foreground,
    fontSize: 12,
    fontWeight: '700',
  },
  tituloPaso: {
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
  },
  iconoDropzone: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoDropzone: {
    flex: 1,
    marginRight: 8,
  },
  textoPrincipalDropzone: {
    color: theme.colors.foreground,
    fontSize: 14,
    fontWeight: '500',
  },
  textoSecundarioDropzone: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  inputArea: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.foreground,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cajaResumenPosicion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  textoPosicionTitulo: {
    color: theme.colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  textoPosicionCoords: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  btnAbrirViñeta: {
    width: '100%',
    marginBottom: 8,
  },
  textoGuiaViñeta: {
    color: theme.colors.mutedForeground,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  btnAccion: {
    width: '100%',
    marginTop: 8,
  },
  modalContenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  modalTitulo: {
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  modalSubtitulo: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  btnCerrarModal: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  modalCuerpo: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalInfoCoords: {
    marginBottom: 10,
    alignItems: 'center',
  },
  modalCoordsTexto: {
    color: theme.colors.ring,
    fontSize: 12,
    fontWeight: '600',
  },
});

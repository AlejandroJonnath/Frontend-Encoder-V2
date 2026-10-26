import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ScreenContainer';
import PdfRealDocumentViewer from '../components/PdfRealDocumentViewer';
import { useAddNote } from '../hooks/useAddNote';
import { theme } from '../../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingOverlay } from '../../../components/ui/LoadingOverlay';

export default function AddNoteScreen({ onVolver }) {
  const {
    archivoPdf,
    textoNota,
    setTextoNota,
    posicionNota,
    setPosicionNota,
    procesando,
    modalVisorVisible,
    setModalVisorVisible,
    seleccionarPdf,
    ejecutarAgregarNota
  } = useAddNote();

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

      <LoadingOverlay visible={procesando} mensaje="Incrustando nota vectorial en el PDF..." />
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    padding: theme.spacing.lg,
  },
  bannerGuia: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  bannerHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  tituloGuia: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  textoGuia: {
    ...theme.typography.small,
  },
  cardPaso: {
    marginBottom: theme.spacing.lg,
  },
  headerPaso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  badgePaso: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoNumeroPaso: {
    ...theme.typography.small,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  tituloPaso: {
    ...theme.typography.h3,
    fontSize: 15,
  },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconoDropzone: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoDropzone: {
    flex: 1,
  },
  textoPrincipalDropzone: {
    ...theme.typography.bodyStrong,
  },
  textoSecundarioDropzone: {
    ...theme.typography.small,
    marginTop: 2,
  },
  inputArea: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    ...theme.typography.body,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  cajaResumenPosicion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  textoPosicionTitulo: {
    ...theme.typography.bodyStrong,
  },
  textoPosicionCoords: {
    ...theme.typography.small,
    marginTop: 2,
  },
  btnAbrirViñeta: {
    marginBottom: theme.spacing.sm,
  },
  textoGuiaViñeta: {
    ...theme.typography.small,
    fontSize: 11,
    color: theme.colors.mutedForeground,
  },
  btnAccion: {
    marginTop: theme.spacing.xs,
  },
  modalContenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitulo: {
    ...theme.typography.h2,
  },
  modalSubtitulo: {
    ...theme.typography.small,
    marginTop: 2,
  },
  btnCerrarModal: {
    padding: theme.spacing.sm,
  },
  modalCuerpo: {
    flex: 1,
  },
  modalFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  modalInfoCoords: {
    alignItems: 'center',
  },
  modalCoordsTexto: {
    ...theme.typography.small,
    fontWeight: '600',
  },
});

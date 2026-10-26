import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ScreenContainer';
import PdfRealDocumentViewer from '../../pdf/components/PdfRealDocumentViewer';
import { useSignPdf } from '../hooks/useSignPdf';
import { formatearBytes } from '../../../utils/fileFormatters';
import { theme } from '../../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingOverlay } from '../../../components/ui/LoadingOverlay';

export default function SignPdfScreen({ onVolver }) {
  const {
    archivoPdf,
    archivoP12,
    contrasenaP12,
    setContrasenaP12,
    posicionFirma,
    setPosicionFirma,
    firmando,
    modalVisorVisible,
    setModalVisorVisible,
    seleccionarPdf,
    seleccionarP12,
    ejecutarFirma
  } = useSignPdf();

  return (
    <ScreenContainer
      titulo="Firma Electrónica"
      subtitulo="PAdES Estándar Ecuador • Certificado .p12"
      iconoTitulo={<Feather name="shield" size={17} color={theme.colors.foreground} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Informativo */}
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="accent">PREVISUALIZADOR REAL</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Estándar FirmaEC PAdES</Text>
          <Text style={estilos.textoGuia}>
            Carga tu documento y posiciona con precisión milimétrica la estampa digital directamente sobre el visor de la hoja.
          </Text>
        </View>

        {/* Paso 1: PDF */}
        <Card style={estilos.cardPaso}>
          <CardHeader style={estilos.headerPaso}>
            <View style={estilos.badgePaso}>
              <Text style={estilos.textoNumeroPaso}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <CardTitle style={estilos.tituloPaso}>Documento PDF</CardTitle>
              <CardDescription>Archivo a certificar criptográficamente</CardDescription>
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
                  {archivoPdf ? `${formatearBytes(archivoPdf.size)} cargado` : 'Toca para examinar tu dispositivo'}
                </Text>
              </View>
              {archivoPdf && (
                <Badge variant="success">Listo</Badge>
              )}
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Paso 2: Posicionamiento */}
        {archivoPdf && (
          <Card style={estilos.cardPaso}>
            <CardHeader style={estilos.headerPaso}>
              <View style={estilos.badgePaso}>
                <Text style={estilos.textoNumeroPaso}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <CardTitle style={estilos.tituloPaso}>Posición de la Firma</CardTitle>
                <CardDescription>Ubicación exacta sobre el documento</CardDescription>
              </View>
            </CardHeader>

            <CardContent>
              <View style={estilos.cajaResumenPosicion}>
                <Feather name="map-pin" size={18} color={theme.colors.foreground} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.textoPosicionTitulo}>Página {posicionFirma.pagina}</Text>
                  <Text style={estilos.textoPosicionCoords}>
                    X: {Math.round(posicionFirma.x)} pt • Y: {Math.round(posicionFirma.y)} pt
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
                Permite arrastrar la estampa de firma en pantalla completa con bloqueo de scroll.
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Paso 3: Certificado .p12 y contraseña */}
        <Card style={estilos.cardPaso}>
          <CardHeader style={estilos.headerPaso}>
            <View style={estilos.badgePaso}>
              <Text style={estilos.textoNumeroPaso}>{archivoPdf ? '3' : '2'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <CardTitle style={estilos.tituloPaso}>Certificado Digital (.p12 / .pfx)</CardTitle>
              <CardDescription>Entidades autorizadas (BCE, Security Data, etc.)</CardDescription>
            </View>
          </CardHeader>

          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={seleccionarP12} activeOpacity={0.7}>
              <View style={estilos.iconoDropzone}>
                <Feather
                  name={archivoP12 ? "key" : "lock"}
                  size={20}
                  color={archivoP12 ? theme.colors.foreground : theme.colors.mutedForeground}
                />
              </View>
              <View style={estilos.infoDropzone}>
                <Text style={estilos.textoPrincipalDropzone} numberOfLines={1}>
                  {archivoP12 ? archivoP12.name : 'Seleccionar Archivo .p12 o .pfx'}
                </Text>
                <Text style={estilos.textoSecundarioDropzone}>
                  {archivoP12 ? 'Certificado cargado' : 'Contenedor criptográfico de firma'}
                </Text>
              </View>
              {archivoP12 && (
                <Badge variant="success">Listo</Badge>
              )}
            </TouchableOpacity>

            <View style={{ marginTop: 14 }}>
              <Input
                label="Contraseña del Certificado"
                placeholder="Ingresa la contraseña privada"
                secureTextEntry
                value={contrasenaP12}
                onChangeText={setContrasenaP12}
              />
            </View>
          </CardContent>
        </Card>

        {/* Botón de Acción Principal */}
        <Button
          variant="default"
          size="lg"
          onPress={ejecutarFirma}
          disabled={firmando || !archivoPdf || !archivoP12 || !contrasenaP12}
          cargando={firmando}
          icon={!firmando && <Feather name="check-circle" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnAccion}
        >
          Firmar y Compartir Documento
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
              <Text style={estilos.modalTitulo}>Ubicar Estampa de Firma</Text>
              <Text style={estilos.modalSubtitulo}>
                Arrastra el recuadro hasta la posición requerida en la hoja
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
                alCambiarPosicion={setPosicionFirma}
                etiqueta="Firma Electrónica"
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

      <LoadingOverlay visible={firmando} mensaje="Validando certificado y estampando firma digital..." />
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

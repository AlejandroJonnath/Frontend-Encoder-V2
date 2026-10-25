import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import { Input } from '../../components/ui/Input';

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
                  {archivoPdf ? `${(archivoPdf.size / (1024 * 1024)).toFixed(2)} MB cargado` : 'Toca para examinar tu dispositivo'}
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

        {/* Botón Principal */}
        <Button
          variant="default"
          size="lg"
          onPress={ejecutarFirma}
          disabled={firmando || !archivoPdf || !archivoP12}
          cargando={firmando}
          icon={!firmando && <Feather name="check-circle" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnFirmar}
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
              <Text style={estilos.modalTitulo}>Ubicar Firma en Documento</Text>
              <Text style={estilos.modalSubtitulo}>
                Arrastra la estampa azul hasta la posición deseada
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
    padding: 16,
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
  btnFirmar: {
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

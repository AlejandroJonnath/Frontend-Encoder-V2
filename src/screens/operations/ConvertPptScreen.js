import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { theme } from '../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function ConvertPptScreen({ onVolver }) {
  const [archivoPpt, setArchivoPpt] = useState(null);
  const [convirtiendo, setConvirtiendo] = useState(false);

  const seleccionarPpt = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint'
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const doc = res.assets[0];
        const nombreMin = doc.name.toLowerCase();
        if (!nombreMin.endsWith('.pptx') && !nombreMin.endsWith('.ppt')) {
          Alert.alert('Archivo no válido', 'Solo se permiten presentaciones de PowerPoint (.pptx o .ppt).');
          return;
        }
        setArchivoPpt(doc);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar la presentación PowerPoint.');
    }
  };

  const ejecutarConversion = async () => {
    if (!archivoPpt) {
      Alert.alert('Selecciona un archivo', 'Elige una presentación PowerPoint (.pptx o .ppt) para convertir.');
      return;
    }

    try {
      setConvirtiendo(true);

      const nombreBase = archivoPpt.name.replace(/\.(pptx|ppt)$/i, '');
      const nombreSalida = `${nombreBase}_converted.pdf`;

      await procesarOperacionNativa({
        endpoint: '/convertir/powerpoint',
        archivoUri: archivoPpt.uri,
        campoNombre: 'archivo',
        nombreArchivoSalida: nombreSalida,
        compartirInmediato: true
      });

    } catch (err) {
      Alert.alert('Error en Conversión', err.message || 'No se pudo convertir la presentación PowerPoint a PDF.');
    } finally {
      setConvirtiendo(false);
    }
  };

  return (
    <ScreenContainer
      titulo="PowerPoint a PDF"
      subtitulo="Conversión de presentaciones .pptx y .ppt"
      iconoTitulo={<Feather name="monitor" size={17} color={theme.colors.foreground} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="secondary">FILTRO EXCLUSIVO PPT</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Paginación por Diapositiva</Text>
          <Text style={estilos.textoGuia}>
            Cada diapositiva se convertirá exactamente en una página de alta definición dentro del documento PDF resultante.
          </Text>
        </View>

        <Card style={estilos.card}>
          <CardHeader>
            <CardTitle>Presentación PowerPoint</CardTitle>
            <CardDescription>Formatos compatibles: .pptx y .ppt</CardDescription>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={seleccionarPpt} activeOpacity={0.7}>
              <View style={estilos.iconoDropzone}>
                <Feather
                  name={archivoPpt ? "monitor" : "upload-cloud"}
                  size={20}
                  color={archivoPpt ? theme.colors.foreground : theme.colors.mutedForeground}
                />
              </View>
              <View style={estilos.infoDropzone}>
                <Text style={estilos.textoPrincipalDropzone} numberOfLines={1}>
                  {archivoPpt ? archivoPpt.name : 'Seleccionar Presentación PPT'}
                </Text>
                <Text style={estilos.textoSecundarioDropzone}>
                  {archivoPpt
                    ? `${(archivoPpt.size / (1024 * 1024)).toFixed(2)} MB • Listo para procesar`
                    : 'Toca para examinar tu almacenamiento'}
                </Text>
              </View>
              {archivoPpt && <Badge variant="success">Listo</Badge>}
            </TouchableOpacity>
          </CardContent>
        </Card>

        <Button
          variant="default"
          size="lg"
          onPress={ejecutarConversion}
          disabled={convirtiendo || !archivoPpt}
          cargando={convirtiendo}
          icon={!convirtiendo && <Feather name="arrow-right-circle" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnConvertir}
        >
          Convertir PowerPoint a PDF
        </Button>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  card: {
    marginBottom: 16,
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
  btnConvertir: {
    width: '100%',
  },
});

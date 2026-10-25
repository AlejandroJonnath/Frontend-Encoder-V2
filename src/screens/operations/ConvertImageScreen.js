import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { theme } from '../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function ConvertImageScreen({ onVolver }) {
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [convirtiendo, setConvirtiendo] = useState(false);

  const seleccionarImagen = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const doc = res.assets[0];
        const nombreMin = doc.name.toLowerCase();
        if (!nombreMin.endsWith('.png') && !nombreMin.endsWith('.jpg') && !nombreMin.endsWith('.jpeg')) {
          Alert.alert('Archivo no válido', 'Solo se permiten imágenes en formato PNG, JPG o JPEG.');
          return;
        }
        setArchivoImagen(doc);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const ejecutarConversion = async () => {
    if (!archivoImagen) {
      Alert.alert('Selecciona una imagen', 'Elige un archivo PNG, JPG o JPEG para convertir.');
      return;
    }

    try {
      setConvirtiendo(true);

      const nombreBase = archivoImagen.name.replace(/\.(png|jpg|jpeg)$/i, '');
      const nombreSalida = `${nombreBase}_converted.pdf`;

      await procesarOperacionNativa({
        endpoint: '/convertir/imagen',
        archivoUri: archivoImagen.uri,
        campoNombre: 'archivo',
        nombreArchivoSalida: nombreSalida,
        compartirInmediato: true
      });

    } catch (err) {
      Alert.alert('Error en Conversión', err.message || 'No se pudo convertir la imagen a PDF.');
    } finally {
      setConvirtiendo(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Imágenes a PDF"
      subtitulo="Conversión de fotos PNG, JPG y JPEG"
      iconoTitulo={<Feather name="image" size={17} color={theme.colors.foreground} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="secondary">FILTRO EXCLUSIVO IMÁGENES</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Alta Resolución y Proporción Nativa</Text>
          <Text style={estilos.textoGuia}>
            La imagen se adaptará respetando su relación de aspecto original para ajustarse a una página PDF centrada sin distorsión.
          </Text>
        </View>

        <Card style={estilos.card}>
          <CardHeader>
            <CardTitle>Archivo de Imagen</CardTitle>
            <CardDescription>Formatos compatibles: PNG, JPG, JPEG</CardDescription>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={seleccionarImagen} activeOpacity={0.7}>
              <View style={estilos.iconoDropzone}>
                <Feather
                  name={archivoImagen ? "image" : "upload-cloud"}
                  size={20}
                  color={archivoImagen ? theme.colors.foreground : theme.colors.mutedForeground}
                />
              </View>
              <View style={estilos.infoDropzone}>
                <Text style={estilos.textoPrincipalDropzone} numberOfLines={1}>
                  {archivoImagen ? archivoImagen.name : 'Seleccionar Imagen'}
                </Text>
                <Text style={estilos.textoSecundarioDropzone}>
                  {archivoImagen
                    ? `${(archivoImagen.size / (1024 * 1024)).toFixed(2)} MB • Listo para procesar`
                    : 'Toca para examinar tu galería o archivos'}
                </Text>
              </View>
              {archivoImagen && <Badge variant="success">Listo</Badge>}
            </TouchableOpacity>

            {archivoImagen && (
              <View style={estilos.contenedorPreview}>
                <Image
                  source={{ uri: archivoImagen.uri }}
                  style={estilos.imagenPreview}
                  resizeMode="contain"
                />
              </View>
            )}
          </CardContent>
        </Card>

        <Button
          variant="default"
          size="lg"
          onPress={ejecutarConversion}
          disabled={convirtiendo || !archivoImagen}
          cargando={convirtiendo}
          icon={!convirtiendo && <Feather name="arrow-right-circle" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnConvertir}
        >
          Convertir Imagen a PDF
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
  contenedorPreview: {
    marginTop: 14,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imagenPreview: {
    width: '100%',
    height: '100%',
  },
  btnConvertir: {
    width: '100%',
  },
});

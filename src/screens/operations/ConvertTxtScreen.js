import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { theme } from '../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAlerta } from '../../context/AlertContext';

const TXT_COLOR = '#CBD5E1';

export default function ConvertTxtScreen({ onVolver }) {
  const { mostrarErrorFormatoInvalido, mostrarErrorFaltaArchivo, mostrarErrorOperacion } = useAlerta();
  const [archivoTxt, setArchivoTxt] = useState(null);
  const [convirtiendo, setConvirtiendo] = useState(false);

  const seleccionarTxt = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const doc = res.assets[0];
        const nombreMin = doc.name.toLowerCase();
        if (!nombreMin.endsWith('.txt')) {
          mostrarErrorFormatoInvalido('.txt');
          return;
        }
        setArchivoTxt(doc);
      }
    } catch (err) {
      mostrarErrorOperacion('Error de acceso', 'No se pudo seleccionar el archivo de texto.');
    }
  };

  const ejecutarConversion = async () => {
    if (!archivoTxt) {
      mostrarErrorFaltaArchivo('TXT');
      return;
    }

    try {
      setConvirtiendo(true);

      const nombreBase = archivoTxt.name.replace(/\.txt$/i, '');
      const nombreSalida = `${nombreBase}_converted.pdf`;

      await procesarOperacionNativa({
        endpoint: '/convertir/txt',
        archivoUri: archivoTxt.uri,
        campoNombre: 'archivo',
        nombreArchivoSalida: nombreSalida,
        compartirInmediato: true
      });

    } catch (err) {
      mostrarErrorOperacion('Error en Conversión', err.message || 'No se pudo convertir el archivo .txt a PDF.');
    } finally {
      setConvirtiendo(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Bloc de notas a PDF"
      subtitulo="Conversión limpia de archivos de texto (.txt)"
      iconoTitulo={<MaterialCommunityIcons name="file-document-outline" size={19} color={TXT_COLOR} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="secondary">FILTRO EXCLUSIVO TXT</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Tipografía Uniforme y Paginación</Text>
          <Text style={estilos.textoGuia}>
            El contenido se formateará automáticamente con tipografía clara y legible, paginación automática y márgenes estándar.
          </Text>
        </View>

        <Card style={estilos.card}>
          <CardHeader>
            <CardTitle>Archivo de Texto Plano</CardTitle>
            <CardDescription>Formatos compatibles: .txt</CardDescription>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={seleccionarTxt} activeOpacity={0.7}>
              <View style={[estilos.iconoDropzone, archivoTxt && { backgroundColor: 'rgba(203,213,225,0.1)', borderColor: 'rgba(203,213,225,0.25)' }]}>
                {archivoTxt
                  ? <MaterialCommunityIcons name="file-document-outline" size={22} color={TXT_COLOR} />
                  : <Feather name="upload-cloud" size={20} color={theme.colors.mutedForeground} />}
              </View>
              <View style={estilos.infoDropzone}>
                <Text style={estilos.textoPrincipalDropzone} numberOfLines={1}>
                  {archivoTxt ? archivoTxt.name : 'Seleccionar Archivo .txt'}
                </Text>
                <Text style={estilos.textoSecundarioDropzone}>
                  {archivoTxt
                    ? `${(archivoTxt.size / 1024).toFixed(2)} KB • Listo para procesar`
                    : 'Toca para examinar tu almacenamiento'}
                </Text>
              </View>
              {archivoTxt && <Badge variant="success">Listo</Badge>}
            </TouchableOpacity>
          </CardContent>
        </Card>

        <Button
          variant="default"
          size="lg"
          onPress={ejecutarConversion}
          disabled={convirtiendo || !archivoTxt}
          cargando={convirtiendo}
          icon={!convirtiendo && <Feather name="arrow-right-circle" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnConvertir}
        >
          Convertir TXT a PDF
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

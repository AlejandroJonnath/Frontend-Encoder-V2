import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../../utils/apiUploader';
import { useAlerta } from '../../../context/AlertContext';
import { theme } from '../../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export default function ConvertWordScreen({ onVolver }) {
  const [archivoWord, setArchivoWord] = useState(null);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const { mostrarErrorFormatoInvalido, mostrarErrorFaltaArchivo, mostrarErrorOperacion } = useAlerta();

  const seleccionarWord = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword'
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const doc = res.assets[0];
        const nombreMin = doc.name.toLowerCase();
        if (!nombreMin.endsWith('.docx') && !nombreMin.endsWith('.doc')) {
          mostrarErrorFormatoInvalido('.docx o .doc de Microsoft Word');
          return;
        }
        setArchivoWord(doc);
      }
    } catch (err) {
      mostrarErrorOperacion('Error al seleccionar archivo', 'No se pudo cargar el documento de Word.');
    }
  };

  const ejecutarConversion = async () => {
    if (!archivoWord) {
      mostrarErrorFaltaArchivo('Word (.docx o .doc)');
      return;
    }

    try {
      setConvirtiendo(true);

      const nombreBase = archivoWord.name.replace(/\.(docx|doc)$/i, '');
      const nombreSalida = `${nombreBase}_converted.pdf`;

      await procesarOperacionNativa({
        endpoint: '/convertir/word',
        archivoUri: archivoWord.uri,
        campoNombre: 'archivo',
        nombreArchivoSalida: nombreSalida,
        compartirInmediato: true
      });

    } catch (err) {
      mostrarErrorOperacion('Error en Conversión', err.message || 'No se pudo convertir el archivo Word a PDF.');
    } finally {
      setConvirtiendo(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Word a PDF"
      subtitulo="Conversión de documentos .docx y .doc"
      iconoTitulo={<MaterialCommunityIcons name="microsoft-word" size={19} color="#60A5FA" />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="secondary">FILTRO EXCLUSIVO WORD</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Preservación Tipográfica y Estilos</Text>
          <Text style={estilos.textoGuia}>
            Conserva fuentes, márgenes, tablas e imágenes exactamente como fueron estructuradas en Microsoft Word.
          </Text>
        </View>

        <Card style={estilos.card}>
          <CardHeader>
            <CardTitle>Documento de Word</CardTitle>
            <CardDescription>Formatos compatibles: .docx y .doc</CardDescription>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={seleccionarWord} activeOpacity={0.7}>
              <View style={[estilos.iconoDropzone, archivoWord && estilos.iconoDropzoneActivo]}>
                <MaterialCommunityIcons
                  name="microsoft-word"
                  size={24}
                  color={archivoWord ? '#60A5FA' : theme.colors.mutedForeground}
                />
              </View>
              <View style={estilos.infoDropzone}>
                <Text style={estilos.textoPrincipalDropzone} numberOfLines={1}>
                  {archivoWord ? archivoWord.name : 'Seleccionar Documento Word'}
                </Text>
                <Text style={estilos.textoSecundarioDropzone}>
                  {archivoWord
                    ? `${(archivoWord.size / (1024 * 1024)).toFixed(2)} MB • Listo para procesar`
                    : 'Toca para examinar tu almacenamiento'}
                </Text>
              </View>
              {archivoWord && <Badge variant="success">Listo</Badge>}
            </TouchableOpacity>
          </CardContent>
        </Card>

        <Button
          variant="default"
          size="lg"
          onPress={ejecutarConversion}
          disabled={convirtiendo || !archivoWord}
          cargando={convirtiendo}
          icon={!convirtiendo && <Feather name="arrow-right-circle" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnConvertir}
        >
          Convertir Word a PDF
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
    width: 42,
    height: 42,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconoDropzoneActivo: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
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

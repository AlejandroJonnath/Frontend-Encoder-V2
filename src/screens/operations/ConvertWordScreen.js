import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import ScreenContainer from '../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../utils/apiUploader';

export default function ConvertWordScreen({ onVolver }) {
  const [archivoWord, setArchivoWord] = useState(null);
  const [convirtiendo, setConvirtiendo] = useState(false);

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
          Alert.alert('Archivo no válido', 'Solo se permiten documentos de Word (.docx o .doc).');
          return;
        }
        setArchivoWord(doc);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el documento de Word.');
    }
  };

  const ejecutarConversion = async () => {
    if (!archivoWord) {
      Alert.alert('Selecciona un archivo', 'Elige un documento Word (.docx o .doc) para convertir.');
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
      Alert.alert('Error en Conversión', err.message || 'No se pudo convertir el archivo Word a PDF.');
    } finally {
      setConvirtiendo(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Word a PDF"
      subtitulo="Conversión exclusiva de archivos .docx y .doc"
      iconoTitulo="📘"
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Informativo */}
        <View style={estilos.bannerInfo}>
          <Text style={estilos.tituloBanner}>📄 Formatos admitidos: Word (.docx, .doc)</Text>
          <Text style={estilos.textoBanner}>
            El documento conservará sus fuentes, márgenes, tablas, imágenes y formateo original intactos al exportarse a PDF.
          </Text>
        </View>

        {/* Selector de Archivo */}
        <View style={estilos.card}>
          <Text style={estilos.tituloCard}>Selecciona tu Documento Word</Text>
          <Text style={estilos.subtituloCard}>Únicamente archivos de Microsoft Word</Text>

          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarWord} activeOpacity={0.7}>
            <View style={estilos.iconoCirculo}>
              <Text style={estilos.iconoDoc}>{archivoWord ? '📄' : '📁'}</Text>
            </View>
            <View style={estilos.infoDoc}>
              <Text style={estilos.nombreDoc} numberOfLines={1}>
                {archivoWord ? archivoWord.name : 'Toca para elegir documento Word'}
              </Text>
              <Text style={estilos.detalleDoc}>
                {archivoWord
                  ? `${(archivoWord.size / (1024 * 1024)).toFixed(2)} MB • Listo para procesar`
                  : 'Filtro exclusivo: .docx o .doc'}
              </Text>
            </View>
            {archivoWord && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Botón de Conversión */}
        <TouchableOpacity
          style={[estilos.btnConvertir, (convirtiendo || !archivoWord) && { opacity: 0.6 }]}
          onPress={ejecutarConversion}
          disabled={convirtiendo || !archivoWord}
          activeOpacity={0.8}
        >
          {convirtiendo ? (
            <View style={estilos.filaCargando}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={estilos.textoCargando}>Convirtiendo a PDF oficial...</Text>
            </View>
          ) : (
            <Text style={estilos.textoBtnConvertir}>Convertir Word a PDF</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
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
  bannerInfo: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    marginBottom: 18,
  },
  tituloBanner: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textoBanner: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  tituloCard: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtituloCard: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 14,
  },
  btnPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  iconoCirculo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconoDoc: {
    fontSize: 22,
  },
  infoDoc: {
    flex: 1,
  },
  nombreDoc: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  detalleDoc: {
    color: '#94A3B8',
    fontSize: 11,
  },
  checkVerde: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  btnConvertir: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  textoBtnConvertir: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  filaCargando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textoCargando: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

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
      subtitulo="Conversión exclusiva de presentaciones .pptx y .ppt"
      iconoTitulo="📊"
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Informativo */}
        <View style={estilos.bannerInfo}>
          <Text style={estilos.tituloBanner}>📙 Formatos admitidos: PowerPoint (.pptx, .ppt)</Text>
          <Text style={estilos.textoBanner}>
            Cada diapositiva se convertirá exactamente en una página de alta definición dentro del documento PDF resultante.
          </Text>
        </View>

        {/* Selector de Archivo */}
        <View style={estilos.card}>
          <Text style={estilos.tituloCard}>Selecciona tu Presentación PowerPoint</Text>
          <Text style={estilos.subtituloCard}>Únicamente archivos .pptx o .ppt</Text>

          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarPpt} activeOpacity={0.7}>
            <View style={estilos.iconoCirculo}>
              <Text style={estilos.iconoDoc}>{archivoPpt ? '📊' : '📁'}</Text>
            </View>
            <View style={estilos.infoDoc}>
              <Text style={estilos.nombreDoc} numberOfLines={1}>
                {archivoPpt ? archivoPpt.name : 'Toca para elegir presentación PPT'}
              </Text>
              <Text style={estilos.detalleDoc}>
                {archivoPpt
                  ? `${(archivoPpt.size / (1024 * 1024)).toFixed(2)} MB • Listo para procesar`
                  : 'Filtro exclusivo: .pptx o .ppt'}
              </Text>
            </View>
            {archivoPpt && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Botón de Conversión */}
        <TouchableOpacity
          style={[estilos.btnConvertir, (convirtiendo || !archivoPpt) && { opacity: 0.6 }]}
          onPress={ejecutarConversion}
          disabled={convirtiendo || !archivoPpt}
          activeOpacity={0.8}
        >
          {convirtiendo ? (
            <View style={estilos.filaCargando}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={estilos.textoCargando}>Convirtiendo diapositivas a PDF...</Text>
            </View>
          ) : (
            <Text style={estilos.textoBtnConvertir}>Convertir PowerPoint a PDF</Text>
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
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.3)',
    marginBottom: 18,
  },
  tituloBanner: {
    color: '#FB923C',
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
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
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
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#EA580C',
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

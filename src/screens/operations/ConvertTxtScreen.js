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

export default function ConvertTxtScreen({ onVolver }) {
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
          Alert.alert('Archivo no válido', 'Solo se permiten archivos de texto plano (.txt).');
          return;
        }
        setArchivoTxt(doc);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo de texto.');
    }
  };

  const ejecutarConversion = async () => {
    if (!archivoTxt) {
      Alert.alert('Selecciona un archivo', 'Elige un archivo de texto plano (.txt) para convertir.');
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
      Alert.alert('Error en Conversión', err.message || 'No se pudo convertir el archivo .txt a PDF.');
    } finally {
      setConvirtiendo(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Bloc de notas a PDF"
      subtitulo="Conversión limpia de archivos de texto plano (.txt)"
      iconoTitulo="📄"
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Informativo */}
        <View style={estilos.bannerInfo}>
          <Text style={estilos.tituloBanner}>📝 Formatos admitidos: Archivos de texto (.txt)</Text>
          <Text style={estilos.textoBanner}>
            El contenido se formateará automáticamente con tipografía clara y legible, paginación automática y márgenes estándar listos para imprimir o compartir.
          </Text>
        </View>

        {/* Selector de Archivo */}
        <View style={estilos.card}>
          <Text style={estilos.tituloCard}>Selecciona tu Archivo .txt</Text>
          <Text style={estilos.subtituloCard}>Únicamente archivos de texto plano</Text>

          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarTxt} activeOpacity={0.7}>
            <View style={estilos.iconoCirculo}>
              <Text style={estilos.iconoDoc}>{archivoTxt ? '📝' : '📁'}</Text>
            </View>
            <View style={estilos.infoDoc}>
              <Text style={estilos.nombreDoc} numberOfLines={1}>
                {archivoTxt ? archivoTxt.name : 'Toca para elegir archivo .txt'}
              </Text>
              <Text style={estilos.detalleDoc}>
                {archivoTxt
                  ? `${(archivoTxt.size / 1024).toFixed(2)} KB • Listo para procesar`
                  : 'Filtro exclusivo: .txt'}
              </Text>
            </View>
            {archivoTxt && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Botón de Conversión */}
        <TouchableOpacity
          style={[estilos.btnConvertir, (convirtiendo || !archivoTxt) && { opacity: 0.6 }]}
          onPress={ejecutarConversion}
          disabled={convirtiendo || !archivoTxt}
          activeOpacity={0.8}
        >
          {convirtiendo ? (
            <View style={estilos.filaCargando}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={estilos.textoCargando}>Formateando y convirtiendo a PDF...</Text>
            </View>
          ) : (
            <Text style={estilos.textoBtnConvertir}>Convertir TXT a PDF</Text>
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
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    marginBottom: 18,
  },
  tituloBanner: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textoBanner: {
    color: '#CBD5E1',
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
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
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
    backgroundColor: '#475569',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#475569',
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

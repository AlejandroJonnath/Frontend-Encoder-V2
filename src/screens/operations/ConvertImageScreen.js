import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import ScreenContainer from '../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../utils/apiUploader';

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
      subtitulo="Conversión exclusiva de fotos PNG, JPG y JPEG"
      iconoTitulo="🖼️"
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Informativo */}
        <View style={estilos.bannerInfo}>
          <Text style={estilos.tituloBanner}>📷 Formatos admitidos: PNG, JPG, JPEG</Text>
          <Text style={estilos.textoBanner}>
            La imagen se adaptará respetando su relación de aspecto original para ajustarse a una página PDF nítida y centrada sin distorsión.
          </Text>
        </View>

        {/* Selector de Imagen */}
        <View style={estilos.card}>
          <Text style={estilos.tituloCard}>Selecciona tu Imagen</Text>
          <Text style={estilos.subtituloCard}>Únicamente archivos PNG, JPG o JPEG</Text>

          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarImagen} activeOpacity={0.7}>
            <View style={estilos.iconoCirculo}>
              <Text style={estilos.iconoDoc}>{archivoImagen ? '🖼️' : '📁'}</Text>
            </View>
            <View style={estilos.infoDoc}>
              <Text style={estilos.nombreDoc} numberOfLines={1}>
                {archivoImagen ? archivoImagen.name : 'Toca para elegir imagen'}
              </Text>
              <Text style={estilos.detalleDoc}>
                {archivoImagen
                  ? `${(archivoImagen.size / (1024 * 1024)).toFixed(2)} MB • Listo para procesar`
                  : 'Filtro exclusivo: PNG, JPG, JPEG'}
              </Text>
            </View>
            {archivoImagen && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>

          {/* Miniatura de previsualización de la imagen */}
          {archivoImagen && (
            <View style={estilos.contenedorPreview}>
              <Image
                source={{ uri: archivoImagen.uri }}
                style={estilos.imagenPreview}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        {/* Botón de Conversión */}
        <TouchableOpacity
          style={[estilos.btnConvertir, (convirtiendo || !archivoImagen) && { opacity: 0.6 }]}
          onPress={ejecutarConversion}
          disabled={convirtiendo || !archivoImagen}
          activeOpacity={0.8}
        >
          {convirtiendo ? (
            <View style={estilos.filaCargando}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={estilos.textoCargando}>Convirtiendo imagen a PDF...</Text>
            </View>
          ) : (
            <Text style={estilos.textoBtnConvertir}>Convertir Imagen a PDF</Text>
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
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    marginBottom: 18,
  },
  tituloBanner: {
    color: '#F472B6',
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
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
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
  contenedorPreview: {
    marginTop: 14,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  imagenPreview: {
    width: '100%',
    height: '100%',
  },
  btnConvertir: {
    backgroundColor: '#DB2777',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#DB2777',
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

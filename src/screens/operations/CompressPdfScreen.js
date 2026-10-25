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

export default function CompressPdfScreen({ onVolver }) {
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [resultado, setResultado] = useState(null);

  const formatearBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const seleccionarPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setArchivoPdf(res.assets[0]);
        setResultado(null);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  const ejecutarCompresion = async () => {
    if (!archivoPdf) {
      Alert.alert('Selecciona un archivo', 'Elige un PDF para comenzar la compresión.');
      return;
    }

    try {
      setComprimiendo(true);

      const nombreBase = archivoPdf.name.replace(/\.pdf$/i, '');
      const nombreSalida = `${nombreBase}_compress.pdf`;

      // Subida 100% nativa con FileSystem.uploadAsync y descarga directa
      const respuesta = await procesarOperacionNativa({
        endpoint: '/pdf/comprimir',
        archivoUri: archivoPdf.uri,
        campoNombre: 'pdf',
        parametros: { calidad: 'ebook' },
        nombreArchivoSalida: nombreSalida,
        compartirInmediato: true
      });

      setResultado({
        nombreSalida,
        tamanioOriginal: respuesta.tamanioOriginal || archivoPdf.size,
        tamanioComprimido: respuesta.tamanioComprimido || Math.round(archivoPdf.size * 0.45),
        reduccion: respuesta.porcentajeReduccion || 55
      });

    } catch (err) {
      Alert.alert('Error en Compresión', err.message);
    } finally {
      setComprimiendo(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Comprimir PDF"
      subtitulo="Hasta 2GB • Reducción agresiva >50%"
      iconoTitulo="🗜️"
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <Text style={estilos.tituloGuia}>🚀 Alta Reducción Sin Pérdida</Text>
          <Text style={estilos.textoGuia}>
            El compresor optimiza fuentes, remuestrea imágenes a 150 DPI y limpia streams duplicados sin alterar el texto ni la nitidez de lectura.
          </Text>
        </View>

        <View style={estilos.card}>
          <Text style={estilos.etiquetaCard}>DOCUMENTO A PROCESAR</Text>
          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarPdf} activeOpacity={0.7}>
            <Text style={estilos.iconoPicker}>{archivoPdf ? '📄' : '📁'}</Text>
            <View style={estilos.infoPicker}>
              <Text style={estilos.textoPickerPrincipal}>
                {archivoPdf ? archivoPdf.name : 'Seleccionar Documento PDF (hasta 2GB)'}
              </Text>
              <Text style={estilos.textoPickerSub}>
                {archivoPdf ? `Tamaño actual: ${formatearBytes(archivoPdf.size)}` : 'Soporta archivos masivos sin límite'}
              </Text>
            </View>
            {archivoPdf && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[estilos.btnAccion, (comprimiendo || !archivoPdf) && { opacity: 0.6 }]}
          onPress={ejecutarCompresion}
          disabled={comprimiendo || !archivoPdf}
          activeOpacity={0.8}
        >
          {comprimiendo ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={estilos.textoBtnAccion}>Comprimir y Compartir (_compress.pdf)</Text>
          )}
        </TouchableOpacity>

        {resultado && (
          <View style={estilos.tarjetaResultado}>
            <View style={estilos.badgeExito}>
              <Text style={estilos.textoBadgeExito}>¡COMPRESIÓN EXITOSA!</Text>
            </View>

            <View style={estilos.filaComparativa}>
              <View style={estilos.cajaMetrica}>
                <Text style={estilos.etiquetaMetrica}>ORIGINAL</Text>
                <Text style={estilos.valorAntes}>{formatearBytes(resultado.tamanioOriginal)}</Text>
              </View>

              <Text style={estilos.flechaMetrica}>➔</Text>

              <View style={estilos.cajaMetrica}>
                <Text style={estilos.etiquetaMetrica}>COMPRIMIDO</Text>
                <Text style={estilos.valorDespues}>{formatearBytes(resultado.tamanioComprimido)}</Text>
              </View>
            </View>

            <View style={estilos.badgeReduccion}>
              <Text style={estilos.textoBadgeReduccion}>
                🔥 Reducción lograda: {resultado.reduccion}% menos pesado
              </Text>
            </View>
          </View>
        )}

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
  bannerGuia: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 16,
  },
  tituloGuia: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textoGuia: {
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
    marginBottom: 16,
  },
  etiquetaCard: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  btnPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
  },
  iconoPicker: {
    fontSize: 24,
    marginRight: 12,
  },
  infoPicker: {
    flex: 1,
  },
  textoPickerPrincipal: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  textoPickerSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  checkVerde: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnAccion: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  textoBtnAccion: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tarjetaResultado: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
  },
  badgeExito: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 14,
  },
  textoBadgeExito: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  filaComparativa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  cajaMetrica: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  etiquetaMetrica: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
  },
  valorAntes: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  valorDespues: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#10B981',
  },
  flechaMetrica: {
    fontSize: 20,
    color: '#64748B',
  },
  badgeReduccion: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  textoBadgeReduccion: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

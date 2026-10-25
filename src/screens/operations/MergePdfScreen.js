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
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ScreenContainer from '../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { CONFIGURACION } from '../../config/constantes';

export default function MergePdfScreen({ onVolver }) {
  const [archivosPdf, setArchivosPdf] = useState([]);
  const [uniendo, setUniendo] = useState(false);
  const [progresoTexto, setProgresoTexto] = useState('');

  const agregarPdfs = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setArchivosPdf(prev => [...prev, ...res.assets]);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudieron seleccionar los archivos.');
    }
  };

  const eliminarArchivo = (index) => {
    setArchivosPdf(archivosPdf.filter((_, i) => i !== index));
  };

  const moverArriba = (index) => {
    if (index === 0) return;
    const nuevos = [...archivosPdf];
    const temp = nuevos[index - 1];
    nuevos[index - 1] = nuevos[index];
    nuevos[index] = temp;
    setArchivosPdf(nuevos);
  };

  const moverAbajo = (index) => {
    if (index === archivosPdf.length - 1) return;
    const nuevos = [...archivosPdf];
    const temp = nuevos[index + 1];
    nuevos[index + 1] = nuevos[index];
    nuevos[index] = temp;
    setArchivosPdf(nuevos);
  };

  const ejecutarUnion = async () => {
    if (archivosPdf.length < 2) {
      Alert.alert('Mínimo 2 archivos', 'Agrega al menos dos archivos PDF para unirlos.');
      return;
    }

    try {
      setUniendo(true);
      const sesionId = `merge_${Date.now()}`;

      // 1. Subida nativa de cada archivo a la sesión temporal
      for (let i = 0; i < archivosPdf.length; i++) {
        setProgresoTexto(`Subiendo archivo ${i + 1} de ${archivosPdf.length}...`);
        await procesarOperacionNativa({
          endpoint: '/pdf/sesion-unir/subir',
          archivoUri: archivosPdf[i].uri,
          campoNombre: 'pdf',
          parametros: { sesionId },
          compartirInmediato: false
        });
      }

      setProgresoTexto('Uniendo y optimizando el tamaño final...');

      // 2. Ejecución del Merge en el servidor
      const res = await fetch(`${CONFIGURACION.URL_API_BACKEND}/pdf/sesion-unir/procesar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-retorno-json': 'true'
        },
        body: JSON.stringify({
          sesionId,
          nombresOrdenados: archivosPdf.map(a => a.name)
        }),
      });

      const data = await res.json();
      if (!data.exito || !data.descargaUrl) {
        throw new Error(data.mensaje || 'Error al procesar la unión de PDFs.');
      }

      const nombreBase = archivosPdf[0].name.replace(/\.pdf$/i, '');
      const nombreSalida = `${nombreBase}_join.pdf`;
      const uriDestino = `${FileSystem.documentDirectory}${nombreSalida}`;

      const downloadResult = await FileSystem.downloadAsync(data.descargaUrl, uriDestino);
      await Sharing.shareAsync(downloadResult.uri, {
        dialogTitle: `Compartir ${nombreSalida}`,
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf'
      });

    } catch (err) {
      Alert.alert('Error al unir', err.message);
    } finally {
      setUniendo(false);
      setProgresoTexto('');
    }
  };

  return (
    <ScreenContainer
      titulo="Unir PDFs"
      subtitulo="Combina y reordena múltiples documentos"
      iconoTitulo="📑"
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <Text style={estilos.tituloGuia}>💡 Orden y Optimización</Text>
          <Text style={estilos.textoGuia}>
            Organiza los documentos con las flechas ▲ y ▼. El resultado se procesará aplicando compresión para que no quede pesado.
          </Text>
        </View>

        <TouchableOpacity style={estilos.btnAgregar} onPress={agregarPdfs} activeOpacity={0.7}>
          <Text style={estilos.iconoAgregar}>➕</Text>
          <View style={estilos.textosAgregar}>
            <Text style={estilos.textoAgregarPrincipal}>Seleccionar y Agregar PDFs</Text>
            <Text style={estilos.textoAgregarSub}>Puedes seleccionar varios documentos</Text>
          </View>
        </TouchableOpacity>

        <View style={estilos.contenedorLista}>
          <View style={estilos.headerLista}>
            <Text style={estilos.tituloLista}>Documentos en cola ({archivosPdf.length})</Text>
            {archivosPdf.length > 0 && (
              <TouchableOpacity onPress={() => setArchivosPdf([])}>
                <Text style={estilos.textoLimpiar}>Limpiar todos</Text>
              </TouchableOpacity>
            )}
          </View>

          {archivosPdf.length === 0 ? (
            <View style={estilos.cajaVacia}>
              <Text style={estilos.iconoVacio}>📂</Text>
              <Text style={estilos.textoVacio}>No has agregado ningún documento todavía.</Text>
            </View>
          ) : (
            archivosPdf.map((archivo, index) => (
              <View key={index} style={estilos.itemArchivo}>
                <View style={estilos.badgePosicion}>
                  <Text style={estilos.textoPosicion}>{index + 1}</Text>
                </View>

                <View style={estilos.infoArchivo}>
                  <Text style={estilos.nombreArchivo} numberOfLines={1}>
                    {archivo.name}
                  </Text>
                  <Text style={estilos.pesoArchivo}>
                    {(archivo.size / 1024).toFixed(1)} KB
                  </Text>
                </View>

                <View style={estilos.filaBotonesAccion}>
                  <TouchableOpacity
                    style={[estilos.btnOrden, index === 0 && { opacity: 0.3 }]}
                    disabled={index === 0}
                    onPress={() => moverArriba(index)}
                  >
                    <Text style={estilos.textoBtnOrden}>▲</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[estilos.btnOrden, index === archivosPdf.length - 1 && { opacity: 0.3 }]}
                    disabled={index === archivosPdf.length - 1}
                    onPress={() => moverAbajo(index)}
                  >
                    <Text style={estilos.textoBtnOrden}>▼</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={estilos.btnEliminar}
                    onPress={() => eliminarArchivo(index)}
                  >
                    <Text style={estilos.textoBtnEliminar}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[estilos.btnUnir, (uniendo || archivosPdf.length < 2) && { opacity: 0.5 }]}
          onPress={ejecutarUnion}
          disabled={uniendo || archivosPdf.length < 2}
          activeOpacity={0.8}
        >
          {uniendo ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator color="#FFFFFF" />
              {progresoTexto ? (
                <Text style={estilos.textoProgreso}>{progresoTexto}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={estilos.textoBtnUnir}>
              Unir {archivosPdf.length} PDFs y Compartir (_join.pdf)
            </Text>
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
  bannerGuia: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    marginBottom: 16,
  },
  tituloGuia: {
    color: '#A78BFA',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textoGuia: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  btnAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  iconoAgregar: {
    fontSize: 22,
    marginRight: 12,
  },
  textosAgregar: {
    flex: 1,
  },
  textoAgregarPrincipal: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textoAgregarSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  contenedorLista: {
    marginBottom: 18,
  },
  headerLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tituloLista: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  textoLimpiar: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  cajaVacia: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconoVacio: {
    fontSize: 30,
    marginBottom: 6,
  },
  textoVacio: {
    color: '#64748B',
    fontSize: 13,
  },
  itemArchivo: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgePosicion: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textoPosicion: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoArchivo: {
    flex: 1,
  },
  nombreArchivo: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  pesoArchivo: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  filaBotonesAccion: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnOrden: {
    backgroundColor: '#1E293B',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  textoBtnOrden: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  btnEliminar: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  textoBtnEliminar: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnUnir: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  textoBtnUnir: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  textoProgreso: {
    color: '#E0E7FF',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
});

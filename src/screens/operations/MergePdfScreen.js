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
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { CONFIGURACION } from '../../config/constantes';
import { theme } from '../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

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
      iconoTitulo={<Feather name="layers" size={17} color={theme.colors.foreground} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="accent">ORDEN SECUENCIAL</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Ensamblaje y Optimización</Text>
          <Text style={estilos.textoGuia}>
            Añade los archivos en cola, ordénalos con los controles de posición y genera un único documento optimizado.
          </Text>
        </View>

        <TouchableOpacity style={estilos.btnAgregar} onPress={agregarPdfs} activeOpacity={0.7}>
          <View style={estilos.iconoAgregarCaja}>
            <Feather name="plus" size={18} color={theme.colors.foreground} />
          </View>
          <View style={estilos.textosAgregar}>
            <Text style={estilos.textoAgregarPrincipal}>Seleccionar y Agregar PDFs</Text>
            <Text style={estilos.textoAgregarSub}>Admite selección múltiple simultánea</Text>
          </View>
        </TouchableOpacity>

        <View style={estilos.contenedorLista}>
          <View style={estilos.headerLista}>
            <Text style={estilos.tituloLista}>Documentos en cola ({archivosPdf.length})</Text>
            {archivosPdf.length > 0 && (
              <TouchableOpacity onPress={() => setArchivosPdf([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={estilos.textoLimpiar}>Limpiar todos</Text>
              </TouchableOpacity>
            )}
          </View>

          {archivosPdf.length === 0 ? (
            <Card style={estilos.cajaVacia}>
              <Feather name="inbox" size={28} color={theme.colors.mutedForeground} style={{ marginBottom: 8 }} />
              <Text style={estilos.textoVacio}>No has agregado ningún documento todavía.</Text>
            </Card>
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
                    <Feather name="chevron-up" size={14} color={theme.colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[estilos.btnOrden, index === archivosPdf.length - 1 && { opacity: 0.3 }]}
                    disabled={index === archivosPdf.length - 1}
                    onPress={() => moverAbajo(index)}
                  >
                    <Feather name="chevron-down" size={14} color={theme.colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={estilos.btnEliminar}
                    onPress={() => eliminarArchivo(index)}
                  >
                    <Feather name="trash-2" size={13} color={theme.colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <Button
          variant="default"
          size="lg"
          onPress={ejecutarUnion}
          disabled={uniendo || archivosPdf.length < 2}
          cargando={uniendo}
          icon={!uniendo && <Feather name="check-circle" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnUnir}
        >
          {uniendo ? progresoTexto || 'Procesando...' : `Unir ${archivosPdf.length} PDFs y Compartir`}
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
  btnAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 20,
  },
  iconoAgregarCaja: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textosAgregar: {
    flex: 1,
  },
  textoAgregarPrincipal: {
    color: theme.colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  textoAgregarSub: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  contenedorLista: {
    marginBottom: 20,
  },
  headerLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloLista: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.foreground,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  textoLimpiar: {
    fontSize: 12,
    color: theme.colors.destructive,
    fontWeight: '500',
  },
  cajaVacia: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  textoVacio: {
    color: theme.colors.mutedForeground,
    fontSize: 13,
    textAlign: 'center',
  },
  itemArchivo: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgePosicion: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textoPosicion: {
    color: theme.colors.foreground,
    fontSize: 11,
    fontWeight: '700',
  },
  infoArchivo: {
    flex: 1,
    marginRight: 8,
  },
  nombreArchivo: {
    color: theme.colors.foreground,
    fontSize: 13,
    fontWeight: '500',
  },
  pesoArchivo: {
    color: theme.colors.mutedForeground,
    fontSize: 11,
    marginTop: 2,
  },
  filaBotonesAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnOrden: {
    backgroundColor: theme.colors.secondary,
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnEliminar: {
    backgroundColor: theme.colors.destructiveMuted,
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginLeft: 4,
  },
  btnUnir: {
    width: '100%',
  },
});

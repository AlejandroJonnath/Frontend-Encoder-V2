import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import ExcelSheetSelector from '../../components/ExcelSheetSelector';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { CONFIGURACION } from '../../config/constantes';
import { theme } from '../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAlerta } from '../../context/AlertContext';

const EXCEL_COLOR = '#34D399';

export default function ConvertExcelScreen({ onVolver }) {
  const { mostrarErrorFormatoInvalido, mostrarErrorOperacion } = useAlerta();
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [reporteExcel, setReporteExcel] = useState(null);
  const [idTemporalExcel, setIdTemporalExcel] = useState(null);
  const [modalHojasVisible, setModalHojasVisible] = useState(false);
  const [cargandoInspeccion, setCargandoInspeccion] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState(false);

  const seleccionarExcel = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel'
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const doc = res.assets[0];
        const nombreMin = doc.name.toLowerCase();
        if (!nombreMin.endsWith('.xlsx') && !nombreMin.endsWith('.xls')) {
          mostrarErrorFormatoInvalido('.xlsx o .xls');
          return;
        }

        setArchivoExcel(doc);
        setReporteExcel(null);
        setIdTemporalExcel(null);

        inspeccionarHojas(doc);
      }
    } catch (err) {
      mostrarErrorOperacion('Error de acceso', 'No se pudo seleccionar el archivo Excel.');
    }
  };

  const inspeccionarHojas = async (doc) => {
    try {
      setCargandoInspeccion(true);

      const data = await procesarOperacionNativa({
        endpoint: '/excel/inspeccionar',
        archivoUri: doc.uri,
        campoNombre: 'excel',
        compartirInmediato: false
      });

      if (data.exito && data.reporte) {
        setReporteExcel(data.reporte);
        setIdTemporalExcel(data.archivoTemporalId);
      } else {
        throw new Error(data.mensaje || 'Error al inspeccionar las hojas del libro Excel.');
      }
    } catch (err) {
      mostrarErrorOperacion('Aviso', `No se pudo leer la estructura previa del Excel: ${err.message}`);
    } finally {
      setCargandoInspeccion(false);
    }
  };

  const confirmarConversionHojas = async (hojasSeleccionadas) => {
    setModalHojasVisible(false);

    if (!idTemporalExcel) {
      mostrarErrorOperacion('Error de sesión', 'Falta el identificador del archivo Excel. Vuelve a seleccionarlo.');
      return;
    }

    try {
      setConvirtiendo(true);

      const res = await fetch(`${CONFIGURACION.URL_API_BACKEND}/excel/procesar-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-retorno-json': 'true'
        },
        body: JSON.stringify({
          archivoTemporalId: idTemporalExcel,
          hojasSeleccionadas
        })
      });

      const data = await res.json();
      if (!data.exito || !data.descargaUrl) {
        throw new Error(data.mensaje || 'Error procesando las hojas de Excel.');
      }

      const nombreBase = archivoExcel.name.replace(/\.(xlsx|xls)$/i, '');
      const nombreSalida = `${nombreBase}_converted.pdf`;
      const uriDestino = `${FileSystem.documentDirectory}${nombreSalida}`;

      const downloadResult = await FileSystem.downloadAsync(data.descargaUrl, uriDestino);
      const puedeCompartir = await Sharing.isAvailableAsync();

      if (puedeCompartir) {
        await Sharing.shareAsync(downloadResult.uri, {
          dialogTitle: `Compartir ${nombreSalida}`,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf'
        });
      }

    } catch (err) {
      mostrarErrorOperacion('Error en Conversión', err.message);
    } finally {
      setConvirtiendo(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Excel a PDF"
      subtitulo="Previsualiza y selecciona hojas específicas"
      iconoTitulo={<MaterialCommunityIcons name="microsoft-excel" size={19} color={EXCEL_COLOR} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="secondary">FILTRO EXCLUSIVO EXCEL</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Hojas de Cálculo (.xlsx, .xls)</Text>
          <Text style={estilos.textoGuia}>
            Inspecciona las columnas y filas de cada hoja para seleccionar únicamente los datos que requieres exportar a PDF.
          </Text>
        </View>

        <Card style={estilos.card}>
          <CardHeader>
            <CardTitle>Libro de Excel</CardTitle>
            <CardDescription>Formatos compatibles: .xlsx y .xls</CardDescription>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={seleccionarExcel} activeOpacity={0.7}>
              <View style={[estilos.iconoDropzone, archivoExcel && { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.25)' }]}>
                {archivoExcel
                  ? <MaterialCommunityIcons name="microsoft-excel" size={22} color={EXCEL_COLOR} />
                  : <Feather name="upload-cloud" size={20} color={theme.colors.mutedForeground} />}
              </View>
              <View style={estilos.infoDropzone}>
                <Text style={estilos.textoPrincipalDropzone} numberOfLines={1}>
                  {archivoExcel ? archivoExcel.name : 'Seleccionar Archivo Excel'}
                </Text>
                <Text style={estilos.textoSecundarioDropzone}>
                  {archivoExcel
                    ? `${(archivoExcel.size / (1024 * 1024)).toFixed(2)} MB • ${
                        reporteExcel ? `${reporteExcel.totalHojas} hojas detectadas` : 'Cargando hojas...'
                      }`
                    : 'Toca para examinar tu almacenamiento'}
                </Text>
              </View>
              {archivoExcel && <Badge variant="success">Listo</Badge>}
            </TouchableOpacity>
          </CardContent>
        </Card>

        {cargandoInspeccion && (
          <View style={estilos.cardCargando}>
            <ActivityIndicator color={theme.colors.foreground} size="small" />
            <Text style={estilos.textoCargandoInspeccion}>
              Analizando hojas y filas de datos...
            </Text>
          </View>
        )}

        {reporteExcel && !cargandoInspeccion && (
          <Card style={estilos.cardReporte}>
            <CardHeader style={estilos.headerReporte}>
              <View style={{ flex: 1 }}>
                <CardTitle style={{ fontSize: 14 }}>Hojas Detectadas ({reporteExcel.totalHojas})</CardTitle>
                <CardDescription>Resumen de estructura del libro</CardDescription>
              </View>
              <Button
                variant="outline"
                size="sm"
                onPress={() => setModalHojasVisible(true)}
                icon={<Feather name="sliders" size={13} color={theme.colors.foreground} />}
              >
                Filtrar
              </Button>
            </CardHeader>

            <CardContent>
              {reporteExcel.hojas?.slice(0, 4).map((h, i) => (
                <View key={i} style={estilos.filaHojaItem}>
                  <Text style={estilos.nombreHojaItem} numberOfLines={1}>{h.nombre}</Text>
                  <Text style={estilos.metaHojaItem}>{h.filasTotales} filas • {h.columnasTotales} cols</Text>
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        <Button
          variant="default"
          size="lg"
          onPress={() => setModalHojasVisible(true)}
          disabled={convirtiendo || cargandoInspeccion || !archivoExcel || !reporteExcel}
          cargando={convirtiendo}
          icon={!convirtiendo && <Feather name="arrow-right-circle" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnConvertir}
        >
          {reporteExcel ? 'Seleccionar Hojas y Convertir' : 'Selecciona un archivo Excel'}
        </Button>

        <View style={{ height: 32 }} />
      </ScrollView>

      {modalHojasVisible && (
        <ExcelSheetSelector
          visible={modalHojasVisible}
          reporte={reporteExcel}
          onConfirmar={confirmarConversionHojas}
          onCancelar={() => setModalHojasVisible(false)}
        />
      )}
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
  cardCargando: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textoCargandoInspeccion: {
    color: theme.colors.mutedForeground,
    fontSize: 13,
  },
  cardReporte: {
    marginBottom: 16,
  },
  headerReporte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaHojaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  nombreHojaItem: {
    color: theme.colors.foreground,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  metaHojaItem: {
    color: theme.colors.mutedForeground,
    fontSize: 11,
  },
  btnConvertir: {
    width: '100%',
  },
});

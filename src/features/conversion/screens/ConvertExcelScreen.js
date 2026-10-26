import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ScreenContainer from '../../../components/ScreenContainer';
import ExcelSheetSelector from '../components/ExcelSheetSelector';
import { useDocumentConversion } from '../hooks/useDocumentConversion';
import { formatearBytes, generarNombreSalida } from '../../../utils/fileFormatters';
import { theme } from '../../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingOverlay } from '../../../components/ui/LoadingOverlay';
import { useAlerta } from '../../../context/AlertContext';

const EXCEL_COLOR = '#34D399';

export default function ConvertExcelScreen({ onVolver }) {
  const { mostrarErrorOperacion } = useAlerta();

  const {
    archivo: archivoExcel,
    convirtiendo,
    cargandoSeleccion,
    reporteExcel,
    selectorExcelVisible,
    setSelectorExcelVisible,
    seleccionarArchivo,
    inspeccionarExcel,
    procesarHojasExcel
  } = useDocumentConversion({
    tipo: 'excel',
    extensionesPermitidas: ['.xlsx', '.xls'],
    tipoMime: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
    etiquetaFormato: 'Excel'
  });

  // Cuando se selecciona un archivo Excel, inspeccionar automáticamente sus hojas
  const alSeleccionarExcel = async () => {
    const doc = await seleccionarArchivo();
    if (doc) {
      // inspeccionar se disparará automáticamente vía efecto
    }
  };

  useEffect(() => {
    if (archivoExcel) {
      inspeccionarExcel();
    }
  }, [archivoExcel]);

  const alConfirmarHojas = async (hojasSeleccionadas) => {
    try {
      const data = await procesarHojasExcel(hojasSeleccionadas);
      if (data && data.descargaUrl) {
        const nombreSalida = generarNombreSalida(archivoExcel.name, '_converted', '.pdf');
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
      }
    } catch (err) {
      mostrarErrorOperacion('Error en Conversión', err.message);
    }
  };

  return (
    <ScreenContainer
      titulo="Excel a PDF"
      subtitulo="Inspecciona y exporta hojas específicas"
      iconoTitulo={<MaterialCommunityIcons name="file-excel-box" size={19} color={EXCEL_COLOR} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="accent">SELECTOR DE HOJAS</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Conversión Modular de Hojas</Text>
          <Text style={estilos.textoGuia}>
            Inspecciona la estructura interna de tu libro Excel y elige exactamente qué hojas incluir en el PDF final.
          </Text>
        </View>

        <Card style={estilos.card}>
          <CardHeader>
            <CardTitle>Libro de Cálculo (.xlsx / .xls)</CardTitle>
            <CardDescription>Soporta fórmulas y múltiples pestañas</CardDescription>
          </CardHeader>

          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={alSeleccionarExcel} activeOpacity={0.7}>
              <View style={[estilos.iconoDropzone, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
                <MaterialCommunityIcons
                  name={archivoExcel ? "file-excel" : "file-upload-outline"}
                  size={20}
                  color={EXCEL_COLOR}
                />
              </View>
              <View style={estilos.infoDropzone}>
                <Text style={estilos.textoPrincipalDropzone} numberOfLines={1}>
                  {archivoExcel ? archivoExcel.name : 'Seleccionar Archivo Excel'}
                </Text>
                <Text style={estilos.textoSecundarioDropzone}>
                  {archivoExcel ? `${formatearBytes(archivoExcel.size)} cargado` : 'Examinar tu dispositivo'}
                </Text>
              </View>
              {archivoExcel && <Badge variant="success">Listo</Badge>}
            </TouchableOpacity>

            {cargandoSeleccion && (
              <View style={estilos.filaCargando}>
                <ActivityIndicator size="small" color={EXCEL_COLOR} />
                <Text style={estilos.textoCargando}>Inspeccionando hojas del libro...</Text>
              </View>
            )}

            {reporteExcel && (
              <View style={estilos.cajaReporte}>
                <View style={estilos.headerReporte}>
                  <Feather name="layers" size={15} color={EXCEL_COLOR} style={{ marginRight: 6 }} />
                  <Text style={estilos.tituloReporte}>Estructura Detectada</Text>
                  <Badge variant="secondary" style={{ marginLeft: 'auto' }}>
                    {reporteExcel.totalHojas} {reporteExcel.totalHojas === 1 ? 'Hoja' : 'Hojas'}
                  </Badge>
                </View>

                <View style={estilos.listaHojasPreview}>
                  {reporteExcel.hojas?.slice(0, 4).map((hoja, i) => (
                    <View key={i} style={estilos.itemHojaPreview}>
                      <Feather name="check-square" size={12} color={EXCEL_COLOR} style={{ marginRight: 5 }} />
                      <Text style={estilos.nombreHojaPreview} numberOfLines={1}>
                        {hoja.nombre}
                      </Text>
                      <Text style={estilos.filasHojaPreview}>({hoja.filas} filas)</Text>
                    </View>
                  ))}
                  {reporteExcel.totalHojas > 4 && (
                    <Text style={estilos.textoMasHojas}>
                      + {reporteExcel.totalHojas - 4} hojas adicionales
                    </Text>
                  )}
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {reporteExcel && (
          <Button
            variant="default"
            size="lg"
            onPress={() => setSelectorExcelVisible(true)}
            icon={<Feather name="sliders" size={16} color={theme.colors.primaryForeground} />}
            style={estilos.btnAccion}
          >
            Elegir Hojas y Convertir a PDF
          </Button>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal Selector de Hojas */}
      {reporteExcel && (
        <ExcelSheetSelector
          visible={selectorExcelVisible}
          reporte={reporteExcel}
          onConfirmar={alConfirmarHojas}
          onCancelar={() => setSelectorExcelVisible(false)}
        />
      )}

      <LoadingOverlay visible={convirtiendo} mensaje="Generando PDF con las hojas seleccionadas..." />
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    padding: theme.spacing.lg,
  },
  bannerGuia: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  bannerHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  tituloGuia: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  textoGuia: {
    ...theme.typography.small,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconoDropzone: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoDropzone: {
    flex: 1,
  },
  textoPrincipalDropzone: {
    ...theme.typography.bodyStrong,
  },
  textoSecundarioDropzone: {
    ...theme.typography.small,
    marginTop: 2,
  },
  filaCargando: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  textoCargando: {
    ...theme.typography.small,
    color: EXCEL_COLOR,
  },
  cajaReporte: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerReporte: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tituloReporte: {
    ...theme.typography.bodyStrong,
    fontSize: 13,
  },
  listaHojasPreview: {
    gap: 4,
  },
  itemHojaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nombreHojaPreview: {
    ...theme.typography.small,
    color: theme.colors.foreground,
    maxWidth: '70%',
  },
  filasHojaPreview: {
    ...theme.typography.small,
    fontSize: 11,
    color: theme.colors.mutedForeground,
    marginLeft: 4,
  },
  textoMasHojas: {
    ...theme.typography.small,
    fontSize: 11,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  btnAccion: {
    marginBottom: theme.spacing.lg,
  },
});

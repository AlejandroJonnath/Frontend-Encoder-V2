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
import ExcelSheetSelector from '../../components/ExcelSheetSelector';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { CONFIGURACION } from '../../config/constantes';

export default function ConvertExcelScreen({ onVolver }) {
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
          Alert.alert('Archivo no válido', 'Solo se permiten hojas de cálculo de Excel (.xlsx o .xls).');
          return;
        }

        setArchivoExcel(doc);
        setReporteExcel(null);
        setIdTemporalExcel(null);

        // Inspeccionar de inmediato las hojas en segundo plano
        inspeccionarHojas(doc);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo Excel.');
    }
  };

  const inspeccionarHojas = async (doc) => {
    try {
      setCargandoInspeccion(true);

      // Subida nativa sin JS FormData
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
      Alert.alert('Aviso', `No se pudo leer la estructura previa del Excel: ${err.message}`);
    } finally {
      setCargandoInspeccion(false);
    }
  };

  const confirmarConversionHojas = async (hojasSeleccionadas) => {
    setModalHojasVisible(false);

    if (!idTemporalExcel) {
      Alert.alert('Error', 'Falta el identificador del archivo Excel. Vuelve a seleccionarlo.');
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
      } else {
        Alert.alert('Conversión Exitosa', `Archivo guardado como ${nombreSalida}`);
      }

    } catch (err) {
      Alert.alert('Error en Conversión', err.message);
    } finally {
      setConvirtiendo(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Excel a PDF"
      subtitulo="Previsualiza y selecciona hojas específicas"
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
          <Text style={estilos.tituloBanner}>📗 Formatos admitidos: Excel (.xlsx, .xls)</Text>
          <Text style={estilos.textoBanner}>
            Puedes previsualizar el contenido y las columnas de cada hoja para seleccionar únicamente las tablas que deseas exportar a PDF.
          </Text>
        </View>

        {/* Selector de Archivo */}
        <View style={estilos.card}>
          <Text style={estilos.tituloCard}>Selecciona tu Libro de Excel</Text>
          <Text style={estilos.subtituloCard}>Únicamente archivos .xlsx o .xls</Text>

          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarExcel} activeOpacity={0.7}>
            <View style={estilos.iconoCirculo}>
              <Text style={estilos.iconoDoc}>{archivoExcel ? '📊' : '📁'}</Text>
            </View>
            <View style={estilos.infoDoc}>
              <Text style={estilos.nombreDoc} numberOfLines={1}>
                {archivoExcel ? archivoExcel.name : 'Toca para elegir archivo Excel'}
              </Text>
              <Text style={estilos.detalleDoc}>
                {archivoExcel
                  ? `${(archivoExcel.size / (1024 * 1024)).toFixed(2)} MB • ${
                      reporteExcel ? `${reporteExcel.totalHojas} hojas detectadas` : 'Cargando hojas...'
                    }`
                  : 'Filtro exclusivo: .xlsx o .xls'}
              </Text>
            </View>
            {archivoExcel && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Resumen de Hojas si ya fue inspeccionado */}
        {cargandoInspeccion && (
          <View style={estilos.cardCargando}>
            <ActivityIndicator color="#10B981" size="small" />
            <Text style={estilos.textoCargandoInspeccion}>
              Analizando hojas y filas de datos...
            </Text>
          </View>
        )}

        {reporteExcel && !cargandoInspeccion && (
          <View style={estilos.cardReporte}>
            <View style={estilos.headerReporte}>
              <Text style={estilos.tituloReporte}>Hojas del Documento ({reporteExcel.totalHojas})</Text>
              <TouchableOpacity
                style={estilos.btnVerHojas}
                onPress={() => setModalHojasVisible(true)}
              >
                <Text style={estilos.textoBtnVerHojas}>Ver / Filtrar Hojas ⚙️</Text>
              </TouchableOpacity>
            </View>

            {reporteExcel.hojas?.slice(0, 4).map((h, i) => (
              <View key={i} style={estilos.filaHojaItem}>
                <Text style={estilos.nombreHojaItem}>📑 {h.nombre}</Text>
                <Text style={estilos.metaHojaItem}>{h.filasTotales} filas • {h.columnasTotales} cols</Text>
              </View>
            ))}
          </View>
        )}

        {/* Botón de Conversión */}
        <TouchableOpacity
          style={[
            estilos.btnConvertir,
            (convirtiendo || cargandoInspeccion || !archivoExcel || !reporteExcel) && { opacity: 0.6 }
          ]}
          onPress={() => setModalHojasVisible(true)}
          disabled={convirtiendo || cargandoInspeccion || !archivoExcel || !reporteExcel}
          activeOpacity={0.8}
        >
          {convirtiendo ? (
            <View style={estilos.filaCargando}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={estilos.textoCargando}>Generando PDF formateado...</Text>
            </View>
          ) : (
            <Text style={estilos.textoBtnConvertir}>
              {reporteExcel ? 'Seleccionar Hojas y Convertir a PDF' : 'Selecciona un archivo Excel'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal Interactivo de Selección de Hojas */}
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
    padding: 18,
  },
  bannerInfo: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 18,
  },
  tituloBanner: {
    color: '#34D399',
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
    marginBottom: 16,
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
  cardCargando: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  textoCargandoInspeccion: {
    color: '#94A3B8',
    fontSize: 13,
  },
  cardReporte: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 20,
  },
  headerReporte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloReporte: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnVerHojas: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  textoBtnVerHojas: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  filaHojaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1E293B',
  },
  nombreHojaItem: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  metaHojaItem: {
    color: '#64748B',
    fontSize: 11,
  },
  btnConvertir: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#059669',
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

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';

export default function ExcelSheetSelector({
  visible,
  reporte,
  onConfirmar,
  onCancelar
}) {
  if (!reporte || !reporte.hojas) return null;

  // Por defecto todas las hojas vienen seleccionadas
  const [hojasSeleccionadas, setHojasSeleccionadas] = useState(
    reporte.hojas.map(h => h.nombre)
  );

  const alternarHoja = (nombre) => {
    if (hojasSeleccionadas.includes(nombre)) {
      if (hojasSeleccionadas.length === 1) return; // Mínimo una hoja
      setHojasSeleccionadas(hojasSeleccionadas.filter(h => h !== nombre));
    } else {
      setHojasSeleccionadas([...hojasSeleccionadas, nombre]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={estilos.fondoModal}>
        <View style={estilos.tarjetaModal}>
          <Text style={estilos.tituloModal}>📊 Previsualización de Hojas Excel</Text>
          <Text style={estilos.subtituloModal}>
            Selecciona las hojas que deseas incluir en el documento PDF:
          </Text>

          <ScrollView style={estilos.listaHojas}>
            {reporte.hojas.map((hoja, idx) => {
              const estaSeleccionada = hojasSeleccionadas.includes(hoja.nombre);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    estilos.tarjetaHoja,
                    estaSeleccionada && estilos.tarjetaHojaActiva
                  ]}
                  onPress={() => alternarHoja(hoja.nombre)}
                  activeOpacity={0.8}
                >
                  <View style={estilos.encabezadoHoja}>
                    <Text style={estilos.iconoCheck}>
                      {estaSeleccionada ? '☑️' : '⬜'}
                    </Text>
                    <Text style={estilos.nombreHoja}>{hoja.nombre}</Text>
                    <Text style={estilos.metricasHoja}>
                      {hoja.filasTotales} filas • {hoja.columnasTotales} cols
                    </Text>
                  </View>

                  {/* Vista previa de las primeras celdas */}
                  {hoja.datosMuestra && hoja.datosMuestra.length > 0 && (
                    <View style={estilos.contenedorTabla}>
                      {hoja.datosMuestra.slice(0, 3).map((fila, fIdx) => (
                        <View key={fIdx} style={estilos.filaTabla}>
                          {fila.slice(0, 4).map((celda, cIdx) => (
                            <Text key={cIdx} style={estilos.celdaTabla} numberOfLines={1}>
                              {celda || '-'}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={estilos.filaAcciones}>
            <TouchableOpacity style={estilos.botonCancelar} onPress={onCancelar}>
              <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonConfirmar}
              onPress={() => onConfirmar(hojasSeleccionadas)}
            >
              <Text style={estilos.textoBotonConfirmar}>
                Convertir ({hojasSeleccionadas.length}) a PDF
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  tarjetaModal: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  subtituloModal: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  listaHojas: {
    marginBottom: 16,
  },
  tarjetaHoja: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  tarjetaHojaActiva: {
    borderColor: '#38BDF8',
    backgroundColor: '#13233A',
  },
  encabezadoHoja: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconoCheck: {
    fontSize: 16,
    marginRight: 8,
  },
  nombreHoja: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
    flex: 1,
  },
  metricasHoja: {
    fontSize: 12,
    color: '#64748B',
  },
  contenedorTabla: {
    backgroundColor: '#0A0F1D',
    borderRadius: 6,
    padding: 6,
  },
  filaTabla: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1E293B',
  },
  celdaTabla: {
    flex: 1,
    fontSize: 10,
    color: '#94A3B8',
    paddingHorizontal: 2,
  },
  filaAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  botonCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#334155',
  },
  textoBotonCancelar: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  botonConfirmar: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  textoBotonConfirmar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

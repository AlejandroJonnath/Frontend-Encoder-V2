import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../../theme/shadcn';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export default function ExcelSheetSelector({
  visible,
  reporte,
  onConfirmar,
  onCancelar
}) {
  if (!reporte || !reporte.hojas) return null;

  const [hojasSeleccionadas, setHojasSeleccionadas] = useState(
    reporte.hojas.map(h => h.nombre)
  );

  const alternarHoja = (nombre) => {
    if (hojasSeleccionadas.includes(nombre)) {
      if (hojasSeleccionadas.length === 1) return;
      setHojasSeleccionadas(hojasSeleccionadas.filter(h => h !== nombre));
    } else {
      setHojasSeleccionadas([...hojasSeleccionadas, nombre]);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={estilos.fondoModal}>
        <View style={estilos.tarjetaModal}>
          <View style={estilos.headerModal}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloModal}>Selección de Hojas Excel</Text>
              <Text style={estilos.subtituloModal}>
                Elige las hojas que deseas exportar en el documento PDF
              </Text>
            </View>
            <TouchableOpacity onPress={onCancelar} style={estilos.btnCerrar}>
              <Feather name="x" size={16} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={estilos.listaHojas} showsVerticalScrollIndicator={false}>
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
                    <Feather
                      name={estaSeleccionada ? "check-square" : "square"}
                      size={18}
                      color={estaSeleccionada ? theme.colors.foreground : theme.colors.mutedForeground}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={estilos.nombreHoja} numberOfLines={1}>{hoja.nombre}</Text>
                    <Badge variant={estaSeleccionada ? "secondary" : "outline"}>
                      {hoja.filasTotales} filas • {hoja.columnasTotales} cols
                    </Badge>
                  </View>

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
            <Button
              variant="outline"
              size="default"
              onPress={onCancelar}
              style={{ flex: 1, marginRight: 8 }}
            >
              Cancelar
            </Button>

            <Button
              variant="default"
              size="default"
              onPress={() => onConfirmar(hojasSeleccionadas)}
              style={{ flex: 1.5 }}
            >
              Convertir ({hojasSeleccionadas.length}) a PDF
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  tarjetaModal: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerModal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tituloModal: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.foreground,
    letterSpacing: -0.2,
  },
  subtituloModal: {
    fontSize: 13,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  btnCerrar: {
    padding: 4,
    marginLeft: 8,
  },
  listaHojas: {
    marginBottom: 16,
  },
  tarjetaHoja: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 10,
  },
  tarjetaHojaActiva: {
    borderColor: theme.colors.foreground,
    backgroundColor: theme.colors.secondary,
  },
  encabezadoHoja: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nombreHoja: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  contenedorTabla: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filaTabla: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  celdaTabla: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.mutedForeground,
    paddingHorizontal: 2,
  },
  filaAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

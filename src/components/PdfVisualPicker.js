import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  TouchableOpacity
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme/shadcn';

/**
 * Previsualizador interactivo para ubicar la firma o nota sobre la página del documento
 */
export default function PdfVisualPicker({
  totalPaginas = 1,
  paginaActual = 1,
  alCambiarPagina,
  alCambiarPosicion,
  tipo = 'firma',
  tituloEtiqueta = 'Firma'
}) {
  const [posX, setPosX] = useState(60);
  const [posY, setPosY] = useState(120);

  const anchoCaja = tipo === 'firma' ? 140 : 120;
  const altoCaja = tipo === 'firma' ? 55 : 45;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const nuevaX = Math.max(10, Math.min(gestureState.moveX - 100, 240 - anchoCaja));
        const nuevaY = Math.max(10, Math.min(gestureState.moveY - 260, 340 - altoCaja));

        setPosX(nuevaX);
        setPosY(nuevaY);

        if (alCambiarPosicion) {
          const factorX = 595 / 240;
          const factorY = 842 / 340;
          alCambiarPosicion({
            x: Math.round(nuevaX * factorX),
            y: Math.round((340 - nuevaY - altoCaja) * factorY),
            pagina: paginaActual
          });
        }
      }
    })
  ).current;

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.barraControles}>
        <Text style={estilos.textoInfo}>Página {paginaActual} de {totalPaginas}</Text>
        <View style={estilos.filaBotones}>
          <TouchableOpacity
            style={[estilos.btnPagina, paginaActual <= 1 && estilos.btnDeshabilitado]}
            disabled={paginaActual <= 1}
            onPress={() => alCambiarPagina && alCambiarPagina(paginaActual - 1)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={13} color={theme.colors.foreground} />
            <Text style={estilos.textoBtn}>Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[estilos.btnPagina, paginaActual >= totalPaginas && estilos.btnDeshabilitado]}
            disabled={paginaActual >= totalPaginas}
            onPress={() => alCambiarPagina && alCambiarPagina(paginaActual + 1)}
            activeOpacity={0.7}
          >
            <Text style={estilos.textoBtn}>Siguiente</Text>
            <Feather name="chevron-right" size={13} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={estilos.instruccion}>
        Arrastra el recuadro para definir la posición exacta en el documento:
      </Text>

      {/* Hoja de papel simulada */}
      <View style={estilos.hojaPdf}>
        <View style={estilos.lineaSimulada} />
        <View style={[estilos.lineaSimulada, { width: '80%' }]} />
        <View style={[estilos.lineaSimulada, { width: '90%' }]} />
        <View style={[estilos.lineaSimulada, { width: '60%' }]} />

        {/* Elemento arrastrable */}
        <View
          {...panResponder.panHandlers}
          style={[
            estilos.cajaArrastrable,
            tipo === 'firma' ? estilos.cajaFirma : estilos.cajaNota,
            { left: posX, top: posY, width: anchoCaja, height: altoCaja }
          ]}
        >
          <View style={estilos.filaEtiquetaCaja}>
            <Feather
              name={tipo === 'firma' ? "shield" : "edit-3"}
              size={12}
              color={tipo === 'firma' ? '#0284C7' : '#D97706'}
              style={{ marginRight: 4 }}
            />
            <Text style={estilos.textoCaja}>{tituloEtiqueta}</Text>
          </View>
          <Text style={estilos.subtextoCaja}>(Arrastra aquí)</Text>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    marginVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  barraControles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 250,
    marginBottom: 8,
  },
  textoInfo: {
    color: theme.colors.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 6,
  },
  btnPagina: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 2,
  },
  btnDeshabilitado: {
    opacity: 0.35,
  },
  textoBtn: {
    color: theme.colors.foreground,
    fontSize: 11,
    fontWeight: '500',
  },
  instruccion: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  hojaPdf: {
    width: 250,
    height: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lineaSimulada: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 12,
    width: '100%',
  },
  cajaArrastrable: {
    position: 'absolute',
    borderRadius: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  cajaFirma: {
    backgroundColor: 'rgba(219, 234, 254, 0.95)',
    borderColor: '#0284C7',
  },
  cajaNota: {
    backgroundColor: 'rgba(254, 240, 138, 0.95)',
    borderColor: '#D97706',
  },
  filaEtiquetaCaja: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textoCaja: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtextoCaja: {
    fontSize: 9,
    color: '#475569',
  },
});

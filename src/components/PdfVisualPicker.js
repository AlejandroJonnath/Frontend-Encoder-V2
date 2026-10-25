import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  TouchableOpacity
} from 'react-native';

/**
 * Previsualizador interactivo para ubicar la firma o nota sobre la página del documento
 */
export default function PdfVisualPicker({
  totalPaginas = 1,
  paginaActual = 1,
  alCambiarPagina,
  alCambiarPosicion,
  tipo = 'firma', // 'firma' o 'nota'
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
        // Delimitar dentro del contenedor visual de la página
        const nuevaX = Math.max(10, Math.min(gestureState.moveX - 100, 240 - anchoCaja));
        const nuevaY = Math.max(10, Math.min(gestureState.moveY - 260, 340 - altoCaja));

        setPosX(nuevaX);
        setPosY(nuevaY);

        if (alCambiarPosicion) {
          // Escalar a coordenadas reales de PDF (A4 = 595 x 842 puntos)
          const factorX = 595 / 240;
          const factorY = 842 / 340;
          alCambiarPosicion({
            x: Math.round(nuevaX * factorX),
            y: Math.round((340 - nuevaY - altoCaja) * factorY), // Sistema cartesiano de PDF
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
          >
            <Text style={estilos.textoBtn}>◀ Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[estilos.btnPagina, paginaActual >= totalPaginas && estilos.btnDeshabilitado]}
            disabled={paginaActual >= totalPaginas}
            onPress={() => alCambiarPagina && alCambiarPagina(paginaActual + 1)}
          >
            <Text style={estilos.textoBtn}>Siguiente ▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={estilos.instruccion}>
        🖐️ Arrastra el recuadro para definir la posición exacta en el PDF:
      </Text>

      {/* Hoja de papel simulada (A4 aspect ratio) */}
      <View style={estilos.hojaPdf}>
        {/* Líneas simuladas de texto del documento */}
        <View style={estilos.lineaSimulada} />
        <View style={[estilos.lineaSimulada, { width: '80%' }]} />
        <View style={[estilos.lineaSimulada, { width: '90%' }]} />
        <View style={[estilos.lineaSimulada, { width: '60%' }]} />

        {/* Elemento arrastrable (Firma o Nota) */}
        <View
          {...panResponder.panHandlers}
          style={[
            estilos.cajaArrastrable,
            tipo === 'firma' ? estilos.cajaFirma : estilos.cajaNota,
            { left: posX, top: posY, width: anchoCaja, height: altoCaja }
          ]}
        >
          <Text style={estilos.textoCaja}>
            {tipo === 'firma' ? '🖋️ ' : '📝 '}
            {tituloEtiqueta}
          </Text>
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
    width: 260,
    marginBottom: 8,
  },
  textoInfo: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: 'bold',
  },
  filaBotones: {
    flexDirection: 'row',
  },
  btnPagina: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  btnDeshabilitado: {
    opacity: 0.4,
  },
  textoBtn: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  instruccion: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  hojaPdf: {
    width: 250,
    height: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#64748B',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
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
    backgroundColor: 'rgba(219, 234, 254, 0.9)',
    borderColor: '#2563EB',
  },
  cajaNota: {
    backgroundColor: 'rgba(254, 240, 138, 0.95)',
    borderColor: '#CA8A04',
  },
  textoCaja: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtextoCaja: {
    fontSize: 9,
    color: '#475569',
  },
});

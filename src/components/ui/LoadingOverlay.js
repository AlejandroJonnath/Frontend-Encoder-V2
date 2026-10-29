import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/shadcn';

/**
 * Overlay modal de progreso con barra horizontal personalizable y opción de cancelación
 *
 * @param {boolean} visible - Visibilidad del modal
 * @param {string} mensaje - Mensaje principal de estado
 * @param {string} [submensaje] - Mensaje secundario explicativo
 * @param {number|null} [progreso] - Valor numérico de progreso (0 a 100). Si es null/undefined se anima de forma indeterminada
 * @param {() => void} [onCancelar] - Callback invocado si el usuario decide cancelar la operación
 * @param {boolean} [cancelando] - Estado de cancelación en progreso
 */
export function LoadingOverlay({
  visible = false,
  mensaje = 'Procesando archivo...',
  submensaje = 'Por favor no cierres la aplicación',
  progreso = null,
  onCancelar = null,
  cancelando = false
}) {
  const animProgreso = useRef(new Animated.Value(0)).current;
  const animIndeterminado = useRef(new Animated.Value(0)).current;
  const animacionLoopRef = useRef(null);

  // Animación del progreso determinado (0 a 100)
  useEffect(() => {
    if (progreso !== null && progreso !== undefined) {
      const valorSeguro = Math.max(0, Math.min(100, progreso));
      Animated.timing(animProgreso, {
        toValue: valorSeguro,
        duration: 250,
        useNativeDriver: false
      }).start();
    }
  }, [progreso]);

  // Animación de la barra cuando el progreso es indeterminado
  useEffect(() => {
    if (visible && (progreso === null || progreso === undefined)) {
      animIndeterminado.setValue(0);
      animacionLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(animIndeterminado, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false
          }),
          Animated.timing(animIndeterminado, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: false
          })
        ])
      );
      animacionLoopRef.current.start();
    } else {
      if (animacionLoopRef.current) {
        animacionLoopRef.current.stop();
      }
    }

    return () => {
      if (animacionLoopRef.current) {
        animacionLoopRef.current.stop();
      }
    };
  }, [visible, progreso]);

  if (!visible) return null;

  const esDeterminado = progreso !== null && progreso !== undefined;
  const porcentajeVisual = esDeterminado ? Math.max(0, Math.min(100, Math.round(progreso))) : null;

  const anchoBarraInterpolado = esDeterminado
    ? animProgreso.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
      })
    : animIndeterminado.interpolate({
        inputRange: [0, 1],
        outputRange: ['15%', '85%']
      });

  const posicionIzquierdaIndeterminada = esDeterminado
    ? '0%'
    : animIndeterminado.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '40%']
      });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={estilos.fondo}>
        <View style={estilos.tarjeta}>
          <View style={estilos.iconoEncabezado}>
            <Feather name="zap" size={20} color={theme.colors.ring} />
          </View>

          <Text style={estilos.texto} numberOfLines={2}>{mensaje}</Text>

          {/* Barra de progreso horizontal */}
          <View style={estilos.contenedorProgreso}>
            <View style={estilos.filaProgreso}>
              <Text style={estilos.etiquetaProgreso}>Progreso</Text>
              {esDeterminado && (
                <Text style={estilos.valorPorcentaje}>{porcentajeVisual}%</Text>
              )}
            </View>

            <View style={estilos.pistaBarra}>
              <Animated.View
                style={[
                  estilos.rellenoBarra,
                  {
                    width: anchoBarraInterpolado,
                    left: posicionIzquierdaIndeterminada
                  }
                ]}
              />
            </View>
          </View>

          <Text style={estilos.subtexto}>{submensaje}</Text>

          {/* Botón de Cancelar operación */}
          {onCancelar && (
            <TouchableOpacity
              style={[estilos.btnCancelar, cancelando && estilos.btnCancelarDeshabilitado]}
              onPress={onCancelar}
              disabled={cancelando}
              activeOpacity={0.7}
            >
              <Feather name="x-circle" size={15} color={theme.colors.destructive} style={{ marginRight: 6 }} />
              <Text style={estilos.textoBtnCancelar}>
                {cancelando ? 'Cancelando...' : 'Cancelar operación'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  tarjeta: {
    width: '88%',
    maxWidth: 340,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  iconoEncabezado: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  texto: {
    ...theme.typography.h3,
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  contenedorProgreso: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  filaProgreso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  etiquetaProgreso: {
    ...theme.typography.label,
    color: theme.colors.mutedForeground,
  },
  valorPorcentaje: {
    ...theme.typography.small,
    fontWeight: '700',
    color: theme.colors.ring,
  },
  pistaBarra: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rellenoBarra: {
    height: '100%',
    backgroundColor: theme.colors.ring,
    borderRadius: theme.radius.full,
  },
  subtexto: {
    ...theme.typography.small,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  btnCancelar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  btnCancelarDeshabilitado: {
    opacity: 0.5,
  },
  textoBtnCancelar: {
    ...theme.typography.small,
    color: theme.colors.destructive,
    fontWeight: '600',
  },
});

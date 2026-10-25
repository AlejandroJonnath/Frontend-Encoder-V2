import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../theme/shadcn';
import { Button } from './Button';

/**
 * Modal de Error y Alertas con diseño oficial shadcn/ui.
 * Tipos: 'contrasena' | 'campos' | 'archivo' | 'error' | 'advertencia' | 'exito'
 */
export function ErrorModal({
  visible = false,
  tipo = 'error',
  titulo = 'Error',
  mensaje = '',
  textoBoton = 'Entendido',
  onCerrar,
  onConfirmar,
  textoBotonSecundario,
  onBotonSecundario
}) {
  if (!visible) return null;

  const obtenerConfiguracionTipo = () => {
    switch (tipo) {
      case 'contrasena':
        return {
          icono: 'lock',
          colorIcono: theme.colors.destructive,
          fondoIcono: theme.colors.destructiveMuted,
          bordeIcono: 'rgba(239, 68, 68, 0.25)',
          varianteBoton: 'destructive'
        };
      case 'campos':
        return {
          icono: 'alert-circle',
          colorIcono: '#F59E0B',
          fondoIcono: 'rgba(245, 158, 11, 0.12)',
          bordeIcono: 'rgba(245, 158, 11, 0.25)',
          varianteBoton: 'default'
        };
      case 'archivo':
        return {
          icono: 'file-minus',
          colorIcono: '#38BDF8',
          fondoIcono: 'rgba(56, 189, 248, 0.12)',
          bordeIcono: 'rgba(56, 189, 248, 0.25)',
          varianteBoton: 'default'
        };
      case 'exito':
        return {
          icono: 'check-circle',
          colorIcono: theme.colors.success,
          fondoIcono: theme.colors.successMuted,
          bordeIcono: 'rgba(16, 185, 129, 0.25)',
          varianteBoton: 'default'
        };
      case 'advertencia':
        return {
          icono: 'alert-triangle',
          colorIcono: '#F59E0B',
          fondoIcono: 'rgba(245, 158, 11, 0.12)',
          bordeIcono: 'rgba(245, 158, 11, 0.25)',
          varianteBoton: 'default'
        };
      case 'error':
      default:
        return {
          icono: 'alert-octagon',
          colorIcono: theme.colors.destructive,
          fondoIcono: theme.colors.destructiveMuted,
          bordeIcono: 'rgba(239, 68, 68, 0.25)',
          varianteBoton: 'destructive'
        };
    }
  };

  const config = obtenerConfiguracionTipo();

  const manejarBotonPrincipal = () => {
    if (onConfirmar) {
      onConfirmar();
    } else if (onCerrar) {
      onCerrar();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCerrar}
    >
      <TouchableWithoutFeedback onPress={onCerrar}>
        <View style={estilos.overlay}>
          <TouchableWithoutFeedback>
            <View style={estilos.dialogo}>
              {/* Botón X de cierre en esquina */}
              <TouchableOpacity
                style={estilos.btnCerrarEsquina}
                onPress={onCerrar}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color={theme.colors.mutedForeground} />
              </TouchableOpacity>

              {/* Icono con halo sutil */}
              <View
                style={[
                  estilos.iconoContenedor,
                  {
                    backgroundColor: config.fondoIcono,
                    borderColor: config.bordeIcono
                  }
                ]}
              >
                <Feather name={config.icono} size={24} color={config.colorIcono} />
              </View>

              {/* Título y Mensaje */}
              <Text style={estilos.titulo}>{titulo}</Text>
              <Text style={estilos.mensaje}>{mensaje}</Text>

              {/* Botones de Acción */}
              <View style={estilos.acciones}>
                <Button
                  variant={config.varianteBoton}
                  size="default"
                  onPress={manejarBotonPrincipal}
                  style={estilos.botonPrincipal}
                >
                  {textoBoton}
                </Button>

                {textoBotonSecundario && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={onBotonSecundario}
                    style={estilos.botonSecundario}
                  >
                    {textoBotonSecundario}
                  </Button>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogo: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  btnCerrarEsquina: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconoContenedor: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.foreground,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  mensaje: {
    fontSize: 13,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  acciones: {
    width: '100%',
    gap: 8,
  },
  botonPrincipal: {
    width: '100%',
  },
  botonSecundario: {
    width: '100%',
  },
});

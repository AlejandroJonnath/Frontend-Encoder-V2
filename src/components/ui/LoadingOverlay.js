import React from 'react';
import { View, Text, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../theme/shadcn';

/**
 * Overlay modal de carga no cancelable para operaciones de red y archivos pesados
 */
export function LoadingOverlay({ visible = false, mensaje = 'Procesando archivo...' }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={estilos.fondo}>
        <View style={estilos.tarjeta}>
          <ActivityIndicator size="large" color={theme.colors.ring} />
          <Text style={estilos.texto}>{mensaje}</Text>
          <Text style={estilos.subtexto}>Por favor no cierres la aplicación</Text>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  tarjeta: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  texto: {
    ...theme.typography.h3,
    color: theme.colors.foreground,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  subtexto: {
    ...theme.typography.small,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

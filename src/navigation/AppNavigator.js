import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { OperationNavigator } from './OperationNavigator';
import { theme } from '../theme/shadcn';

/**
 * Orquestador principal de navegación y guardián de autenticación.
 * Garantiza que ninguna pantalla de operaciones sea montada o accesible sin sesión válida.
 */
export function AppNavigator() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={estilos.cargandoContenedor}>
        <ActivityIndicator size="large" color={theme.colors.ring} />
      </View>
    );
  }

  // Si no hay usuario autenticado, renderizar exclusivamente el flujo de autenticación
  if (!usuario) {
    return <AuthNavigator />;
  }

  // Si el usuario está autenticado, renderizar el flujo de operaciones
  return <OperationNavigator />;
}

const estilos = StyleSheet.create({
  cargandoContenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { StyleSheet } from 'react-native';
import { theme } from './shadcn';

/**
 * Estilos globales utilitarios y patrones recurrentes de la interfaz
 */
export const globalStyles = StyleSheet.create({
  // Contenedores flex básicos
  centrado: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filaCentro: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filaEntre: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Área de trabajo de pantalla
  pantallaContenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContenido: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },

  // Tarjetas y Superficies
  tarjeta: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tarjetaElevada: {
    backgroundColor: theme.colors.cardHover,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    padding: theme.spacing.lg,
  },

  // Zona de Selección de Archivos (Dropzone simulada)
  zonaSeleccion: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.inputBackground,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },

  // Textos y etiquetas
  textoMuted: {
    color: theme.colors.mutedForeground,
    fontSize: 13,
  },
  textoTitulo: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.xs,
  },
  textoDescripcion: {
    ...theme.typography.body,
    marginBottom: theme.spacing.md,
  },
});

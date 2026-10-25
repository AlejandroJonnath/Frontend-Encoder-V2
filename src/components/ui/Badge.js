import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/shadcn';

/**
 * Variantes: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'accent'
 */
export function Badge({ children, variant = 'default', style, textStyle, ...props }) {
  const getVarianteEstilo = () => {
    switch (variant) {
      case 'secondary':
        return {
          caja: estilos.badgeSecondary,
          texto: estilos.textoSecondary,
        };
      case 'outline':
        return {
          caja: estilos.badgeOutline,
          texto: estilos.textoOutline,
        };
      case 'destructive':
        return {
          caja: estilos.badgeDestructive,
          texto: estilos.textoDestructive,
        };
      case 'success':
        return {
          caja: estilos.badgeSuccess,
          texto: estilos.textoSuccess,
        };
      case 'accent':
        return {
          caja: estilos.badgeAccent,
          texto: estilos.textoAccent,
        };
      case 'default':
      default:
        return {
          caja: estilos.badgeDefault,
          texto: estilos.textoDefault,
        };
    }
  };

  const { caja, texto } = getVarianteEstilo();

  return (
    <View style={[estilos.base, caja, style]} {...props}>
      <Text style={[estilos.textoBase, texto, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  textoBase: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  badgeDefault: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  textoDefault: {
    color: theme.colors.primaryForeground,
  },
  badgeSecondary: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.border,
  },
  textoSecondary: {
    color: theme.colors.secondaryForeground,
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  textoOutline: {
    color: theme.colors.mutedForeground,
  },
  badgeDestructive: {
    backgroundColor: theme.colors.destructiveMuted,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  textoDestructive: {
    color: theme.colors.destructive,
  },
  badgeSuccess: {
    backgroundColor: theme.colors.successMuted,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  textoSuccess: {
    color: theme.colors.success,
  },
  badgeAccent: {
    backgroundColor: theme.colors.accentMuted,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  textoAccent: {
    color: theme.colors.ring,
  },
});

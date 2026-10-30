import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../theme/shadcn';

/**
 * Variantes: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
 * Tamaños: 'default' | 'sm' | 'lg' | 'icon'
 */
export function Button({
  children,
  variant = 'default',
  size = 'default',
  cargando = false,
  disabled = false,
  icon,
  style,
  textStyle,
  ...props
}) {
  const getVarianteEstilo = () => {
    switch (variant) {
      case 'secondary':
        return {
          caja: estilos.btnSecondary,
          texto: estilos.textoSecondary,
          spinnerColor: theme.colors.secondaryForeground,
        };
      case 'outline':
        return {
          caja: estilos.btnOutline,
          texto: estilos.textoOutline,
          spinnerColor: theme.colors.foreground,
        };
      case 'ghost':
        return {
          caja: estilos.btnGhost,
          texto: estilos.textoGhost,
          spinnerColor: theme.colors.foreground,
        };
      case 'destructive':
        return {
          caja: estilos.btnDestructive,
          texto: estilos.textoDestructive,
          spinnerColor: '#FFFFFF',
        };
      case 'default':
      default:
        return {
          caja: estilos.btnDefault,
          texto: estilos.textoDefault,
          spinnerColor: theme.colors.primaryForeground,
        };
    }
  };

  const getTamanoEstilo = () => {
    switch (size) {
      case 'sm':
        return estilos.tamanoSm;
      case 'lg':
        return estilos.tamanoLg;
      case 'icon':
        return estilos.tamanoIcon;
      case 'default':
      default:
        return estilos.tamanoDefault;
    }
  };

  const { caja, texto, spinnerColor } = getVarianteEstilo();
  const tamano = getTamanoEstilo();

  return (
    <TouchableOpacity
      style={[
        estilos.base,
        caja,
        tamano,
        (disabled || cargando) && estilos.deshabilitado,
        style,
      ]}
      disabled={disabled || cargando}
      activeOpacity={0.75}
      {...props}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon && <>{icon}</>}
          {React.isValidElement(children) ? (
            children
          ) : (
            <Text style={[estilos.textoBase, texto, icon && { marginLeft: 8 }, textStyle]}>
              {children}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deshabilitado: {
    opacity: 0.5,
  },
  textoBase: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  // Tamaños
  tamanoDefault: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tamanoSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tamanoLg: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  tamanoIcon: {
    width: 40,
    height: 40,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Variantes
  btnDefault: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  textoDefault: {
    color: theme.colors.primaryForeground,
  },
  btnSecondary: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.border,
  },
  textoSecondary: {
    color: theme.colors.secondaryForeground,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
  },
  textoOutline: {
    color: theme.colors.foreground,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  textoGhost: {
    color: theme.colors.mutedForeground,
  },
  btnDestructive: {
    backgroundColor: theme.colors.destructive,
    borderColor: theme.colors.destructive,
  },
  textoDestructive: {
    color: theme.colors.destructiveForeground,
  },
});

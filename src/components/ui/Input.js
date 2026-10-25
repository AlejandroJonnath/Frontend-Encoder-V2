import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '../../theme/shadcn';

export function Input({
  label,
  description,
  error,
  style,
  inputStyle,
  ...props
}) {
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={[estilos.contenedor, style]}>
      {label && <Text style={estilos.etiqueta}>{label}</Text>}
      <TextInput
        style={[
          estilos.input,
          enfocado && estilos.inputEnfocado,
          error && estilos.inputError,
          inputStyle,
        ]}
        placeholderTextColor={theme.colors.mutedForeground}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        {...props}
      />
      {description && !error && (
        <Text style={estilos.descripcion}>{description}</Text>
      )}
      {error && <Text style={estilos.error}>{error}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    width: '100%',
    marginBottom: 16,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  inputEnfocado: {
    borderColor: theme.colors.ring,
  },
  inputError: {
    borderColor: theme.colors.destructive,
  },
  descripcion: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: theme.colors.destructive,
    marginTop: 4,
  },
});

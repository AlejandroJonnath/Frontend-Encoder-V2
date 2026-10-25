import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/shadcn';

export function Card({ style, children, ...props }) {
  return (
    <View style={[estilos.card, style]} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ style, children, ...props }) {
  return (
    <View style={[estilos.header, style]} {...props}>
      {children}
    </View>
  );
}

export function CardTitle({ style, children, ...props }) {
  return (
    <Text style={[estilos.titulo, style]} {...props}>
      {children}
    </Text>
  );
}

export function CardDescription({ style, children, ...props }) {
  return (
    <Text style={[estilos.descripcion, style]} {...props}>
      {children}
    </Text>
  );
}

export function CardContent({ style, children, ...props }) {
  return (
    <View style={[estilos.contenido, style]} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ style, children, ...props }) {
  return (
    <View style={[estilos.footer, style]} {...props}>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    marginBottom: 10,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.foreground,
    letterSpacing: -0.2,
  },
  descripcion: {
    fontSize: 13,
    color: theme.colors.mutedForeground,
    lineHeight: 18,
    marginTop: 4,
  },
  contenido: {
    marginTop: 4,
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
});

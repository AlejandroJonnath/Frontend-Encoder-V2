import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme/shadcn';

export function Separator({ orientation = 'horizontal', style, ...props }) {
  return (
    <View
      style={[
        orientation === 'horizontal' ? estilos.horizontal : estilos.vertical,
        style,
      ]}
      {...props}
    />
  );
}

const estilos = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  vertical: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
});

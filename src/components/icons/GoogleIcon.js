import React from 'react';
import { AntDesign } from '@expo/vector-icons';
import { theme } from '../../theme/shadcn';

export default function GoogleIcon({ size = 18, color = theme.colors.foreground, style }) {
  return (
    <AntDesign
      name="google"
      size={size}
      color={color}
      style={style}
    />
  );
}

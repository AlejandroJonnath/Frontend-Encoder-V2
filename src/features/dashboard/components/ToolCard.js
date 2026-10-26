import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../../theme/shadcn';
import { Badge } from '../../../components/ui/Badge';

/**
 * Tarjeta reutilizable de herramienta para el HomeScreen.
 * Soporta dos variantes: `fullWidth` (fila completa) y grid (2 columnas).
 */
function IconoHerramienta({ item, tamano = 20 }) {
  if (item.familiaIcono === 'mci') {
    return <MaterialCommunityIcons name={item.icono} size={tamano} color={item.colorIcono || theme.colors.foreground} />;
  }
  return <Feather name={item.icono} size={tamano} color={item.colorIcono || theme.colors.foreground} />;
}

export default function ToolCard({ item, onPress }) {
  if (item.fullWidth) {
    return (
      <TouchableOpacity style={estilos.tarjetaAncha} onPress={onPress} activeOpacity={0.7}>
        <View style={[estilos.iconoCajaAncha, item.fondoIcono && { backgroundColor: item.fondoIcono, borderColor: item.bordeIcono }]}>
          <IconoHerramienta item={item} tamano={22} />
        </View>
        <View style={estilos.infoAncha}>
          <Text style={estilos.tituloAncho}>{item.titulo}</Text>
          <Badge variant={item.varianteBadge || 'secondary'}>{item.etiqueta}</Badge>
        </View>
        <Feather name="chevron-right" size={16} color={theme.colors.mutedForeground} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={estilos.tarjetaGrid} onPress={onPress} activeOpacity={0.7}>
      <View style={estilos.filaTopGrid}>
        <View style={[estilos.iconoCajaGrid, item.fondoIcono && { backgroundColor: item.fondoIcono, borderColor: item.bordeIcono }]}>
          <IconoHerramienta item={item} tamano={20} />
        </View>
        <Badge variant={item.varianteBadge || 'secondary'}>{item.etiqueta}</Badge>
      </View>
      <View style={estilos.filaBottomGrid}>
        <Text style={estilos.tituloGrid} numberOfLines={2}>{item.titulo}</Text>
        <Feather name="chevron-right" size={14} color={theme.colors.mutedForeground} style={{ alignSelf: 'flex-end' }} />
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  // Grid (2 columnas)
  tarjetaGrid: {
    width: '48.5%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'space-between',
    minHeight: 105,
  },
  filaTopGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconoCajaGrid: {
    width: 38, height: 38, borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary, borderWidth: 1,
    borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center',
  },
  filaBottomGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tituloGrid: { fontSize: 13, fontWeight: '600', color: theme.colors.foreground, letterSpacing: -0.2, flex: 1, marginRight: 4 },

  // Ancho completo (fila)
  tarjetaAncha: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoCajaAncha: {
    width: 42, height: 42, borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary, borderWidth: 1,
    borderColor: theme.colors.border, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  infoAncha: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tituloAncho: { fontSize: 14, fontWeight: '600', color: theme.colors.foreground, letterSpacing: -0.2 },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { theme } from '../theme/shadcn';

/**
 * Contenedor maestro con estética inspirada en shadcn/ui.
 * Garantiza safe area y encabezado limpio y minimalista.
 */
export default function ScreenContainer({
  children,
  titulo,
  subtitulo,
  iconoTitulo,
  onVolver,
  botonDerecho,
  estiloContenido
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      estilos.contenedor,
      {
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: Math.max(insets.bottom, 10)
      }
    ]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} translucent />

      {/* Barra de Navegación Superior */}
      {(titulo || onVolver) && (
        <View style={estilos.header}>
          <View style={estilos.headerIzquierda}>
            {onVolver && (
              <TouchableOpacity
                style={estilos.btnVolver}
                onPress={onVolver}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Feather name="chevron-left" size={18} color={theme.colors.foreground} />
                <Text style={estilos.textoVolver}>Atrás</Text>
              </TouchableOpacity>
            )}

            {titulo && (
              <View style={estilos.titulosHeader}>
                <View style={estilos.filaTitulo}>
                  {iconoTitulo && (
                    typeof iconoTitulo === 'string' ? (
                      <Text style={estilos.iconoHeader}>{iconoTitulo}</Text>
                    ) : (
                      <View style={estilos.iconoHeaderWrapper}>{iconoTitulo}</View>
                    )
                  )}
                  <Text style={estilos.tituloPrincipal} numberOfLines={1}>{titulo}</Text>
                </View>
                {subtitulo && <Text style={estilos.subtituloHeader} numberOfLines={1}>{subtitulo}</Text>}
              </View>
            )}
          </View>

          {botonDerecho && (
            <View style={estilos.headerDerecha}>
              {botonDerecho}
            </View>
          )}
        </View>
      )}

      {/* Contenido de la Pantalla */}
      <View style={[estilos.cuerpo, estiloContenido]}>
        {children}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerIzquierda: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.md,
    marginRight: 12,
  },
  textoVolver: {
    color: theme.colors.foreground,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
  },
  titulosHeader: {
    flex: 1,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoHeader: {
    fontSize: 17,
    marginRight: 8,
  },
  iconoHeaderWrapper: {
    marginRight: 8,
  },
  tituloPrincipal: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.foreground,
    letterSpacing: -0.3,
  },
  subtituloHeader: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 1,
  },
  headerDerecha: {
    marginLeft: 10,
  },
  cuerpo: {
    flex: 1,
  },
});

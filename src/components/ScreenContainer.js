import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Contenedor maestro que garantiza que ninguna vista quede tapada
 * por la barra de estado / notificaciones arriba, ni por los botones táctiles abajo.
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
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom, 12)
      }
    ]}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" translucent />

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
                <Text style={estilos.flechaVolver}>‹</Text>
                <Text style={estilos.textoVolver}>Atrás</Text>
              </TouchableOpacity>
            )}

            {titulo && (
              <View style={estilos.titulosHeader}>
                <View style={estilos.filaTitulo}>
                  {iconoTitulo && <Text style={estilos.iconoHeader}>{iconoTitulo}</Text>}
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
    backgroundColor: '#090D16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: '#0B1120',
  },
  headerIzquierda: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  flechaVolver: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 4,
    marginTop: -2,
  },
  textoVolver: {
    color: '#E0F2FE',
    fontSize: 13,
    fontWeight: '600',
  },
  titulosHeader: {
    flex: 1,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoHeader: {
    fontSize: 18,
    marginRight: 6,
  },
  tituloPrincipal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  subtituloHeader: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  headerDerecha: {
    marginLeft: 10,
  },
  cuerpo: {
    flex: 1,
  },
});

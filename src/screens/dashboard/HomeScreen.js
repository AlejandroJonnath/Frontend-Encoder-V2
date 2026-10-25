import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme/shadcn';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function HomeScreen({ onNavegar }) {
  const { usuario, perfil, cerrarSesion } = useAuth();

  const nombreUsuario = perfil?.first_name || usuario?.email?.split('@')[0] || 'Usuario';

  const secciones = [
    {
      titulo: 'Seguridad Legal & Firma Digital',
      items: [
        {
          id: 'firmar',
          titulo: 'Firmar con .p12 (FirmaEC)',
          icono: 'shield',
          etiqueta: 'PAdES Ecuador',
          varianteBadge: 'accent',
          fullWidth: true
        }
      ]
    },
    {
      titulo: 'Herramientas de Conversión a PDF',
      items: [
        {
          id: 'convert_word',
          titulo: 'Word a PDF',
          icono: 'file-text',
          etiqueta: 'DOCX / DOC',
          varianteBadge: 'secondary',
        },
        {
          id: 'convert_excel',
          titulo: 'Excel a PDF',
          icono: 'grid',
          etiqueta: 'XLSX / XLS',
          varianteBadge: 'secondary',
        },
        {
          id: 'convert_ppt',
          titulo: 'PowerPoint a PDF',
          icono: 'monitor',
          etiqueta: 'PPTX / PPT',
          varianteBadge: 'secondary',
        },
        {
          id: 'convert_txt',
          titulo: 'Bloc de notas a PDF',
          icono: 'align-left',
          etiqueta: 'TXT',
          varianteBadge: 'secondary',
        },
        {
          id: 'convert_image',
          titulo: 'Imágenes a PDF',
          icono: 'image',
          etiqueta: 'PNG / JPG',
          varianteBadge: 'secondary',
        }
      ]
    },
    {
      titulo: 'Optimización & Edición de PDF',
      items: [
        {
          id: 'comprimir',
          titulo: 'Comprimir PDF',
          icono: 'minimize-2',
          etiqueta: 'Hasta 2GB',
          varianteBadge: 'success',
        },
        {
          id: 'unir',
          titulo: 'Unir PDFs',
          icono: 'layers',
          etiqueta: 'Merge',
          varianteBadge: 'secondary',
        },
        {
          id: 'notas',
          titulo: 'Notas en PDF',
          icono: 'edit-3',
          etiqueta: 'Anotaciones',
          varianteBadge: 'secondary',
        }
      ]
    },
    {
      titulo: 'Inteligencia Artificial',
      items: [
        {
          id: 'ia',
          titulo: 'Groq AI (Resumen y Traductor)',
          icono: 'cpu',
          etiqueta: 'Groq LPU',
          varianteBadge: 'accent',
          fullWidth: true
        }
      ]
    }
  ];

  return (
    <ScreenContainer
      titulo="EncoderGoti"
      subtitulo={`Hola, ${nombreUsuario}`}
      iconoTitulo={
        <Image
          source={require('../../img/Logo.png')}
          style={estilos.logoHeader}
          resizeMode="contain"
        />
      }
      botonDerecho={
        <Button
          variant="outline"
          size="sm"
          onPress={cerrarSesion}
          icon={<Feather name="log-out" size={13} color={theme.colors.mutedForeground} />}
        >
          Salir
        </Button>
      }
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Estado del Motor */}
        <View style={estilos.banner}>
          <View style={estilos.bannerHeader}>
            <View style={estilos.bannerMarca}>
              <Text style={estilos.bannerTitulo}>EncoderGoti</Text>
            </View>
            <Badge variant="accent">MOTOR ACTIVO</Badge>
          </View>
          <Text style={estilos.bannerDesc}>
            Suite integral de procesamiento seguro de documentos, firma electrónica FirmaEC PAdES y compresión de alto rendimiento.
          </Text>
        </View>

        {/* Secciones de Herramientas */}
        {secciones.map((sec, secIdx) => (
          <View key={secIdx} style={estilos.seccionContenedor}>
            <View style={estilos.encabezadoSeccion}>
              <Text style={estilos.tituloSeccion}>{sec.titulo}</Text>
            </View>

            <View style={estilos.gridHerramientas}>
              {sec.items.map((item) => {
                if (item.fullWidth) {
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={estilos.tarjetaAncha}
                      onPress={() => onNavegar(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={estilos.iconoCajaAncha}>
                        <Feather name={item.icono} size={20} color={theme.colors.foreground} />
                      </View>
                      <View style={estilos.infoAncha}>
                        <Text style={estilos.tituloAncho}>{item.titulo}</Text>
                        <Badge variant={item.varianteBadge || 'secondary'}>
                          {item.etiqueta}
                        </Badge>
                      </View>
                      <Feather
                        name="chevron-right"
                        size={16}
                        color={theme.colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={estilos.tarjetaGrid}
                    onPress={() => onNavegar(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={estilos.filaTopGrid}>
                      <View style={estilos.iconoCajaGrid}>
                        <Feather name={item.icono} size={18} color={theme.colors.foreground} />
                      </View>
                      <Badge variant={item.varianteBadge || 'secondary'}>
                        {item.etiqueta}
                      </Badge>
                    </View>

                    <View style={estilos.filaBottomGrid}>
                      <Text style={estilos.tituloGrid} numberOfLines={2}>
                        {item.titulo}
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={theme.colors.mutedForeground}
                        style={{ alignSelf: 'flex-end' }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  logoHeader: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    padding: 16,
    paddingTop: 14,
  },
  banner: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 22,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerMarca: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTitulo: {
    color: theme.colors.foreground,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  bannerDesc: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
  seccionContenedor: {
    marginBottom: 20,
  },
  encabezadoSeccion: {
    marginBottom: 10,
  },
  tituloSeccion: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.foreground,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  gridHerramientas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  // Bloque formato Grid (2 columnas)
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
  filaTopGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconoCajaGrid: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filaBottomGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tituloGrid: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.foreground,
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 4,
  },
  // Bloque formato Ancho Completo (para herramientas singulares)
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
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoAncha: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tituloAncho: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.foreground,
    letterSpacing: -0.2,
  },
});

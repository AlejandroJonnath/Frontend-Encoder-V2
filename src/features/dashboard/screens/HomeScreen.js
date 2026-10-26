import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ScreenContainer';
import { useAuth } from '../../../context/AuthContext';
import { theme } from '../../../theme/shadcn';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import ToolCard from '../components/ToolCard';

const SECCIONES = [
  {
    titulo: 'Seguridad Legal & Firma Digital',
    items: [
      {
        id: 'firmar',
        titulo: 'Firmar con .p12 (FirmaEC)',
        icono: 'shield',
        colorIcono: '#38BDF8',
        fondoIcono: 'rgba(56, 189, 248, 0.12)',
        bordeIcono: 'rgba(56, 189, 248, 0.25)',
        etiqueta: 'PAdES Ecuador',
        varianteBadge: 'accent',
        fullWidth: true,
      },
    ],
  },
  {
    titulo: 'Herramientas de Conversión a PDF',
    items: [
      { id: 'convert_word',  titulo: 'Word a PDF',        icono: 'microsoft-word',            familiaIcono: 'mci', colorIcono: '#60A5FA', fondoIcono: 'rgba(37, 99, 235, 0.14)',   bordeIcono: 'rgba(37, 99, 235, 0.3)',   etiqueta: 'Word',      varianteBadge: 'secondary' },
      { id: 'convert_excel', titulo: 'Excel a PDF',       icono: 'microsoft-excel',           familiaIcono: 'mci', colorIcono: '#34D399', fondoIcono: 'rgba(16, 185, 129, 0.14)', bordeIcono: 'rgba(16, 185, 129, 0.3)', etiqueta: 'Excel',     varianteBadge: 'secondary' },
      { id: 'convert_ppt',   titulo: 'PowerPoint a PDF',  icono: 'microsoft-powerpoint',      familiaIcono: 'mci', colorIcono: '#FB923C', fondoIcono: 'rgba(234, 88, 12, 0.14)',  bordeIcono: 'rgba(234, 88, 12, 0.3)',  etiqueta: 'PowerPoint',varianteBadge: 'secondary' },
      { id: 'convert_txt',   titulo: 'Bloc de notas a PDF',icono: 'file-document-outline',    familiaIcono: 'mci', colorIcono: '#CBD5E1', fondoIcono: 'rgba(148, 163, 184, 0.14)',bordeIcono: 'rgba(148, 163, 184, 0.3)',etiqueta: 'TXT',       varianteBadge: 'secondary' },
      { id: 'convert_image', titulo: 'Imágenes a PDF',    icono: 'image-multiple-outline',    familiaIcono: 'mci', colorIcono: '#F472B6', fondoIcono: 'rgba(236, 72, 153, 0.14)', bordeIcono: 'rgba(236, 72, 153, 0.3)', etiqueta: 'JPG / PNG', varianteBadge: 'secondary' },
    ],
  },
  {
    titulo: 'Optimización & Edición de PDF',
    items: [
      { id: 'comprimir', titulo: 'Comprimir PDF', icono: 'minimize-2', colorIcono: '#34D399', fondoIcono: 'rgba(16, 185, 129, 0.12)', bordeIcono: 'rgba(16, 185, 129, 0.25)', etiqueta: 'Hasta 2GB',    varianteBadge: 'success' },
      { id: 'unir',      titulo: 'Unir PDFs',     icono: 'layers',     colorIcono: '#A78BFA', fondoIcono: 'rgba(139, 92, 246, 0.12)', bordeIcono: 'rgba(139, 92, 246, 0.25)', etiqueta: 'Merge',        varianteBadge: 'secondary' },
      { id: 'notas',     titulo: 'Notas en PDF',  icono: 'edit-3',     colorIcono: '#FBBF24', fondoIcono: 'rgba(245, 158, 11, 0.12)', bordeIcono: 'rgba(245, 158, 11, 0.25)', etiqueta: 'Anotaciones',  varianteBadge: 'secondary' },
    ],
  },
  {
    titulo: 'Inteligencia Artificial',
    items: [
      { id: 'ia', titulo: 'Groq AI (Resumen y Traductor)', icono: 'cpu', colorIcono: '#818CF8', fondoIcono: 'rgba(99, 102, 241, 0.12)', bordeIcono: 'rgba(99, 102, 241, 0.25)', etiqueta: 'Groq LPU', varianteBadge: 'accent', fullWidth: true },
    ],
  },
];

export default function HomeScreen({ onNavegar }) {
  const { usuario, perfil, cerrarSesion } = useAuth();
  const nombreUsuario = perfil?.first_name || usuario?.email?.split('@')[0] || 'Usuario';

  return (
    <ScreenContainer
      titulo="EncoderGoti"
      subtitulo={`Hola, ${nombreUsuario}`}
      iconoTitulo={
        <Image
          source={require('../../../img/Logo.png')}
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
            <Text style={estilos.bannerTitulo}>EncoderGoti</Text>
            <Badge variant="accent">MOTOR ACTIVO</Badge>
          </View>
          <Text style={estilos.bannerDesc}>
            Suite integral de procesamiento seguro de documentos, firma electrónica FirmaEC PAdES y compresión de alto rendimiento.
          </Text>
        </View>

        {/* Secciones de Herramientas */}
        {SECCIONES.map((sec, secIdx) => (
          <View key={secIdx} style={estilos.seccionContenedor}>
            <View style={estilos.encabezadoSeccion}>
              <Text style={estilos.tituloSeccion}>{sec.titulo}</Text>
            </View>
            <View style={estilos.gridHerramientas}>
              {sec.items.map((item) => (
                <ToolCard key={item.id} item={item} onPress={() => onNavegar(item.id)} />
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  logoHeader: { width: 26, height: 26, borderRadius: 6 },
  scroll: { flex: 1 },
  scrollContenido: { padding: 16, paddingTop: 14 },
  banner: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 22,
  },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bannerTitulo: { color: theme.colors.foreground, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  bannerDesc: { color: theme.colors.mutedForeground, fontSize: 12, lineHeight: 18 },
  seccionContenedor: { marginBottom: 20 },
  encabezadoSeccion: { marginBottom: 10 },
  tituloSeccion: { fontSize: 13, fontWeight: '600', color: theme.colors.foreground, letterSpacing: 0.3, textTransform: 'uppercase' },
  gridHerramientas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
});

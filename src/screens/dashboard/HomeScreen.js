import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';

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
          descripcion: 'Firma PAdES válida con certificado digital y ubicación interactiva sobre el documento',
          icono: '🖋️',
          etiqueta: 'Estándar Ecuador',
          colorAcento: '#38BDF8',
          fondoBadge: 'rgba(56, 189, 248, 0.12)'
        }
      ]
    },
    {
      titulo: 'Herramientas de Conversión a PDF',
      subtitulo: 'Cada herramienta procesa exclusivamente su tipo de documento',
      items: [
        {
          id: 'convert_word',
          titulo: 'Word a PDF',
          descripcion: 'Convierte exclusivamente documentos Word (.docx, .doc) preservando fuentes y tablas',
          icono: '📘',
          etiqueta: 'Docx / Doc',
          colorAcento: '#2563EB',
          fondoBadge: 'rgba(37, 99, 235, 0.12)'
        },
        {
          id: 'convert_excel',
          titulo: 'Excel a PDF',
          descripcion: 'Hojas de cálculo (.xlsx, .xls) con previsualización interactiva y selección de hojas',
          icono: '📊',
          etiqueta: 'Xlsx / Xls',
          colorAcento: '#10B981',
          fondoBadge: 'rgba(16, 185, 129, 0.12)'
        },
        {
          id: 'convert_ppt',
          titulo: 'PowerPoint a PDF',
          descripcion: 'Convierte presentaciones (.pptx, .ppt) asignando una diapositiva por página PDF',
          icono: '📙',
          etiqueta: 'Pptx / Ppt',
          colorAcento: '#EA580C',
          fondoBadge: 'rgba(234, 88, 12, 0.12)'
        },
        {
          id: 'convert_txt',
          titulo: 'Bloc de notas a PDF',
          descripcion: 'Archivos de texto plano (.txt) con tipografía uniforme y paginación automática',
          icono: '📄',
          etiqueta: '.TXT',
          colorAcento: '#64748B',
          fondoBadge: 'rgba(100, 116, 139, 0.12)'
        },
        {
          id: 'convert_image',
          titulo: 'PNG, JPG, JPEG a PDF',
          descripcion: 'Convierte imágenes a PDF manteniendo alta resolución y proporciones originales',
          icono: '🖼️',
          etiqueta: 'Imágenes',
          colorAcento: '#DB2777',
          fondoBadge: 'rgba(219, 39, 119, 0.12)'
        }
      ]
    },
    {
      titulo: 'Optimización & Edición de PDF',
      items: [
        {
          id: 'comprimir',
          titulo: 'Comprimir PDF',
          descripcion: 'Reduce más del 50% del tamaño para archivos de hasta 2GB sin perder legibilidad',
          icono: '🗜️',
          etiqueta: 'Hasta 2GB',
          colorAcento: '#059669',
          fondoBadge: 'rgba(5, 150, 105, 0.12)'
        },
        {
          id: 'unir',
          titulo: 'Unir Múltiples PDFs',
          descripcion: 'Combina varios documentos en el orden que elijas con compresión final integrada',
          icono: '📑',
          etiqueta: 'Merge',
          colorAcento: '#8B5CF6',
          fondoBadge: 'rgba(139, 92, 246, 0.12)'
        },
        {
          id: 'notas',
          titulo: 'Notas en PDF',
          descripcion: 'Coloca notas adhesivas interactivas arrastrándolas al lugar exacto',
          icono: '📝',
          etiqueta: 'Edición Visual',
          colorAcento: '#F59E0B',
          fondoBadge: 'rgba(245, 158, 11, 0.12)'
        }
      ]
    },
    {
      titulo: 'Inteligencia Artificial',
      items: [
        {
          id: 'ia',
          titulo: 'Groq AI (Resumen y Traductor)',
          descripcion: 'Síntesis ejecutiva y traducción en Español, Inglés, Francés, Alemán y Chino',
          icono: '🤖',
          etiqueta: 'Groq LPU',
          colorAcento: '#6366F1',
          fondoBadge: 'rgba(99, 102, 241, 0.12)'
        }
      ]
    }
  ];

  return (
    <ScreenContainer
      titulo={`¡Hola, ${nombreUsuario}!`}
      subtitulo="Plataforma de Operaciones PDF & FirmaEC"
      iconoTitulo="📄"
      botonDerecho={
        <TouchableOpacity style={estilos.btnCerrarSesion} onPress={cerrarSesion} activeOpacity={0.7}>
          <Text style={estilos.textoCerrarSesion}>Cerrar Sesión</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Bienvenida y Estado del Motor */}
        <View style={estilos.bannerPro}>
          <View style={estilos.bannerHeader}>
            <View style={estilos.badgePro}>
              <Text style={estilos.textoBadgePro}>MOTOR ACTIVO</Text>
            </View>
            <Text style={estilos.tagCapacidad}>Hasta 2GB • Filtros Independientes</Text>
          </View>
          <Text style={estilos.bannerTitulo}>Operaciones Documentales Seguras</Text>
          <Text style={estilos.bannerDesc}>
            Firma criptográfica PAdES validable por FirmaEC, streams de bajo consumo y herramientas de conversión separadas para evitar mezclas.
          </Text>
        </View>

        {/* Mapeo de Secciones */}
        {secciones.map((sec, secIdx) => (
          <View key={secIdx} style={estilos.seccionContenedor}>
            <View style={estilos.encabezadoSeccion}>
              <Text style={estilos.tituloSeccion}>{sec.titulo}</Text>
              {sec.subtitulo && (
                <Text style={estilos.subtituloSeccion}>{sec.subtitulo}</Text>
              )}
            </View>

            <View style={estilos.listaCards}>
              {sec.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[estilos.card, { borderLeftColor: item.colorAcento }]}
                  onPress={() => onNavegar(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={estilos.cardHeader}>
                    <View style={[estilos.iconoCaja, { backgroundColor: item.fondoBadge }]}>
                      <Text style={estilos.icono}>{item.icono}</Text>
                    </View>
                    <View style={estilos.infoCaja}>
                      <View style={estilos.filaCategoria}>
                        <Text style={[estilos.categoriaTexto, { color: item.colorAcento }]}>
                          {item.etiqueta}
                        </Text>
                      </View>
                      <Text style={estilos.cardTitulo}>{item.titulo}</Text>
                    </View>
                    <View style={estilos.cajaFlecha}>
                      <Text style={[estilos.flecha, { color: item.colorAcento }]}>›</Text>
                    </View>
                  </View>

                  <Text style={estilos.cardDesc}>{item.descripcion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Espacio inferior de seguridad */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    padding: 18,
    paddingTop: 16,
  },
  btnCerrarSesion: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  textoCerrarSesion: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerPro: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 22,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgePro: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  textoBadgePro: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tagCapacidad: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  bannerTitulo: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  bannerDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  seccionContenedor: {
    marginBottom: 24,
  },
  encabezadoSeccion: {
    marginBottom: 12,
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  subtituloSeccion: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  listaCards: {
    gap: 12,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconoCaja: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icono: {
    fontSize: 22,
  },
  infoCaja: {
    flex: 1,
  },
  filaCategoria: {
    marginBottom: 2,
  },
  categoriaTexto: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  cajaFlecha: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  flecha: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
});

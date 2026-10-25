import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { CONFIGURACION } from '../../config/constantes';
import { theme } from '../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAlerta } from '../../context/AlertContext';

function RenderizadorTextoIa({ texto }) {
  if (!texto) return null;

  const lineas = texto.split('\n');

  return (
    <View style={estilos.contenedorMarkdown}>
      {lineas.map((linea, index) => {
        const lineaLimpia = linea.trim();
        if (!lineaLimpia) {
          return <View key={index} style={{ height: 6 }} />;
        }

        if (lineaLimpia.startsWith('#')) {
          const textoTitulo = lineaLimpia.replace(/^#+\s*/, '').replace(/\*\*/g, '');
          return (
            <Text key={index} style={estilos.mdTitulo}>
              {textoTitulo}
            </Text>
          );
        }

        const esVineta = /^[-*•]\s+/.test(lineaLimpia) || /^\d+\.\s+/.test(lineaLimpia);
        const prefijoMatch = lineaLimpia.match(/^[-*•\d.]+\s+/);
        const prefijo = prefijoMatch ? prefijoMatch[0] : '';
        const contenido = esVineta ? lineaLimpia.slice(prefijo.length) : lineaLimpia;

        const partes = contenido.split('**');

        if (esVineta) {
          return (
            <View key={index} style={estilos.mdFilaVineta}>
              <Text style={estilos.mdBullet}>•</Text>
              <Text style={estilos.mdTextoVineta}>
                {partes.map((parte, i) => (
                  <Text key={i} style={i % 2 === 1 ? estilos.mdNegrita : estilos.mdNormal}>
                    {parte}
                  </Text>
                ))}
              </Text>
            </View>
          );
        }

        return (
          <Text key={index} style={estilos.mdParrafo}>
            {partes.map((parte, i) => (
              <Text key={i} style={i % 2 === 1 ? estilos.mdNegrita : estilos.mdNormal}>
                {parte}
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
}

export default function GroqAiScreen({ onVolver }) {
  const { mostrarErrorFaltaArchivo, mostrarErrorOperacion } = useAlerta();
  const [pestanaActiva, setPestanaActiva] = useState('resumen');
  const [archivoPdf, setArchivoPdf] = useState(null);
  const [idiomaOrigen, setIdiomaOrigen] = useState('Detección automática');
  const [idiomaDestino, setIdiomaDestino] = useState('Inglés');
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const IDIOMAS_ORIGEN_LISTA = [
    { codigo: 'auto', nombre: 'Detección automática', bandera: '✨' },
    ...CONFIGURACION.IDIOMAS_TRADUCCION
  ];

  const seleccionarPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setArchivoPdf(res.assets[0]);
        setResultado(null);
      }
    } catch (err) {
      mostrarErrorOperacion('Error de acceso', 'No se pudo seleccionar el PDF.');
    }
  };

  const ejecutarResumen = async () => {
    if (!archivoPdf) {
      mostrarErrorFaltaArchivo('PDF');
      return;
    }

    try {
      setProcesando(true);

      const data = await procesarOperacionNativa({
        endpoint: '/ia/resumir',
        archivoUri: archivoPdf.uri,
        campoNombre: 'pdf',
        compartirInmediato: false
      });

      if (data.exito && data.resumen) {
        setResultado(data.resumen);
      } else {
        throw new Error(data.mensaje || 'Error al generar el resumen con Groq AI.');
      }
    } catch (err) {
      mostrarErrorOperacion('Error en IA', err.message);
    } finally {
      setProcesando(false);
    }
  };

  const ejecutarTraduccion = async () => {
    if (!archivoPdf) {
      mostrarErrorFaltaArchivo('PDF');
      return;
    }

    try {
      setProcesando(true);

      const data = await procesarOperacionNativa({
        endpoint: '/ia/traducir',
        archivoUri: archivoPdf.uri,
        campoNombre: 'pdf',
        parametros: {
          idiomaOrigen,
          idiomaDestino
        },
        compartirInmediato: false
      });

      if (data.exito && data.traduccion) {
        setResultado(data.traduccion);
      } else {
        throw new Error(data.mensaje || 'Error al traducir con Groq AI.');
      }
    } catch (err) {
      mostrarErrorOperacion('Error en Traducción', err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Groq AI Documental"
      subtitulo="Síntesis ejecutiva y traducción contextual"
      iconoTitulo={<Feather name="cpu" size={17} color={theme.colors.foreground} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de Pestañas estilo Tabs de shadcn */}
        <View style={estilos.tabsContenedor}>
          <TouchableOpacity
            style={[estilos.tabBoton, pestanaActiva === 'resumen' && estilos.tabBotonActivo]}
            onPress={() => { setPestanaActiva('resumen'); setResultado(null); }}
            activeOpacity={0.8}
          >
            <Feather
              name="file-text"
              size={14}
              color={pestanaActiva === 'resumen' ? theme.colors.foreground : theme.colors.mutedForeground}
              style={{ marginRight: 6 }}
            />
            <Text style={[estilos.tabTexto, pestanaActiva === 'resumen' && estilos.tabTextoActivo]}>
              Resumen Ejecutivo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.tabBoton, pestanaActiva === 'traduccion' && estilos.tabBotonActivo]}
            onPress={() => { setPestanaActiva('traduccion'); setResultado(null); }}
            activeOpacity={0.8}
          >
            <Feather
              name="globe"
              size={14}
              color={pestanaActiva === 'traduccion' ? theme.colors.foreground : theme.colors.mutedForeground}
              style={{ marginRight: 6 }}
            />
            <Text style={[estilos.tabTexto, pestanaActiva === 'traduccion' && estilos.tabTextoActivo]}>
              Traductor Multilingüe
            </Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="accent">PROCESAMIENTO LPU</Badge>
          </View>
          <Text style={estilos.tituloGuia}>
            {pestanaActiva === 'resumen' ? 'Extracción y Síntesis' : 'Traducción con Fidelidad Contextual'}
          </Text>
          <Text style={estilos.textoGuia}>
            {pestanaActiva === 'resumen'
              ? 'Identifica el propósito medular del documento, puntos clave y conclusiones sin redundancias.'
              : 'Traduce preservando la terminología técnica entre idiomas sin inventar ni omitir secciones.'}
          </Text>
        </View>

        {/* Dropzone de PDF */}
        <Card style={estilos.card}>
          <CardHeader>
            <CardTitle>Documento de Entrada</CardTitle>
            <CardDescription>Archivo PDF para análisis sintáctico</CardDescription>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={seleccionarPdf} activeOpacity={0.7}>
              <View style={estilos.iconoDropzone}>
                <Feather
                  name={archivoPdf ? "file-text" : "upload-cloud"}
                  size={20}
                  color={archivoPdf ? theme.colors.foreground : theme.colors.mutedForeground}
                />
              </View>
              <View style={estilos.infoDropzone}>
                <Text style={estilos.textoPrincipalDropzone} numberOfLines={1}>
                  {archivoPdf ? archivoPdf.name : 'Seleccionar Documento PDF'}
                </Text>
                <Text style={estilos.textoSecundarioDropzone}>
                  {archivoPdf ? 'Documento cargado correctamente' : 'Toca para examinar tus archivos'}
                </Text>
              </View>
              {archivoPdf && <Badge variant="success">Listo</Badge>}
            </TouchableOpacity>
          </CardContent>
        </Card>

        {pestanaActiva === 'traduccion' && (
          <>
            {/* Idioma Origen */}
            <Card style={estilos.card}>
              <CardHeader>
                <CardTitle style={{ fontSize: 14 }}>Idioma Origen</CardTitle>
                <CardDescription>Idioma del texto original</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={estilos.gridIdiomas}>
                  {IDIOMAS_ORIGEN_LISTA.map((idioma) => (
                    <TouchableOpacity
                      key={`orig_${idioma.codigo}`}
                      style={[
                        estilos.btnIdioma,
                        idiomaOrigen === idioma.nombre && estilos.btnIdiomaActivo
                      ]}
                      onPress={() => setIdiomaOrigen(idioma.nombre)}
                      activeOpacity={0.75}
                    >
                      <Text style={estilos.bandera}>{idioma.bandera}</Text>
                      <Text style={[
                        estilos.nombreIdioma,
                        idiomaOrigen === idioma.nombre && estilos.nombreIdiomaActivo
                      ]}>
                        {idioma.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </CardContent>
            </Card>

            {/* Idioma Destino */}
            <Card style={estilos.card}>
              <CardHeader>
                <CardTitle style={{ fontSize: 14 }}>Idioma Destino</CardTitle>
                <CardDescription>Idioma hacia el cual traducir</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={estilos.gridIdiomas}>
                  {CONFIGURACION.IDIOMAS_TRADUCCION.map((idioma) => (
                    <TouchableOpacity
                      key={`dest_${idioma.codigo}`}
                      style={[
                        estilos.btnIdioma,
                        idiomaDestino === idioma.nombre && estilos.btnIdiomaActivo
                      ]}
                      onPress={() => setIdiomaDestino(idioma.nombre)}
                      activeOpacity={0.75}
                    >
                      <Text style={estilos.bandera}>{idioma.bandera}</Text>
                      <Text style={[
                        estilos.nombreIdioma,
                        idiomaDestino === idioma.nombre && estilos.nombreIdiomaActivo
                      ]}>
                        {idioma.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </CardContent>
            </Card>
          </>
        )}

        {/* Botón Acción */}
        <Button
          variant="default"
          size="lg"
          onPress={pestanaActiva === 'resumen' ? ejecutarResumen : ejecutarTraduccion}
          disabled={procesando || !archivoPdf}
          cargando={procesando}
          icon={!procesando && <Feather name="zap" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnProcesar}
        >
          {pestanaActiva === 'resumen'
            ? 'Generar Resumen con IA'
            : `Traducir a ${idiomaDestino}`}
        </Button>

        {/* Resultado */}
        {resultado && (
          <Card style={estilos.tarjetaResultado}>
            <CardHeader style={estilos.headerResultado}>
              <CardTitle style={{ fontSize: 15 }}>
                {pestanaActiva === 'resumen' ? 'Resumen Generado' : `Traducción a ${idiomaDestino}`}
              </CardTitle>
              <Badge variant="accent">Groq LPU</Badge>
            </CardHeader>
            <CardContent>
              <ScrollView nestedScrollEnabled style={estilos.scrollResultado}>
                <RenderizadorTextoIa texto={resultado} />
              </ScrollView>
            </CardContent>
          </Card>
        )}

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
    padding: 16,
  },
  tabsContenedor: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabBoton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: theme.radius.sm,
  },
  tabBotonActivo: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabTexto: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.mutedForeground,
  },
  tabTextoActivo: {
    color: theme.colors.foreground,
    fontWeight: '600',
  },
  bannerGuia: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  bannerHeader: {
    marginBottom: 8,
  },
  tituloGuia: {
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  textoGuia: {
    color: theme.colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    marginBottom: 16,
  },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
  },
  iconoDropzone: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoDropzone: {
    flex: 1,
    marginRight: 8,
  },
  textoPrincipalDropzone: {
    color: theme.colors.foreground,
    fontSize: 14,
    fontWeight: '500',
  },
  textoSecundarioDropzone: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  gridIdiomas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btnIdioma: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnIdiomaActivo: {
    borderColor: theme.colors.foreground,
    backgroundColor: theme.colors.secondary,
  },
  bandera: {
    fontSize: 14,
    marginRight: 6,
  },
  nombreIdioma: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  nombreIdiomaActivo: {
    color: theme.colors.foreground,
    fontWeight: '600',
  },
  btnProcesar: {
    width: '100%',
    marginBottom: 16,
  },
  tarjetaResultado: {
    marginTop: 6,
  },
  headerResultado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollResultado: {
    maxHeight: 360,
  },
  contenedorMarkdown: {
    paddingVertical: 4,
  },
  mdTitulo: {
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  mdParrafo: {
    color: theme.colors.mutedForeground,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  mdFilaVineta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  mdBullet: {
    color: theme.colors.ring,
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
  },
  mdTextoVineta: {
    flex: 1,
    color: theme.colors.mutedForeground,
    fontSize: 13,
    lineHeight: 20,
  },
  mdNegrita: {
    color: theme.colors.foreground,
    fontWeight: '700',
  },
  mdNormal: {
    color: theme.colors.mutedForeground,
  },
});

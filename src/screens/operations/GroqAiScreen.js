import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import ScreenContainer from '../../components/ScreenContainer';
import { procesarOperacionNativa } from '../../utils/apiUploader';
import { CONFIGURACION } from '../../config/constantes';

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

        // Título (# Título o ## Título)
        if (lineaLimpia.startsWith('#')) {
          const textoTitulo = lineaLimpia.replace(/^#+\s*/, '').replace(/\*\*/g, '');
          return (
            <Text key={index} style={estilos.mdTitulo}>
              {textoTitulo}
            </Text>
          );
        }

        // Viñeta (- texto o * texto o • texto o 1. texto)
        const esVineta = /^[-*•]\s+/.test(lineaLimpia) || /^\d+\.\s+/.test(lineaLimpia);
        const prefijoMatch = lineaLimpia.match(/^[-*•\d.]+\s+/);
        const prefijo = prefijoMatch ? prefijoMatch[0] : '';
        const contenido = esVineta ? lineaLimpia.slice(prefijo.length) : lineaLimpia;

        // Separar por pares de asteriscos **
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
      Alert.alert('Error', 'No se pudo seleccionar el PDF.');
    }
  };

  const ejecutarResumen = async () => {
    if (!archivoPdf) {
      Alert.alert('Falta el PDF', 'Selecciona el documento que deseas resumir.');
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
      Alert.alert('Error en IA', err.message);
    } finally {
      setProcesando(false);
    }
  };

  const ejecutarTraduccion = async () => {
    if (!archivoPdf) {
      Alert.alert('Falta el PDF', 'Selecciona el documento que deseas traducir.');
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
      Alert.alert('Error en Traducción', err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Groq AI Documental"
      subtitulo="Resumen dinámico y traducción fiel"
      iconoTitulo="🤖"
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.selectorPestanas}>
          <TouchableOpacity
            style={[estilos.pestana, pestanaActiva === 'resumen' && estilos.pestanaActiva]}
            onPress={() => { setPestanaActiva('resumen'); setResultado(null); }}
            activeOpacity={0.8}
          >
            <Text style={[estilos.textoPestana, pestanaActiva === 'resumen' && estilos.textoPestanaActiva]}>
              📝 Resumen Dinámico
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.pestana, pestanaActiva === 'traduccion' && estilos.pestanaActiva]}
            onPress={() => { setPestanaActiva('traduccion'); setResultado(null); }}
            activeOpacity={0.8}
          >
            <Text style={[estilos.textoPestana, pestanaActiva === 'traduccion' && estilos.textoPestanaActiva]}>
              🌐 Traductor Fiel
            </Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.bannerGuia}>
          <Text style={estilos.tituloGuia}>
            {pestanaActiva === 'resumen' ? '💡 Síntesis Clara y Precisa' : '💡 Selección de Idioma Origen y Destino'}
          </Text>
          <Text style={estilos.textoGuia}>
            {pestanaActiva === 'resumen'
              ? 'El resumen va directo al grano: propósito medular del documento, puntos clave destacados y conclusiones esenciales sin rellenos.'
              : 'Selecciona el idioma nativo de tu archivo y el idioma al que deseas traducirlo para evitar confusiones y garantizar fidelidad absoluta.'}
          </Text>
        </View>

        <View style={estilos.card}>
          <Text style={estilos.etiquetaCard}>DOCUMENTO PDF PARA ANÁLISIS</Text>
          <TouchableOpacity style={estilos.btnPicker} onPress={seleccionarPdf} activeOpacity={0.7}>
            <Text style={estilos.iconoPicker}>{archivoPdf ? '📄' : '📁'}</Text>
            <View style={estilos.infoPicker}>
              <Text style={estilos.textoPickerPrincipal}>
                {archivoPdf ? archivoPdf.name : 'Seleccionar Documento PDF'}
              </Text>
              <Text style={estilos.textoPickerSub}>
                {archivoPdf ? 'Documento cargado correctamente' : 'Toca para examinar archivos'}
              </Text>
            </View>
            {archivoPdf && <Text style={estilos.checkVerde}>✓</Text>}
          </TouchableOpacity>
        </View>

        {pestanaActiva === 'traduccion' && (
          <>
            {/* 1. Idioma Nativo / Origen */}
            <View style={estilos.card}>
              <Text style={estilos.etiquetaCard}>1. IDIOMA NATIVO (ORIGEN)</Text>
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
            </View>

            {/* 2. Idioma Destino */}
            <View style={estilos.card}>
              <Text style={estilos.etiquetaCard}>2. IDIOMA A TRADUCIR (DESTINO)</Text>
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
            </View>
          </>
        )}

        <TouchableOpacity
          style={[estilos.btnProcesar, (procesando || !archivoPdf) && { opacity: 0.5 }]}
          onPress={pestanaActiva === 'resumen' ? ejecutarResumen : ejecutarTraduccion}
          disabled={procesando || !archivoPdf}
          activeOpacity={0.8}
        >
          {procesando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={estilos.textoBtnProcesar}>
              {pestanaActiva === 'resumen'
                ? '⚡ Generar Resumen'
                : `⚡ Traducir de ${idiomaOrigen} a ${idiomaDestino}`}
            </Text>
          )}
        </TouchableOpacity>

        {resultado && (
          <View style={estilos.tarjetaResultado}>
            <View style={estilos.headerResultado}>
              <Text style={estilos.tituloResultado}>
                {pestanaActiva === 'resumen' ? '📋 Resumen Generado' : `🌐 Traducción a ${idiomaDestino}`}
              </Text>
            </View>
            <ScrollView nestedScrollEnabled style={estilos.scrollResultado}>
              <RenderizadorTextoIa texto={resultado} />
            </ScrollView>
          </View>
        )}

        <View style={{ height: 30 }} />
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
  },
  selectorPestanas: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pestana: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  pestanaActiva: {
    backgroundColor: '#4338CA',
  },
  textoPestana: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  textoPestanaActiva: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bannerGuia: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: 16,
  },
  tituloGuia: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textoGuia: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  etiquetaCard: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  btnPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
  },
  iconoPicker: {
    fontSize: 24,
    marginRight: 12,
  },
  infoPicker: {
    flex: 1,
  },
  textoPickerPrincipal: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  textoPickerSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  checkVerde: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gridIdiomas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btnIdioma: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnIdiomaActivo: {
    borderColor: '#818CF8',
    backgroundColor: 'rgba(79, 70, 229, 0.25)',
  },
  bandera: {
    fontSize: 16,
    marginRight: 6,
  },
  nombreIdioma: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  nombreIdiomaActivo: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  btnProcesar: {
    backgroundColor: '#4338CA',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  textoBtnProcesar: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tarjetaResultado: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  headerResultado: {
    marginBottom: 10,
  },
  tituloResultado: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  scrollResultado: {
    maxHeight: 350,
  },
  textoResultado: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
  },
  contenedorMarkdown: {
    paddingVertical: 4,
  },
  mdTitulo: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  mdParrafo: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
  mdFilaVineta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  mdBullet: {
    color: '#818CF8',
    fontSize: 16,
    lineHeight: 22,
    marginRight: 8,
  },
  mdTextoVineta: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
  },
  mdNegrita: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  mdNormal: {
    color: '#CBD5E1',
  },
});

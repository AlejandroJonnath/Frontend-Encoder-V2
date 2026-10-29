import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ScreenContainer';
import { useCompressPdf } from '../hooks/useCompressPdf';
import { formatearBytes } from '../../../utils/fileFormatters';
import { theme } from '../../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingOverlay } from '../../../components/ui/LoadingOverlay';

export default function CompressPdfScreen({ onVolver }) {
  const {
    archivoPdf,
    calidad,
    setCalidad,
    comprimiendo,
    mensajeCarga,
    resultado,
    seleccionarNuevoPdf,
    ejecutarCompresion
  } = useCompressPdf();

  return (
    <ScreenContainer
      titulo="Comprimir PDF"
      subtitulo="Hasta 2GB • Optimización de Streams"
      iconoTitulo={<Feather name="minimize-2" size={17} color={theme.colors.foreground} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="success">REDUCCIÓN ALTA</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Optimización Cero Pérdidas</Text>
          <Text style={estilos.textoGuia}>
            Reduce el peso del archivo remuestreando imágenes y purgando tablas de objetos duplicadas sin degradar la nitidez de lectura.
          </Text>
        </View>

        <Card style={estilos.card}>
          <CardHeader>
            <CardTitle>Documento a Comprimir</CardTitle>
            <CardDescription>Soporta archivos de hasta 2GB mediante streams</CardDescription>
          </CardHeader>

          <CardContent>
            <TouchableOpacity style={estilos.dropzone} onPress={seleccionarNuevoPdf} activeOpacity={0.7}>
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
                  {archivoPdf ? `Tamaño actual: ${formatearBytes(archivoPdf.size)}` : 'Toca para examinar tus archivos'}
                </Text>
              </View>
              {archivoPdf && <Badge variant="success">Listo</Badge>}
            </TouchableOpacity>

            {archivoPdf && (
              <View style={estilos.contenedorCalidad}>
                <Text style={estilos.etiquetaNivel}>Nivel de Compresión:</Text>
                <View style={estilos.filaBotonesCalidad}>
                  <TouchableOpacity
                    style={[estilos.btnCalidad, calidad === 'ebook' && estilos.btnCalidadActivo]}
                    onPress={() => setCalidad('ebook')}
                    activeOpacity={0.8}
                  >
                    <Text style={[estilos.textoBtnCalidad, calidad === 'ebook' && estilos.textoBtnCalidadActivo]}>
                      Equilibrada (150 DPI)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[estilos.btnCalidad, calidad === 'screen' && estilos.btnCalidadActivo]}
                    onPress={() => setCalidad('screen')}
                    activeOpacity={0.8}
                  >
                    <Text style={[estilos.textoBtnCalidad, calidad === 'screen' && estilos.textoBtnCalidadActivo]}>
                      Máxima (72 DPI)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        <Button
          variant="default"
          size="lg"
          onPress={ejecutarCompresion}
          disabled={comprimiendo || !archivoPdf}
          cargando={comprimiendo}
          icon={!comprimiendo && <Feather name="zap" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnAccion}
        >
          Comprimir y Compartir
        </Button>

        {resultado && (
          <Card style={estilos.tarjetaResultado}>
            <View style={estilos.badgeExitoFila}>
              <Badge variant={resultado.reduccion > 0 ? "success" : "secondary"}>
                {resultado.reduccion > 0 ? "COMPRESIÓN EXITOSA" : "DOCUMENTO OPTIMIZADO"}
              </Badge>
            </View>

            <View style={estilos.filaComparativa}>
              <View style={estilos.cajaMetrica}>
                <Text style={estilos.etiquetaMetrica}>ORIGINAL</Text>
                <Text style={estilos.valorAntes}>{formatearBytes(resultado.tamanioOriginal)}</Text>
              </View>

              <Feather name="arrow-right" size={18} color={theme.colors.mutedForeground} />

              <View style={estilos.cajaMetrica}>
                <Text style={estilos.etiquetaMetrica}>FINAL</Text>
                <Text style={estilos.valorDespues}>{formatearBytes(resultado.tamanioComprimido)}</Text>
              </View>
            </View>

            <View style={[estilos.resumenReduccion, resultado.reduccion === 0 && estilos.resumenReduccionCero]}>
              <Feather
                name={resultado.reduccion > 0 ? "check" : "info"}
                size={14}
                color={resultado.reduccion > 0 ? theme.colors.success : theme.colors.mutedForeground}
                style={{ marginRight: 6 }}
              />
              <Text style={[estilos.textoReduccion, resultado.reduccion === 0 && estilos.textoReduccionCero]}>
                {resultado.reduccion > 0
                  ? `Reducción alcanzada: ${resultado.reduccion}% del tamaño original`
                  : 'El documento ya se encuentra en su tamaño óptimo sin pérdida de calidad'}
              </Text>
            </View>
          </Card>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <LoadingOverlay visible={comprimiendo} mensaje={mensajeCarga || "Comprimiendo PDF y optimizando streams..."} />
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContenido: {
    padding: theme.spacing.lg,
  },
  bannerGuia: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  bannerHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  tituloGuia: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  textoGuia: {
    ...theme.typography.small,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  iconoDropzone: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoDropzone: {
    flex: 1,
  },
  textoPrincipalDropzone: {
    ...theme.typography.bodyStrong,
  },
  textoSecundarioDropzone: {
    ...theme.typography.small,
    marginTop: 2,
  },
  btnAccion: {
    marginBottom: theme.spacing.lg,
  },
  tarjetaResultado: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.borderStrong,
  },
  badgeExitoFila: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  filaComparativa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  cajaMetrica: {
    alignItems: 'center',
  },
  etiquetaMetrica: {
    ...theme.typography.label,
    marginBottom: 4,
  },
  valorAntes: {
    ...theme.typography.h3,
    color: theme.colors.mutedForeground,
  },
  valorDespues: {
    ...theme.typography.h2,
    color: theme.colors.success,
  },
  resumenReduccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.successMuted,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  textoReduccion: {
    ...theme.typography.small,
    color: theme.colors.success,
    fontWeight: '600',
  },
  contenedorCalidad: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  etiquetaNivel: {
    ...theme.typography.label,
    marginBottom: theme.spacing.xs,
    color: theme.colors.mutedForeground,
  },
  filaBotonesCalidad: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  btnCalidad: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    alignItems: 'center',
  },
  btnCalidadActivo: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  textoBtnCalidad: {
    ...theme.typography.small,
    color: theme.colors.foreground,
    fontWeight: '500',
  },
  textoBtnCalidadActivo: {
    color: theme.colors.primaryForeground,
    fontWeight: '700',
  },
  resumenReduccionCero: {
    backgroundColor: theme.colors.muted,
  },
  textoReduccionCero: {
    color: theme.colors.mutedForeground,
  },
});

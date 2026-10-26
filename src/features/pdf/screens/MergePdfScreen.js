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
import { useMergePdf } from '../hooks/useMergePdf';
import { formatearBytes } from '../../../utils/fileFormatters';
import { theme } from '../../../theme/shadcn';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingOverlay } from '../../../components/ui/LoadingOverlay';

export default function MergePdfScreen({ onVolver }) {
  const {
    archivosPdf,
    uniendo,
    progresoTexto,
    agregarPdfs,
    eliminarArchivo,
    moverArriba,
    moverAbajo,
    ejecutarUnion,
    limpiar
  } = useMergePdf();

  return (
    <ScreenContainer
      titulo="Unir PDFs"
      subtitulo="Combina y reordena múltiples documentos"
      iconoTitulo={<Feather name="layers" size={17} color={theme.colors.foreground} />}
      onVolver={onVolver}
    >
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.bannerGuia}>
          <View style={estilos.bannerHeader}>
            <Badge variant="accent">ORDEN SECUENCIAL</Badge>
          </View>
          <Text style={estilos.tituloGuia}>Ensamblaje y Optimización</Text>
          <Text style={estilos.textoGuia}>
            Añade los archivos en cola, ordénalos con los controles de posición y genera un único documento optimizado.
          </Text>
        </View>

        <TouchableOpacity style={estilos.btnAgregar} onPress={agregarPdfs} activeOpacity={0.7}>
          <View style={estilos.iconoAgregarCaja}>
            <Feather name="plus" size={18} color={theme.colors.foreground} />
          </View>
          <View style={estilos.textosAgregar}>
            <Text style={estilos.textoAgregarPrincipal}>Seleccionar y Agregar PDFs</Text>
            <Text style={estilos.textoAgregarSub}>Admite selección múltiple simultánea</Text>
          </View>
        </TouchableOpacity>

        <View style={estilos.contenedorLista}>
          <View style={estilos.headerLista}>
            <Text style={estilos.tituloLista}>Documentos en cola ({archivosPdf.length})</Text>
            {archivosPdf.length > 0 && (
              <TouchableOpacity onPress={limpiar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={estilos.textoLimpiar}>Limpiar todos</Text>
              </TouchableOpacity>
            )}
          </View>

          {archivosPdf.length === 0 ? (
            <Card style={estilos.cajaVacia}>
              <Feather name="inbox" size={28} color={theme.colors.mutedForeground} style={{ marginBottom: 8 }} />
              <Text style={estilos.textoVacio}>No has agregado ningún documento todavía.</Text>
            </Card>
          ) : (
            archivosPdf.map((archivo, index) => (
              <View key={`${archivo.uri}_${index}`} style={estilos.itemArchivo}>
                <View style={estilos.badgePosicion}>
                  <Text style={estilos.textoPosicion}>{index + 1}</Text>
                </View>

                <View style={estilos.infoArchivo}>
                  <Text style={estilos.nombreArchivo} numberOfLines={1}>
                    {archivo.name}
                  </Text>
                  <Text style={estilos.pesoArchivo}>
                    {formatearBytes(archivo.size)}
                  </Text>
                </View>

                <View style={estilos.filaBotonesAccion}>
                  <TouchableOpacity
                    style={[estilos.btnOrden, index === 0 && { opacity: 0.3 }]}
                    disabled={index === 0}
                    onPress={() => moverArriba(index)}
                  >
                    <Feather name="chevron-up" size={14} color={theme.colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[estilos.btnOrden, index === archivosPdf.length - 1 && { opacity: 0.3 }]}
                    disabled={index === archivosPdf.length - 1}
                    onPress={() => moverAbajo(index)}
                  >
                    <Feather name="chevron-down" size={14} color={theme.colors.foreground} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={estilos.btnEliminar}
                    onPress={() => eliminarArchivo(index)}
                  >
                    <Feather name="trash-2" size={13} color={theme.colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <Button
          variant="default"
          size="lg"
          onPress={ejecutarUnion}
          disabled={uniendo || archivosPdf.length < 2}
          cargando={uniendo}
          icon={!uniendo && <Feather name="layers" size={16} color={theme.colors.primaryForeground} />}
          style={estilos.btnAccion}
        >
          {archivosPdf.length < 2 ? 'Agrega al menos 2 PDFs' : `Unir ${archivosPdf.length} Documentos`}
        </Button>

        <View style={{ height: 32 }} />
      </ScrollView>

      <LoadingOverlay visible={uniendo} mensaje={progresoTexto || 'Uniendo documentos...'} />
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
  btnAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  iconoAgregarCaja: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textosAgregar: {
    flex: 1,
  },
  textoAgregarPrincipal: {
    ...theme.typography.bodyStrong,
  },
  textoAgregarSub: {
    ...theme.typography.small,
    marginTop: 2,
  },
  contenedorLista: {
    marginBottom: theme.spacing.xl,
  },
  headerLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tituloLista: {
    ...theme.typography.label,
  },
  textoLimpiar: {
    ...theme.typography.small,
    color: theme.colors.destructive,
    fontWeight: '600',
  },
  cajaVacia: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  textoVacio: {
    ...theme.typography.body,
    textAlign: 'center',
  },
  itemArchivo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  badgePosicion: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoPosicion: {
    ...theme.typography.small,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  infoArchivo: {
    flex: 1,
  },
  nombreArchivo: {
    ...theme.typography.bodyStrong,
    fontSize: 13,
  },
  pesoArchivo: {
    ...theme.typography.small,
    fontSize: 11,
    marginTop: 2,
  },
  filaBotonesAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnOrden: {
    padding: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.muted,
  },
  btnEliminar: {
    padding: 6,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.destructiveMuted,
    marginLeft: 4,
  },
  btnAccion: {
    marginTop: theme.spacing.xs,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenContainer from '../../components/ScreenContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Separator } from '../../components/ui/Separator';
import { theme } from '../../theme/shadcn';
import { useAuth } from '../../context/AuthContext';
import { useAlerta } from '../../context/AlertContext';
import {
  obtenerEstadisticasAdmin,
  obtenerMonitoreoAdmin,
  obtenerReportesAdmin,
  actualizarClasificacionReporteAdmin
} from '../../api/support.api';

export default function AdminScreen({ onVolver }) {
  const { cerrarSesion } = useAuth();
  const { mostrarExito, mostrarErrorOperacion } = useAlerta();

  const [estadisticas, setEstadisticas] = useState(null);
  const [monitoreo, setMonitoreo] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [pestaña, setPestaña] = useState('reportes'); // 'reportes' | 'metricas' | 'salud'
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'Pendiente' | 'En proceso' | 'Solucionado'

  useEffect(() => {
    cargarTodosLosDatos();
  }, []);

  const cargarTodosLosDatos = async () => {
    try {
      setCargando(true);
      const [resStats, resSalud, resReportes] = await Promise.allSettled([
        obtenerEstadisticasAdmin(),
        obtenerMonitoreoAdmin(),
        obtenerReportesAdmin()
      ]);

      if (resStats.status === 'fulfilled') setEstadisticas(resStats.value);
      if (resSalud.status === 'fulfilled') setMonitoreo(resSalud.value);
      if (resReportes.status === 'fulfilled') {
        setReportes(resReportes.value?.reportes || []);
      }
    } catch (_) {
    } finally {
      setCargando(false);
    }
  };

  const cambiarClasificacion = async (reporteId, nuevoEstado) => {
    try {
      setActualizandoId(reporteId);
      await actualizarClasificacionReporteAdmin(reporteId, nuevoEstado);

      // Actualizar localmente el estado del reporte
      setReportes(prev =>
        prev.map(r => (r.id === reporteId ? { ...r, status: nuevoEstado } : r))
      );

      mostrarExito(
        'Clasificación Actualizada',
        `El reporte ha sido marcado como "${nuevoEstado}".`
      );
    } catch (err) {
      mostrarErrorOperacion(
        'Error al actualizar',
        err.response?.data?.mensaje || err.message || 'No se pudo cambiar el estado del reporte.'
      );
    } finally {
      setActualizandoId(null);
    }
  };

  const confirmarCerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Deseas salir del panel de administración?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: cerrarSesion }
      ]
    );
  };

  const reportesFiltrados = reportes.filter(r => {
    if (filtroEstado === 'todos') return true;
    const st = r.status || 'Pendiente';
    if (filtroEstado === 'Pendiente') return st === 'Pendiente' || st === 'abierto';
    if (filtroEstado === 'En proceso') return st === 'En proceso' || st === 'en_revision';
    if (filtroEstado === 'Solucionado') return st === 'Solucionado' || st === 'resuelto';
    return true;
  });

  const getVarianteBadgeEstado = (st) => {
    if (st === 'Solucionado' || st === 'resuelto') return 'success';
    if (st === 'En proceso' || st === 'en_revision') return 'accent';
    return 'destructive';
  };

  const getNombreEstado = (st) => {
    if (st === 'Solucionado' || st === 'resuelto') return 'Solucionado';
    if (st === 'En proceso' || st === 'en_revision') return 'En proceso';
    return 'Pendiente';
  };

  return (
    <ScreenContainer
      titulo="Panel Administrador"
      subtitulo="Gestión de reportes, telemetría y métricas del sistema"
      onVolver={onVolver}
      botonDerecho={
        <TouchableOpacity
          style={estilos.btnCerrarSesionHeader}
          onPress={confirmarCerrarSesion}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={14} color={theme.colors.destructive} style={{ marginRight: 4 }} />
          <Text style={estilos.textoCerrarSesion}>Salir</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Selector de pestañas principales */}
        <View style={estilos.pestañasContenedor}>
          <TouchableOpacity
            style={[estilos.tabBoton, pestaña === 'reportes' && estilos.tabActivo]}
            onPress={() => setPestaña('reportes')}
          >
            <Text style={[estilos.tabTexto, pestaña === 'reportes' && estilos.tabTextoActivo]}>
              Reportes ({reportes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.tabBoton, pestaña === 'metricas' && estilos.tabActivo]}
            onPress={() => setPestaña('metricas')}
          >
            <Text style={[estilos.tabTexto, pestaña === 'metricas' && estilos.tabTextoActivo]}>
              Uso y Métricas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[estilos.tabBoton, pestaña === 'salud' && estilos.tabActivo]}
            onPress={() => setPestaña('salud')}
          >
            <Text style={[estilos.tabTexto, pestaña === 'salud' && estilos.tabTextoActivo]}>
              Salud y Servidor
            </Text>
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={theme.colors.ring} style={{ marginVertical: 40 }} />
        ) : pestaña === 'reportes' ? (
          <>
            {/* PESTAÑA 1: GESTIÓN Y CLASIFICACIÓN DE REPORTES */}
            {/* Filtros rápidos de estado */}
            <View style={estilos.filtrosFila}>
              {['todos', 'Pendiente', 'En proceso', 'Solucionado'].map(f => (
                <TouchableOpacity
                  key={f}
                  style={[estilos.filtroChip, filtroEstado === f && estilos.filtroChipActivo]}
                  onPress={() => setFiltroEstado(f)}
                >
                  <Text style={[estilos.filtroTexto, filtroEstado === f && estilos.filtroTextoActivo]}>
                    {f === 'todos' ? 'Todos' : f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {reportesFiltrados.length === 0 ? (
              <Card style={estilos.tarjetaVacia}>
                <Feather name="check-circle" size={32} color={theme.colors.success} style={{ marginBottom: 8 }} />
                <Text style={estilos.textoVacio}>No hay reportes con este filtro</Text>
                <Text style={estilos.subtextoVacio}>Todos los tickets están atendidos o al día.</Text>
              </Card>
            ) : (
              reportesFiltrados.map(reporte => {
                const estadoActual = getNombreEstado(reporte.status);
                const procesandoEste = actualizandoId === reporte.id;

                return (
                  <Card key={reporte.id} style={estilos.tarjetaReporte}>
                    <CardHeader style={estilos.cabeceraReporte}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={estilos.tituloReporte}>{reporte.title || reporte.titulo || 'Sin título'}</Text>
                        <Text style={estilos.usuarioReporte}>
                          De: {reporte.user_email || reporte.email || reporte.user_id?.substring(0, 8) || 'Usuario'}
                        </Text>
                      </View>
                      <Badge variant={getVarianteBadgeEstado(reporte.status)}>
                        {estadoActual}
                      </Badge>
                    </CardHeader>

                    <CardContent>
                      <Text style={estilos.descripcionReporte}>
                        {reporte.description || reporte.descripcion || 'Sin descripción detallada.'}
                      </Text>

                      {reporte.operation && (
                        <View style={estilos.filaHerramienta}>
                          <Feather name="tool" size={12} color={theme.colors.mutedForeground} style={{ marginRight: 4 }} />
                          <Text style={estilos.textoHerramienta}>Módulo: {reporte.operation}</Text>
                        </View>
                      )}

                      <Separator style={{ marginVertical: 10 }} />

                      {/* CLASIFICACIÓN INTERACTIVA */}
                      <Text style={estilos.labelClasificar}>Cambiar Clasificación:</Text>
                      {procesandoEste ? (
                        <ActivityIndicator size="small" color={theme.colors.ring} style={{ marginVertical: 6 }} />
                      ) : (
                        <View style={estilos.filaBotonesClasificar}>
                          <TouchableOpacity
                            style={[
                              estilos.btnEstado,
                              estilos.btnEstadoPendiente,
                              estadoActual === 'Pendiente' && estilos.btnEstadoActivo
                            ]}
                            onPress={() => cambiarClasificacion(reporte.id, 'Pendiente')}
                          >
                            <Feather name="clock" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
                            <Text style={estilos.textoBtnEstado}>Pendiente</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              estilos.btnEstado,
                              estilos.btnEstadoProceso,
                              estadoActual === 'En proceso' && estilos.btnEstadoActivo
                            ]}
                            onPress={() => cambiarClasificacion(reporte.id, 'En proceso')}
                          >
                            <Feather name="loader" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
                            <Text style={estilos.textoBtnEstado}>En proceso</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              estilos.btnEstado,
                              estilos.btnEstadoSolucionado,
                              estadoActual === 'Solucionado' && estilos.btnEstadoActivo
                            ]}
                            onPress={() => cambiarClasificacion(reporte.id, 'Solucionado')}
                          >
                            <Feather name="check-circle" size={12} color="#34D399" style={{ marginRight: 4 }} />
                            <Text style={estilos.textoBtnEstado}>Solucionado</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}

            <Button
              variant="outline"
              onPress={cargarTodosLosDatos}
              style={{ marginTop: 8 }}
            >
              Actualizar Lista de Reportes
            </Button>
          </>
        ) : pestaña === 'metricas' ? (
          <>
            {/* PESTAÑA 2: MÉTRICAS Y USO DE HERRAMIENTAS */}
            <View style={estilos.filaTarjetasResumen}>
              <Card style={[estilos.tarjetaResumen, { borderColor: theme.colors.success }]}>
                <Badge variant="outline">Más Utilizada</Badge>
                <Text style={estilos.resumenTitulo}>
                  {estadisticas?.resumen?.herramientaMasUsada?.nombre || 'Firma PAdES'}
                </Text>
                <Text style={estilos.resumenValor}>
                  {estadisticas?.resumen?.herramientaMasUsada?.totalUsos || 0} operaciones
                </Text>
              </Card>

              <Card style={[estilos.tarjetaResumen, { borderColor: theme.colors.warning }]}>
                <Badge variant="outline">Menos Utilizada</Badge>
                <Text style={estilos.resumenTitulo}>
                  {estadisticas?.resumen?.herramientaMenosUsada?.nombre || 'Conversión PPT'}
                </Text>
                <Text style={estilos.resumenValor}>
                  {estadisticas?.resumen?.herramientaMenosUsada?.totalUsos || 0} operaciones
                </Text>
              </Card>
            </View>

            {/* Ranking Completo de Herramientas */}
            <Card style={estilos.tarjeta}>
              <CardHeader>
                <CardTitle>Estadísticas de Uso de Herramientas</CardTitle>
                <CardDescription>
                  Distribución comparativa de volumen procesado por módulo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(estadisticas?.rankingHerramientas || []).map((item, index) => (
                  <View key={item.id} style={estilos.rankingItem}>
                    <View style={estilos.rankingCabecera}>
                      <Text style={estilos.rankingPuesto}>#{index + 1}</Text>
                      <Text style={estilos.rankingNombre}>{item.nombre}</Text>
                      <Badge variant="secondary">{`${item.totalUsos} usos`}</Badge>
                    </View>
                    <View style={estilos.barraFondo}>
                      <View
                        style={[
                          estilos.barraProgreso,
                          {
                            width: `${Math.max(
                              8,
                              Math.min(
                                100,
                                ((item.totalUsos || 0) /
                                  Math.max(
                                    1,
                                    estadisticas?.resumen?.herramientaMasUsada?.totalUsos || 1
                                  )) *
                                  100
                              )
                            )}%`
                          }
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* PESTAÑA 3: SALUD DEL SERVIDOR Y MONITOR DE CAÍDAS */}
            <Card style={estilos.tarjeta}>
              <CardHeader>
                <View style={estilos.filaCabecera}>
                  <CardTitle>Salud del Servidor Post-Lanzamiento</CardTitle>
                  <Badge variant={monitoreo?.estadoSistema === 'saludable' ? 'default' : 'secondary'}>
                    {monitoreo?.estadoSistema?.toUpperCase() || 'ACTIVO'}
                  </Badge>
                </View>
                <CardDescription>Monitorización en tiempo real contra caídas y errores 5xx</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={estilos.gridMetricas}>
                  <View style={estilos.cajaMetrica}>
                    <Text style={estilos.cajaNumero}>{monitoreo?.uptimeSegundos || 0}s</Text>
                    <Text style={estilos.cajaLabel}>Uptime Continuo</Text>
                  </View>
                  <View style={estilos.cajaMetrica}>
                    <Text style={estilos.cajaNumero}>{monitoreo?.metricasServidor?.memoriaProcesoMb || 0} MB</Text>
                    <Text style={estilos.cajaLabel}>RAM en Uso</Text>
                  </View>
                  <View style={estilos.cajaMetrica}>
                    <Text style={estilos.cajaNumero}>{monitoreo?.metricasServidor?.archivosTemporalesEnDisco || 0}</Text>
                    <Text style={estilos.cajaLabel}>Temporales</Text>
                  </View>
                  <View style={estilos.cajaMetrica}>
                    <Text style={[estilos.cajaNumero, { color: monitoreo?.monitorErrores?.caidasCriticas5xx > 0 ? theme.colors.destructive : theme.colors.success }]}>
                      {monitoreo?.monitorErrores?.caidasCriticas5xx || 0}
                    </Text>
                    <Text style={estilos.cajaLabel}>Caídas 5xx (1h)</Text>
                  </View>
                </View>

                <Separator style={{ marginVertical: 14 }} />

                <Text style={estilos.subtituloSeccion}>Conectividad de Servicios:</Text>
                <View style={estilos.filaServicio}>
                  <Text style={estilos.nombreServicio}>Base de Datos Supabase Cloud</Text>
                  <Badge variant={monitoreo?.conectividad?.supabase?.conectado ? 'outline' : 'secondary'}>
                    {monitoreo?.conectividad?.supabase?.conectado ? `${monitoreo?.conectividad?.supabase?.latenciaMs || 0}ms OK` : 'Desconectado'}
                  </Badge>
                </View>

                <View style={estilos.filaServicio}>
                  <Text style={estilos.nombreServicio}>Inferencia Groq AI ({monitoreo?.conectividad?.groqModelo})</Text>
                  <Badge variant="outline">Listo</Badge>
                </View>

                <View style={estilos.filaServicio}>
                  <Text style={estilos.nombreServicio}>Crashlytics & Telemetría Móvil</Text>
                  <Badge variant="default">Monitor Activo</Badge>
                </View>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onPress={cargarTodosLosDatos}
              style={{ marginTop: 10 }}
            >
              Refrescar Estado del Servidor
            </Button>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 40,
    gap: theme.spacing.md,
  },
  btnCerrarSesionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.md,
  },
  textoCerrarSesion: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.destructive,
  },
  pestañasContenedor: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
  },
  tabBoton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  tabActivo: {
    backgroundColor: theme.colors.muted,
  },
  tabTexto: {
    fontSize: 11,
    color: theme.colors.mutedForeground,
    fontWeight: '600',
  },
  tabTextoActivo: {
    color: theme.colors.foreground,
  },
  filtrosFila: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  filtroChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  filtroChipActivo: {
    backgroundColor: theme.colors.ring,
    borderColor: theme.colors.ring,
  },
  filtroTexto: {
    fontSize: 11,
    color: theme.colors.mutedForeground,
    fontWeight: '500',
  },
  filtroTextoActivo: {
    color: '#000000',
    fontWeight: '700',
  },
  tarjetaVacia: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoVacio: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  subtextoVacio: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 4,
  },
  tarjetaReporte: {
    padding: 14,
  },
  cabeceraReporte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tituloReporte: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  usuarioReporte: {
    fontSize: 11,
    color: theme.colors.ring,
    marginTop: 2,
  },
  descripcionReporte: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    lineHeight: 18,
  },
  filaHerramienta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  textoHerramienta: {
    fontSize: 11,
    color: theme.colors.mutedForeground,
  },
  labelClasificar: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: 8,
  },
  filaBotonesClasificar: {
    flexDirection: 'row',
    gap: 6,
  },
  btnEstado: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.secondary,
  },
  btnEstadoPendiente: {
    borderColor: 'rgba(251, 191, 36, 0.3)',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  btnEstadoProceso: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  btnEstadoSolucionado: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
  },
  btnEstadoActivo: {
    borderWidth: 1.5,
    backgroundColor: theme.colors.muted,
  },
  textoBtnEstado: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  filaTarjetasResumen: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  tarjetaResumen: {
    flex: 1,
    padding: 12,
  },
  resumenTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.foreground,
    marginTop: 6,
    marginBottom: 2,
  },
  resumenValor: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  tarjeta: {
    padding: theme.spacing.md,
  },
  filaCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankingItem: {
    marginBottom: 12,
  },
  rankingCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankingPuesto: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.ring,
    width: 24,
  },
  rankingNombre: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.foreground,
  },
  barraFondo: {
    height: 6,
    backgroundColor: theme.colors.cardHover,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barraProgreso: {
    height: '100%',
    backgroundColor: theme.colors.ring,
    borderRadius: 3,
  },
  gridMetricas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cajaMetrica: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.cardHover,
    padding: 12,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cajaNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.foreground,
  },
  cajaLabel: {
    fontSize: 11,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  subtituloSeccion: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: 8,
  },
  filaServicio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  nombreServicio: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
});

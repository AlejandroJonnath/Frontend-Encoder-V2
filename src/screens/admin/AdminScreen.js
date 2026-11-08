import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Separator } from '../../components/ui/Separator';
import { theme } from '../../theme/shadcn';
import { obtenerEstadisticasAdmin, obtenerMonitoreoAdmin } from '../../api/support.api';

export default function AdminScreen({ onVolver }) {
  const [estadisticas, setEstadisticas] = useState(null);
  const [monitoreo, setMonitoreo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pestaña, setPestaña] = useState('metricas'); // 'metricas' | 'salud'

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resStats, resSalud] = await Promise.allSettled([
        obtenerEstadisticasAdmin(),
        obtenerMonitoreoAdmin()
      ]);

      if (resStats.status === 'fulfilled') {
        setEstadisticas(resStats.value);
      }
      if (resSalud.status === 'fulfilled') {
        setMonitoreo(resSalud.value);
      }
    } catch (_) {
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Panel Administrador"
      subtitulo="Telemetría, métricas de uso y estado del sistema"
      onVolver={onVolver}
    >
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Selector de pestañas */}
        <View style={estilos.pestañasContenedor}>
          <TouchableOpacity
            style={[estilos.tabBoton, pestaña === 'metricas' && estilos.tabActivo]}
            onPress={() => setPestaña('metricas')}
          >
            <Text style={[estilos.tabTexto, pestaña === 'metricas' && estilos.tabTextoActivo]}>
              Uso de Aplicaciones
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[estilos.tabBoton, pestaña === 'salud' && estilos.tabActivo]}
            onPress={() => setPestaña('salud')}
          >
            <Text style={[estilos.tabTexto, pestaña === 'salud' && estilos.tabTextoActivo]}>
              Monitoreo y Caídas
            </Text>
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={theme.colors.ring} style={{ marginVertical: 40 }} />
        ) : pestaña === 'metricas' ? (
          <>
            {/* Resumen de Aplicaciones Más y Menos Usadas */}
            <View style={estilos.filaTarjetasResumen}>
              <Card style={[estilos.tarjetaResumen, { borderColor: theme.colors.success }]}>
                <Badge variant="outline" label="Más Utilizada" />
                <Text style={estilos.resumenTitulo}>
                  {estadisticas?.resumen?.herramientaMasUsada?.nombre || 'Firma PAdES'}
                </Text>
                <Text style={estilos.resumenValor}>
                  {estadisticas?.resumen?.herramientaMasUsada?.totalUsos || 0} operaciones
                </Text>
              </Card>

              <Card style={[estilos.tarjetaResumen, { borderColor: theme.colors.warning }]}>
                <Badge variant="outline" label="Menos Utilizada" />
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
                      <Badge variant="secondary" label={`${item.totalUsos} usos`} />
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

            {/* Resumen de Incidencias de Soporte */}
            <Card style={estilos.tarjeta}>
              <CardHeader>
                <CardTitle>Estado de Reportes de Soporte</CardTitle>
                <CardDescription>Resumen de incidencias recibidas desde los usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={estilos.filaReportes}>
                  <View style={estilos.cajaMetrica}>
                    <Text style={estilos.cajaNumero}>{estadisticas?.resumen?.totalTicketsReportados || 0}</Text>
                    <Text style={estilos.cajaLabel}>Total Reportes</Text>
                  </View>
                  <View style={estilos.cajaMetrica}>
                    <Text style={[estilos.cajaNumero, { color: theme.colors.warning }]}>
                      {estadisticas?.resumen?.ticketsPendientes || 0}
                    </Text>
                    <Text style={estilos.cajaLabel}>Pendientes</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Monitor de Salud y Caídas */}
            <Card style={estilos.tarjeta}>
              <CardHeader>
                <View style={estilos.filaCabecera}>
                  <CardTitle>Salud del Servidor Post-Lanzamiento</CardTitle>
                  <Badge
                    variant={monitoreo?.estadoSistema === 'saludable' ? 'default' : 'secondary'}
                    label={monitoreo?.estadoSistema?.toUpperCase() || 'ACTIVO'}
                  />
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
                  <Badge
                    variant={monitoreo?.conectividad?.supabase?.conectado ? 'outline' : 'secondary'}
                    label={monitoreo?.conectividad?.supabase?.conectado ? `${monitoreo?.conectividad?.supabase?.latenciaMs || 0}ms OK` : 'Desconectado'}
                  />
                </View>

                <View style={estilos.filaServicio}>
                  <Text style={estilos.nombreServicio}>Inferencia Groq AI ({monitoreo?.conectividad?.groqModelo})</Text>
                  <Badge variant="outline" label="Listo" />
                </View>

                <View style={estilos.filaServicio}>
                  <Text style={estilos.nombreServicio}>Crashlytics & Telemetría Móvil</Text>
                  <Badge variant="default" label="Monitor Activo" />
                </View>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              label="Refrescar Estado del Servidor"
              onPress={cargarDatos}
              style={{ marginTop: 10 }}
            />
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
    fontSize: 12,
    color: theme.colors.mutedForeground,
    fontWeight: '600',
  },
  tabTextoActivo: {
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
  filaReportes: {
    flexDirection: 'row',
    gap: 12,
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


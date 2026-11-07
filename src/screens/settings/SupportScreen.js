import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Separator } from '../../components/ui/Separator';
import { theme } from '../../theme/shadcn';
import { useAlerta } from '../../context/AlertContext';
import { crearTicketSoporte, obtenerMisTickets } from '../../api/support.api';

const CATEGORIAS = [
  { id: 'firma_digital', etiqueta: 'Firma Digital PAdES / .p12' },
  { id: 'compresion_pdf', etiqueta: 'Compresión de PDF' },
  { id: 'conversion_office', etiqueta: 'Conversión Office a PDF' },
  { id: 'ia_groq', etiqueta: 'Inteligencia Artificial Groq' },
  { id: 'cuenta_seguridad', etiqueta: 'Cuenta y Seguridad' },
  { id: 'rendimiento', etiqueta: 'Rendimiento / Caídas' },
  { id: 'otro', etiqueta: 'Otro problema o sugerencia' }
];

const SEVERIDADES = [
  { id: 'baja', etiqueta: 'Baja', color: theme.colors.mutedForeground },
  { id: 'media', etiqueta: 'Media', color: theme.colors.ring },
  { id: 'alta', etiqueta: 'Alta', color: theme.colors.warning },
  { id: 'critica', etiqueta: 'Crítica', color: theme.colors.destructive }
];

export default function SupportScreen({ onVolver }) {
  const [categoria, setCategoria] = useState('firma_digital');
  const [severidad, setSeveridad] = useState('media');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [misTickets, setMisTickets] = useState([]);
  const [cargandoTickets, setCargandoTickets] = useState(false);
  const [pestaña, setPestaña] = useState('nuevo'); // 'nuevo' | 'historial'

  const { mostrarExito, mostrarErrorOperacion, mostrarErrorCampos } = useAlerta();

  useEffect(() => {
    cargarTickets();
  }, []);

  const cargarTickets = async () => {
    try {
      setCargandoTickets(true);
      const res = await obtenerMisTickets();
      if (res?.tickets) {
        setMisTickets(res.tickets);
      }
    } catch (_) {
    } finally {
      setCargandoTickets(false);
    }
  };

  const manejarEnvio = async () => {
    if (!titulo.trim() || !descripcion.trim()) {
      mostrarErrorCampos('Debes ingresar un título y la descripción detallada del problema.');
      return;
    }

    if (descripcion.trim().length < 10) {
      mostrarErrorCampos('La descripción debe contener al menos 10 caracteres explicando la incidencia.');
      return;
    }

    try {
      setEnviando(true);

      const deviceInfo = {
        os: Platform.OS,
        osVersion: Platform.Version,
        isTesting: __DEV__,
        appVersion: '1.0.0',
        timestamp: new Date().toISOString()
      };

      const respuesta = await crearTicketSoporte({
        categoria,
        severidad,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        deviceInfo
      });

      mostrarExito(
        'Incidencia Reportada',
        `Tu reporte #${respuesta?.ticket?.numero || ''} ha sido enviado correctamente al equipo de soporte.`,
        () => {
          setTitulo('');
          setDescripcion('');
          setPestaña('historial');
          cargarTickets();
        }
      );
    } catch (err) {
      mostrarErrorOperacion(
        'Error al enviar reporte',
        err.response?.data?.mensaje || err.message || 'No se pudo registrar la incidencia.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Centro de Soporte"
      subtitulo="Reporta incidencias y problemas técnicos"
      onVolver={onVolver}
    >
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Selector de Pestaña */}
        <View style={estilos.pestañasContenedor}>
          <TouchableOpacity
            style={[estilos.tabBoton, pestaña === 'nuevo' && estilos.tabActivo]}
            onPress={() => setPestaña('nuevo')}
          >
            <Text style={[estilos.tabTexto, pestaña === 'nuevo' && estilos.tabTextoActivo]}>
              Nueva Incidencia
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[estilos.tabBoton, pestaña === 'historial' && estilos.tabActivo]}
            onPress={() => {
              setPestaña('historial');
              cargarTickets();
            }}
          >
            <Text style={[estilos.tabTexto, pestaña === 'historial' && estilos.tabTextoActivo]}>
              Mis Reportes ({misTickets.length})
            </Text>
          </TouchableOpacity>
        </View>

        {pestaña === 'nuevo' ? (
          <Card style={estilos.tarjeta}>
            <CardHeader>
              <CardTitle>Crear Incidencia (Modo Reporte)</CardTitle>
              <CardDescription>
                Describe detalladamente la falla o comportamiento anómalo. Nuestro equipo revisará los registros.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Selección de Categoría */}
              <Text style={estilos.etiquetaCampo}>Categoría del Problema</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipsScroll}>
                {CATEGORIAS.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategoria(cat.id)}
                    style={[estilos.chip, categoria === cat.id && estilos.chipActivo]}
                  >
                    <Text style={[estilos.chipTexto, categoria === cat.id && estilos.chipTextoActivo]}>
                      {cat.etiqueta}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Selección de Severidad */}
              <Text style={estilos.etiquetaCampo}>Nivel de Severidad</Text>
              <View style={estilos.filaSeveridad}>
                {SEVERIDADES.map(sev => (
                  <TouchableOpacity
                    key={sev.id}
                    onPress={() => setSeveridad(sev.id)}
                    style={[
                      estilos.severidadBoton,
                      severidad === sev.id && { borderColor: sev.color, backgroundColor: 'rgba(255,255,255,0.06)' }
                    ]}
                  >
                    <View style={[estilos.puntoSeveridad, { backgroundColor: sev.color }]} />
                    <Text style={[estilos.severidadTexto, severidad === sev.id && { color: theme.colors.foreground, fontWeight: '700' }]}>
                      {sev.etiqueta}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Título de la Incidencia */}
              <Input
                label="Título del Reporte"
                placeholder="Ej. Error al estampar firma en PDF escaneado"
                value={titulo}
                onChangeText={setTitulo}
              />

              {/* Descripción */}
              <Input
                label="Descripción Detallada de la Falla"
                placeholder="Explica paso a paso qué ocurrió, qué documento intentabas procesar y el mensaje recibido..."
                multiline
                numberOfLines={5}
                style={estilos.inputArea}
                value={descripcion}
                onChangeText={setDescripcion}
              />

              <View style={estilos.avisoInfo}>
                <Text style={estilos.avisoTexto}>
                  ℹ️ Se adjuntará de forma automática el modelo de tu dispositivo ({Platform.OS} {Platform.Version}) para facilitar la depuración técnica.
                </Text>
              </View>

              <Button
                variant="default"
                size="lg"
                onPress={manejarEnvio}
                cargando={enviando}
                disabled={enviando}
                style={estilos.botonEnviar}
              >
                Enviar Reporte de Incidencia
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card style={estilos.tarjeta}>
            <CardHeader>
              <CardTitle>Historial de Incidencias</CardTitle>
              <CardDescription>
                Consulta el estado de seguimiento y respuestas de los reportes enviados.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {cargandoTickets ? (
                <ActivityIndicator size="small" color={theme.colors.ring} style={{ marginVertical: 20 }} />
              ) : misTickets.length === 0 ? (
                <Text style={estilos.textoVacio}>No tienes incidencias registradas en este momento.</Text>
              ) : (
                misTickets.map(ticket => (
                  <View key={ticket.id} style={estilos.ticketItem}>
                    <View style={estilos.ticketCabecera}>
                      <Badge variant="outline" label={`#${ticket.ticket_number || ticket.id.substring(0, 8)}`} />
                      <Badge
                        variant={ticket.status === 'resuelto' ? 'default' : 'secondary'}
                        label={ticket.status.toUpperCase()}
                      />
                    </View>
                    <Text style={estilos.ticketTitulo}>{ticket.title}</Text>
                    <Text style={estilos.ticketDescripcion} numberOfLines={2}>{ticket.description}</Text>
                    {ticket.admin_response ? (
                      <View style={estilos.respuestaAdmin}>
                        <Text style={estilos.respuestaAdminTitulo}>Respuesta de Soporte:</Text>
                        <Text style={estilos.respuestaAdminTexto}>{ticket.admin_response}</Text>
                      </View>
                    ) : null}
                    <Text style={estilos.ticketFecha}>
                      Reportado el: {new Date(ticket.created_at).toLocaleDateString()}
                    </Text>
                    <Separator style={{ marginVertical: 8 }} />
                  </View>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  pestañasContenedor: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  tabBoton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radii.sm,
  },
  tabActivo: {
    backgroundColor: theme.colors.muted,
  },
  tabTexto: {
    fontSize: theme.typography.labelSmall.fontSize,
    color: theme.colors.mutedForeground,
    fontWeight: '600',
  },
  tabTextoActivo: {
    color: theme.colors.foreground,
  },
  tarjeta: {
    padding: theme.spacing.md,
  },
  etiquetaCampo: {
    fontSize: theme.typography.labelMedium.fontSize,
    color: theme.colors.foreground,
    marginBottom: 8,
    marginTop: 4,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardHover,
    marginRight: 8,
  },
  chipActivo: {
    borderColor: theme.colors.ring,
    backgroundColor: theme.colors.accentMuted,
  },
  chipTexto: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  chipTextoActivo: {
    color: theme.colors.foreground,
    fontWeight: '700',
  },
  filaSeveridad: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  severidadBoton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  puntoSeveridad: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  severidadTexto: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  inputArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  avisoInfo: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderColor: 'rgba(2, 132, 199, 0.2)',
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: 10,
    marginVertical: 12,
  },
  avisoTexto: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    lineHeight: 16,
  },
  botonEnviar: {
    marginTop: 6,
  },
  textoVacio: {
    color: theme.colors.mutedForeground,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 20,
  },
  ticketItem: {
    marginBottom: 10,
  },
  ticketCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketTitulo: {
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  ticketDescripcion: {
    color: theme.colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  ticketFecha: {
    color: theme.colors.mutedForeground,
    fontSize: 11,
  },
  respuestaAdmin: {
    backgroundColor: theme.colors.cardHover,
    padding: 8,
    borderRadius: theme.radii.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.ring,
    marginVertical: 6,
  },
  respuestaAdminTitulo: {
    color: theme.colors.ring,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  respuestaAdminTexto: {
    color: theme.colors.foreground,
    fontSize: 12,
  },
});


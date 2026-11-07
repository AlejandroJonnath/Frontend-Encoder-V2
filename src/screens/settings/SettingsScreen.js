import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share
} from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Separator } from '../../components/ui/Separator';
import { theme } from '../../theme/shadcn';
import { useAuth } from '../../context/AuthContext';
import { useAlerta } from '../../context/AlertContext';
import TermsAndPrivacyModal from '../../components/TermsAndPrivacyModal';
import { exportarDatosUsuario, eliminarCuentaUsuario } from '../../api/support.api';

export default function SettingsScreen({ onVolver, onNavegarASoporte, onNavegarAAdmin }) {
  const { usuario, perfil, cerrarSesion } = useAuth();
  const { mostrarExito, mostrarErrorOperacion } = useAlerta();

  const [modalTerminosVisible, setModalTerminosVisible] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  // Manejar exportación de copia de seguridad
  const manejarExportarBackup = async () => {
    try {
      setExportando(true);
      const res = await exportarDatosUsuario();
      const backupJson = JSON.stringify(res?.backup || {}, null, 2);

      await Share.share({
        title: 'Copia de Seguridad - EncoderGoti',
        message: backupJson
      });

      mostrarExito(
        'Backup Generado',
        'Tu copia de seguridad personal ha sido creada. Puedes guardarla o compartirla como archivo de respaldo.'
      );
    } catch (err) {
      mostrarErrorOperacion(
        'Error al exportar datos',
        err.response?.data?.mensaje || err.message || 'No se pudo generar la copia de seguridad.'
      );
    } finally {
      setExportando(false);
    }
  };

  // Manejar eliminación definitiva de cuenta (Flujo Destructivo con Confirmación Reforzada)
  const manejarEliminarCuenta = () => {
    Alert.alert(
      '¿Seguro quieres borrar tu cuenta?',
      'Esta acción es IRREVERSIBLE. Se eliminarán permanentemente tus documentos, reportes, historial de IA y tu acceso a la plataforma EncoderGoti.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              setEliminando(true);
              await eliminarCuentaUsuario();
              await cerrarSesion();
              mostrarExito(
                'Cuenta Eliminada',
                'Tu cuenta y todos tus datos personales han sido purgados permanentemente de nuestros sistemas.'
              );
            } catch (err) {
              mostrarErrorOperacion(
                'Error al eliminar cuenta',
                err.response?.data?.mensaje || err.message || 'Ocurrió un error al procesar la eliminación.'
              );
            } finally {
              setEliminando(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer
      titulo="Configuración"
      subtitulo="Preferencias, soporte y control de datos"
      onVolver={onVolver}
    >
      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* 1. SECCIÓN DE PERFIL */}
        <Card style={estilos.tarjeta}>
          <CardHeader>
            <View style={estilos.filaCabecera}>
              <CardTitle>Mi Cuenta</CardTitle>
              <Badge variant="outline" label="Activa" />
            </View>
            <CardDescription>Información del usuario conectado</CardDescription>
          </CardHeader>
          <CardContent>
            <View style={estilos.perfilInfo}>
              <Text style={estilos.perfilNombre}>
                {perfil?.first_name || usuario?.user_metadata?.first_name || 'Usuario'} {perfil?.last_name || usuario?.user_metadata?.last_name || ''}
              </Text>
              <Text style={estilos.perfilUsuario}>
                @{perfil?.username || usuario?.user_metadata?.username || 'usuario'}
              </Text>
              <Text style={estilos.perfilEmail}>{usuario?.email || 'correo@ejemplo.com'}</Text>
            </View>

            <Button
              variant="outline"
              label="Cerrar Sesión"
              onPress={cerrarSesion}
              style={{ marginTop: 12 }}
            />
          </CardContent>
        </Card>

        {/* 2. SOPORTE Y ASISTENCIA */}
        <Card style={estilos.tarjeta}>
          <CardHeader>
            <CardTitle>Asistencia Técnica</CardTitle>
            <CardDescription>Crea reportes y comunica fallas a nuestro equipo</CardDescription>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={estilos.opcionFila} onPress={onNavegarASoporte}>
              <View style={estilos.opcionTextoContenedor}>
                <Text style={estilos.opcionTitulo}>Centro de Soporte e Incidencias</Text>
                <Text style={estilos.opcionSubtitulo}>Reportar errores o consultar el estado de tus tickets</Text>
              </View>
              <Text style={estilos.flecha}>→</Text>
            </TouchableOpacity>

            <Separator style={{ marginVertical: 8 }} />

            <TouchableOpacity style={estilos.opcionFila} onPress={onNavegarAAdmin}>
              <View style={estilos.opcionTextoContenedor}>
                <Text style={estilos.opcionTitulo}>Panel de Administrador & Métricas</Text>
                <Text style={estilos.opcionSubtitulo}>Ver estadísticas de uso de apps, salud y monitoreo</Text>
              </View>
              <Text style={estilos.flecha}>→</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* 3. LEGAL Y PRIVACIDAD */}
        <Card style={estilos.tarjeta}>
          <CardHeader>
            <CardTitle>Legal y Privacidad</CardTitle>
            <CardDescription>Consulta las condiciones de servicio y protección de datos</CardDescription>
          </CardHeader>
          <CardContent>
            <TouchableOpacity style={estilos.opcionFila} onPress={() => setModalTerminosVisible(true)}>
              <View style={estilos.opcionTextoContenedor}>
                <Text style={estilos.opcionTitulo}>Políticas de Privacidad y Términos</Text>
                <Text style={estilos.opcionSubtitulo}>Revisa el tratamiento efímero de certificados y firma PAdES</Text>
              </View>
              <Text style={estilos.flecha}>→</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* 4. COPIAS DE SEGURIDAD Y DATOS */}
        <Card style={estilos.tarjeta}>
          <CardHeader>
            <CardTitle>Copia de Seguridad y Datos</CardTitle>
            <CardDescription>Descarga una copia de tu historial y registros</CardDescription>
          </CardHeader>
          <CardContent>
            <Text style={estilos.parrafoInfo}>
              Puedes exportar en cualquier momento un archivo estructurado con todos tus documentos, reportes de soporte y tareas procesadas.
            </Text>
            <Button
              variant="default"
              label="Exportar Copia de Seguridad (JSON)"
              onPress={manejarExportarBackup}
              cargando={exportando}
              disabled={exportando || eliminando}
              style={{ marginTop: 8 }}
            />
          </CardContent>
        </Card>

        {/* 5. ZONA DE PELIGRO: ELIMINACIÓN DE CUENTA */}
        <Card style={[estilos.tarjeta, estilos.tarjetaPeligro]}>
          <CardHeader>
            <View style={estilos.filaCabecera}>
              <CardTitle style={{ color: theme.colors.destructive }}>Zona de Peligro</CardTitle>
              <Badge variant="default" label="Irreversible" style={{ backgroundColor: theme.colors.destructive }} />
            </View>
            <CardDescription>Eliminación definitiva de cuenta y derecho al olvido</CardDescription>
          </CardHeader>
          <CardContent>
            <Text style={estilos.parrafoPeligro}>
              Si decides eliminar tu cuenta, todos tus archivos en la nube, registros de firma, tickets de soporte y credenciales serán borrados para siempre sin posibilidad de recuperación.
            </Text>
            <Button
              variant="outline"
              label="Eliminar mi cuenta y mis datos"
              onPress={manejarEliminarCuenta}
              cargando={eliminando}
              disabled={eliminando || exportando}
              style={estilos.botonEliminar}
            />
          </CardContent>
        </Card>
      </ScrollView>

      {/* Modal de Políticas y Términos en modo lectura */}
      <TermsAndPrivacyModal
        visible={modalTerminosVisible}
        soloLectura={true}
        onCerrar={() => setModalTerminosVisible(false)}
      />
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    padding: theme.spacing.md,
    paddingBottom: 40,
    gap: theme.spacing.md,
  },
  tarjeta: {
    padding: theme.spacing.md,
  },
  tarjetaPeligro: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  filaCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  perfilInfo: {
    backgroundColor: theme.colors.cardHover,
    padding: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  perfilNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  perfilUsuario: {
    fontSize: 13,
    color: theme.colors.ring,
    marginTop: 2,
  },
  perfilEmail: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  opcionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  opcionTextoContenedor: {
    flex: 1,
    marginRight: 12,
  },
  opcionTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  opcionSubtitulo: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    marginTop: 2,
  },
  flecha: {
    fontSize: 18,
    color: theme.colors.ring,
    fontWeight: 'bold',
  },
  parrafoInfo: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 6,
  },
  parrafoPeligro: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 12,
  },
  botonEliminar: {
    borderColor: theme.colors.destructive,
  },
});


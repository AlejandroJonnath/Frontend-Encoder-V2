import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import ScreenContainer from '../../../components/ScreenContainer';
import { useAuth } from '../../../context/AuthContext';
import { useAlerta } from '../../../context/AlertContext';
import { theme } from '../../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Separator } from '../../../components/ui/Separator';
import GoogleIcon from '../../../components/icons/GoogleIcon';
import TermsAndPrivacyModal from '../../../components/TermsAndPrivacyModal';
import axios from 'axios';
import { CONFIGURACION } from '../../../config/constantes';
import { supabase } from '../../../config/supabase';

export default function RegisterScreen({ onIrALogin }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const [bloqueadoGoogle, setBloqueadoGoogle] = useState(false);

  // Estados para el flujo obligatorio de Políticas de Privacidad y Términos
  const [modalTerminosVisible, setModalTerminosVisible] = useState(false);
  const [cargandoTerminos, setCargandoTerminos] = useState(false);
  const [usuarioRegistradoTemporal, setUsuarioRegistradoTemporal] = useState(null);

  const { registrarUsuario, iniciarSesionConGoogle } = useAuth();
  const {
    mostrarErrorCampos,
    mostrarErrorContrasenaDebil,
    mostrarErrorContrasenasNoCoinciden,
    mostrarErrorOperacion,
    mostrarExito
  } = useAlerta();

  const manejarLoginGoogle = async () => {
    try {
      setBloqueadoGoogle(true);
      await iniciarSesionConGoogle();
    } catch (err) {
      mostrarErrorOperacion(
        'Error con Google',
        err.message || 'No se pudo completar el registro/inicio con Google.'
      );
    } finally {
      setBloqueadoGoogle(false);
    }
  };

  const manejarRegistro = async () => {
    if (!nombre || !apellido || !username || !email || !password) {
      mostrarErrorCampos('Por favor completa todos los campos del formulario.');
      return;
    }

    if (password.length < 6) {
      mostrarErrorContrasenaDebil();
      return;
    }

    if (password !== confirmPassword) {
      mostrarErrorContrasenasNoCoinciden();
      return;
    }

    try {
      setBloqueado(true);

      const resultado = await registrarUsuario({ nombre, apellido, username, email, password });
      const usuarioCreado = resultado?.user || (await supabase.auth.getUser())?.data?.user;

      setUsuarioRegistradoTemporal(usuarioCreado);
      // Inmediatamente tras registrarse, desplegar obligatoriamente las Políticas y Términos
      setModalTerminosVisible(true);
    } catch (err) {
      mostrarErrorOperacion('Error al registrar', err.message || 'No se pudo completar el registro.');
    } finally {
      setBloqueado(false);
    }
  };

  const manejarAceptarTerminos = async () => {
    try {
      setCargandoTerminos(true);

      // Registrar consentimiento en backend
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await axios.post(
            `${CONFIGURACION.API_BASE_URL}/auth/consentimiento`,
            { policyVersion: '1.0.0', termsVersion: '1.0.0' },
            { headers: { Authorization: `Bearer ${session.access_token}` } }
          );
        }
      } catch (apiErr) {
        console.warn('[Consentimiento] Aviso al enviar consentimiento al backend:', apiErr.message);
      }

      setModalTerminosVisible(false);
      mostrarExito(
        '¡Registro y Términos Aceptados!',
        'Tu cuenta ha sido activada correctamente. Ya puedes iniciar sesión en EncoderGoti.',
        onIrALogin
      );
    } catch (err) {
      mostrarErrorOperacion('Error', 'No se pudo registrar la aceptación: ' + err.message);
    } finally {
      setCargandoTerminos(false);
    }
  };

  const manejarRechazarTerminos = async () => {
    try {
      setCargandoTerminos(true);

      // Si el usuario rechaza, disparar rollback para purgar la cuenta recién creada
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await axios.post(
            `${CONFIGURACION.API_BASE_URL}/auth/rollback-registration`,
            {},
            { headers: { Authorization: `Bearer ${session.access_token}` } }
          );
        }
      } catch (apiErr) {
        console.warn('[Rollback] Aviso rollback en backend:', apiErr.message);
      }

      // Cerrar sesión en el cliente
      await supabase.auth.signOut();
      setModalTerminosVisible(false);
      setUsuarioRegistradoTemporal(null);

      mostrarExito(
        'Registro Cancelado',
        'Has rechazado las políticas de privacidad y términos. Tu cuenta y datos temporales han sido eliminados por completo.',
        onIrALogin
      );
    } catch (err) {
      setModalTerminosVisible(false);
      mostrarErrorOperacion('Aviso', 'El registro fue cancelado y se cerró la sesión.');
      onIrALogin();
    } finally {
      setCargandoTerminos(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Registro"
      subtitulo="Crea tu cuenta de usuario"
      onVolver={onIrALogin}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={estilos.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Card style={estilos.tarjeta}>
            <CardHeader style={estilos.headerTarjeta}>
              <CardTitle style={estilos.titulo}>Crear Cuenta</CardTitle>
              <CardDescription style={estilos.subtitulo}>
                Únete a EncoderGoti para gestionar tus documentos y firmas
              </CardDescription>
            </CardHeader>

            <CardContent>
              <View style={estilos.filaDoble}>
                <View style={[estilos.columna, { marginRight: 6 }]}>
                  <Input label="Nombre" placeholder="Juan" value={nombre} onChangeText={setNombre} />
                </View>
                <View style={[estilos.columna, { marginLeft: 6 }]}>
                  <Input label="Apellido" placeholder="Pérez" value={apellido} onChangeText={setApellido} />
                </View>
              </View>

              <Input
                label="Nombre de Usuario"
                placeholder="juanperez"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
              <Input
                label="Correo Electrónico"
                placeholder="tu@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <Input
                label="Contraseña"
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Input
                label="Confirmar Contraseña"
                placeholder="Repite tu contraseña"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Button
                variant="default"
                size="lg"
                onPress={manejarRegistro}
                cargando={bloqueado}
                disabled={bloqueado || bloqueadoGoogle}
                style={estilos.botonPrincipal}
              >
                Crear Cuenta
              </Button>

              <View style={estilos.divisorContenedor}>
                <Separator style={estilos.lineaDivisor} />
                <Text style={estilos.textoDivisor}>O continuar con</Text>
                <Separator style={estilos.lineaDivisor} />
              </View>

              <Button
                variant="outline"
                size="lg"
                onPress={manejarLoginGoogle}
                cargando={bloqueadoGoogle}
                disabled={bloqueado || bloqueadoGoogle}
                icon={<GoogleIcon size={18} />}
                style={estilos.botonGoogle}
              >
                Continuar con Google
              </Button>

              <View style={estilos.filaRegistro}>
                <Text style={estilos.textoSecundario}>¿Ya tienes una cuenta? </Text>
                <TouchableOpacity onPress={onIrALogin}>
                  <Text style={estilos.linkRegistro}>Inicia sesión</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal obligatorio de Políticas de Privacidad y Términos de Uso con rollback */}
      <TermsAndPrivacyModal
        visible={modalTerminosVisible}
        cargando={cargandoTerminos}
        onAceptar={manejarAceptarTerminos}
        onRechazar={manejarRechazarTerminos}
      />
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: { padding: 18, paddingBottom: 32 },
  tarjeta: { padding: 22 },
  headerTarjeta: { marginBottom: 16 },
  titulo: { fontSize: 20, fontWeight: '700', color: theme.colors.foreground, letterSpacing: -0.3 },
  subtitulo: { fontSize: 13, color: theme.colors.mutedForeground, marginTop: 4 },
  filaDoble: { flexDirection: 'row', width: '100%' },
  columna: { flex: 1 },
  botonPrincipal: { width: '100%', marginTop: 8, marginBottom: 6 },
  divisorContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  lineaDivisor: {
    flex: 1,
    marginVertical: 0,
    backgroundColor: theme.colors.border,
  },
  textoDivisor: {
    marginHorizontal: 10,
    fontSize: 12,
    color: theme.colors.mutedForeground,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  botonGoogle: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: theme.colors.border,
  },
  filaRegistro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  textoSecundario: { fontSize: 13, color: theme.colors.mutedForeground },
  linkRegistro: { fontSize: 13, color: theme.colors.foreground, fontWeight: '600', textDecorationLine: 'underline' },
});

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
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import ScreenContainer from '../../../components/ScreenContainer';
import { useAlerta } from '../../../context/AlertContext';
import { theme } from '../../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { CONFIGURACION } from '../../../config/constantes';

export default function ForgotPasswordScreen({ onVolverALogin }) {
  const [paso, setPaso] = useState(1); // 1: Solicitar OTP por email, 2: Ingresar OTP y nueva contraseña
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { mostrarErrorCampos, mostrarErrorOperacion, mostrarExito } = useAlerta();

  // Paso 1: Enviar OTP por EmailJS
  const manejarSolicitarCodigo = async () => {
    if (!email || !email.includes('@')) {
      mostrarErrorCampos('Ingresa una dirección de correo válida asociada a tu cuenta.');
      return;
    }

    try {
      setEnviando(true);
      const url = `${CONFIGURACION.API_BASE_URL}/auth/solicitar-recuperacion`;
      await axios.post(url, { email: email.trim().toLowerCase() });
      
      mostrarExito(
        'Código Enviado',
        'Hemos enviado un código de seguridad de 6 dígitos a tu correo electrónico. Revisa tu bandeja de entrada o spam.'
      );
      setPaso(2);
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || err.message || 'No se pudo enviar el código de recuperación.';
      mostrarErrorOperacion('Error al solicitar código', mensaje);
    } finally {
      setEnviando(false);
    }
  };

  // Paso 2: Verificar OTP y actualizar contraseña
  const manejarRestablecerContrasena = async () => {
    if (!otp || otp.trim().length < 6) {
      mostrarErrorCampos('Ingresa el código OTP de 6 dígitos recibido por correo.');
      return;
    }
    if (!nuevaContrasena || nuevaContrasena.length < 6) {
      mostrarErrorCampos('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      mostrarErrorCampos('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    try {
      setEnviando(true);
      const url = `${CONFIGURACION.API_BASE_URL}/auth/restablecer-contrasena`;
      await axios.post(url, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        nuevaContrasena
      });

      mostrarExito(
        '¡Contraseña Restablecida!',
        'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva clave.',
        onVolverALogin
      );
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || err.message || 'No se pudo restablecer la contraseña.';
      mostrarErrorOperacion('Error al restablecer contraseña', mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Recuperar Contraseña"
      subtitulo={paso === 1 ? 'Te ayudamos a recuperar tu acceso' : 'Verifica el código y define tu nueva clave'}
      onVolver={paso === 2 ? () => setPaso(1) : onVolverALogin}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          <Card style={estilos.tarjeta}>
            <CardHeader style={estilos.headerTarjeta}>
              <View style={estilos.logoCaja}>
                <Feather name={paso === 1 ? 'mail' : 'shield'} size={24} color={theme.colors.foreground} />
              </View>
              <CardTitle style={estilos.titulo}>
                {paso === 1 ? 'Recuperar Contraseña' : 'Ingresa el Código OTP'}
              </CardTitle>
              <CardDescription style={estilos.subtitulo}>
                {paso === 1
                  ? 'Ingresa tu correo registrado y te enviaremos un código de seguridad de 6 dígitos.'
                  : `Ingresa el código que enviamos a ${email} y tu nueva contraseña.`}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {paso === 1 ? (
                <>
                  <Input
                    label="Correo Electrónico Registrado"
                    placeholder="ejemplo@correo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />

                  <Button
                    variant="default"
                    size="lg"
                    onPress={manejarSolicitarCodigo}
                    cargando={enviando}
                    disabled={enviando}
                    style={estilos.botonPrincipal}
                  >
                    Enviar Código de Recuperación
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    label="Código de Seguridad (6 dígitos)"
                    placeholder="123456"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />

                  <Input
                    label="Nueva Contraseña"
                    placeholder="Mínimo 6 caracteres"
                    secureTextEntry
                    value={nuevaContrasena}
                    onChangeText={setNuevaContrasena}
                  />

                  <Input
                    label="Confirmar Nueva Contraseña"
                    placeholder="Repite tu nueva contraseña"
                    secureTextEntry
                    value={confirmarContrasena}
                    onChangeText={setConfirmarContrasena}
                  />

                  <Button
                    variant="default"
                    size="lg"
                    onPress={manejarRestablecerContrasena}
                    cargando={enviando}
                    disabled={enviando}
                    style={estilos.botonPrincipal}
                  >
                    Restablecer Contraseña
                  </Button>

                  <TouchableOpacity
                    style={estilos.botonReenviar}
                    onPress={manejarSolicitarCodigo}
                    disabled={enviando}
                  >
                    <Feather name="refresh-cw" size={13} color={theme.colors.mutedForeground} style={{ marginRight: 6 }} />
                    <Text style={estilos.textoVolver}>Reenviar código a mi correo</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={estilos.botonVolver}
                onPress={paso === 2 ? () => setPaso(1) : onVolverALogin}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={14} color={theme.colors.mutedForeground} style={{ marginRight: 6 }} />
                <Text style={estilos.textoVolver}>
                  {paso === 2 ? 'Cambiar correo' : 'Regresar al Inicio de Sesión'}
                </Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  tarjeta: { padding: 24 },
  headerTarjeta: { alignItems: 'center', marginBottom: 20 },
  logoCaja: {
    width: 48, height: 48, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary, justifyContent: 'center',
    alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border,
  },
  titulo: { fontSize: 20, fontWeight: '700', color: theme.colors.foreground, letterSpacing: -0.3, textAlign: 'center' },
  subtitulo: { fontSize: 13, color: theme.colors.mutedForeground, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  botonPrincipal: { width: '100%', marginTop: 8, marginBottom: 12 },
  botonReenviar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, marginBottom: 8 },
  botonVolver: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  textoVolver: { fontSize: 13, color: theme.colors.mutedForeground, fontWeight: '500' },
});

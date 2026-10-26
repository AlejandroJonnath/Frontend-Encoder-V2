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
import ScreenContainer from '../../../components/ScreenContainer';
import { useAuth } from '../../../context/AuthContext';
import { useAlerta } from '../../../context/AlertContext';
import { theme } from '../../../theme/shadcn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export default function ForgotPasswordScreen({ onVolverALogin }) {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { recuperarContrasena } = useAuth();
  const { mostrarErrorCampos, mostrarErrorOperacion, mostrarExito } = useAlerta();

  const manejarRecuperacion = async () => {
    if (!email) {
      mostrarErrorCampos('Ingresa la dirección de correo asociada a tu cuenta para restablecer la clave.');
      return;
    }

    try {
      setEnviando(true);
      await recuperarContrasena(email);
      mostrarExito(
        'Enlace Enviado',
        'Hemos enviado un correo electrónico con las instrucciones para restablecer tu contraseña. Revisa también tu carpeta de spam.',
        onVolverALogin
      );
    } catch (err) {
      mostrarErrorOperacion('Error al enviar correo', err.message || 'No se pudo enviar el correo de recuperación.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScreenContainer
      titulo="Recuperar Contraseña"
      subtitulo="Te ayudamos a recuperar tu acceso"
      onVolver={onVolverALogin}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
          <Card style={estilos.tarjeta}>
            <CardHeader style={estilos.headerTarjeta}>
              <View style={estilos.logoCaja}>
                <Feather name="key" size={24} color={theme.colors.foreground} />
              </View>
              <CardTitle style={estilos.titulo}>Recuperar Contraseña</CardTitle>
              <CardDescription style={estilos.subtitulo}>
                Ingresa tu correo registrado y te enviaremos las instrucciones de restablecimiento.
              </CardDescription>
            </CardHeader>

            <CardContent>
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
                onPress={manejarRecuperacion}
                cargando={enviando}
                disabled={enviando}
                style={estilos.botonPrincipal}
              >
                Enviar Enlace de Recuperación
              </Button>

              <TouchableOpacity style={estilos.botonVolver} onPress={onVolverALogin} activeOpacity={0.7}>
                <Feather name="arrow-left" size={14} color={theme.colors.mutedForeground} style={{ marginRight: 6 }} />
                <Text style={estilos.textoVolver}>Regresar al Inicio de Sesión</Text>
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
  botonPrincipal: { width: '100%', marginTop: 8, marginBottom: 16 },
  botonVolver: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  textoVolver: { fontSize: 13, color: theme.colors.mutedForeground, fontWeight: '500' },
});

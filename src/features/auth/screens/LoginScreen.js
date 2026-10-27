import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
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

export default function LoginScreen({ onIrARegistro, onIrAOlvidasteContrasena }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const [bloqueadoGoogle, setBloqueadoGoogle] = useState(false);
  const { iniciarSesion, iniciarSesionConGoogle } = useAuth();
  const { mostrarErrorCampos, mostrarErrorContrasena, mostrarErrorOperacion } = useAlerta();

  const manejarLogin = async () => {
    if (!email || !password) {
      mostrarErrorCampos('Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    try {
      setBloqueado(true);
      await iniciarSesion(email, password);
    } catch (err) {
      mostrarErrorContrasena(
        err.message || 'Verifica tus credenciales de acceso.',
        onIrAOlvidasteContrasena
      );
    } finally {
      setBloqueado(false);
    }
  };

  const manejarLoginGoogle = async () => {
    try {
      setBloqueadoGoogle(true);
      await iniciarSesionConGoogle();
    } catch (err) {
      mostrarErrorOperacion(
        'Error con Google',
        err.message || 'No se pudo iniciar sesión con tu cuenta de Google.'
      );
    } finally {
      setBloqueadoGoogle(false);
    }
  };

  return (
    <ScreenContainer>
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
              <View style={estilos.contenedorLogo}>
                <Image
                  source={require('../../../img/LogoCompleto.png')}
                  style={estilos.logoCompleto}
                  resizeMode="contain"
                />
              </View>
              <CardTitle style={estilos.titulo}>EncoderGoti</CardTitle>
              <CardDescription style={estilos.subtitulo}>
                Suite Documental &amp; Firma Digital
              </CardDescription>
            </CardHeader>

            <CardContent style={estilos.form}>
              <Input
                label="Correo Electrónico"
                placeholder="ejemplo@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Input
                label="Contraseña"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                style={estilos.botonOlvido}
                onPress={onIrAOlvidasteContrasena}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={estilos.textoOlvido}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              <Button
                variant="default"
                size="lg"
                onPress={manejarLogin}
                cargando={bloqueado}
                disabled={bloqueado || bloqueadoGoogle}
                style={estilos.botonPrincipal}
              >
                Iniciar Sesión
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
                <Text style={estilos.textoSecundario}>¿No tienes una cuenta? </Text>
                <TouchableOpacity onPress={onIrARegistro}>
                  <Text style={estilos.linkRegistro}>Crear cuenta nueva</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  tarjeta: {
    padding: 24,
  },
  headerTarjeta: {
    alignItems: 'center',
    marginBottom: 20,
  },
  contenedorLogo: {
    width: 110,
    height: 110,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.cardHover,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    padding: 6,
    overflow: 'hidden',
  },
  logoCompleto: {
    width: '100%',
    height: '100%',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.foreground,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  botonOlvido: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  textoOlvido: {
    fontSize: 13,
    color: theme.colors.ring,
    fontWeight: '500',
  },
  botonPrincipal: {
    width: '100%',
    marginBottom: 6,
  },
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
  filaRegistro: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoSecundario: {
    fontSize: 13,
    color: theme.colors.mutedForeground,
  },
  linkRegistro: {
    fontSize: 13,
    color: theme.colors.foreground,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

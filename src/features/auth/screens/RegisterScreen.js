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

export default function RegisterScreen({ onIrALogin }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bloqueado, setBloqueado] = useState(false);

  const { registrarUsuario } = useAuth();
  const {
    mostrarErrorCampos,
    mostrarErrorContrasenaDebil,
    mostrarErrorContrasenasNoCoinciden,
    mostrarErrorOperacion,
    mostrarExito
  } = useAlerta();

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
      await registrarUsuario({ nombre, apellido, username, email, password });

      mostrarExito(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Si Supabase requiere confirmación por correo, revisa tu bandeja de entrada antes de iniciar sesión.',
        onIrALogin
      );
    } catch (err) {
      mostrarErrorOperacion('Error al registrar', err.message || 'No se pudo completar el registro.');
    } finally {
      setBloqueado(false);
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
                disabled={bloqueado}
                style={estilos.botonPrincipal}
              >
                Crear Cuenta
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
  botonPrincipal: { width: '100%', marginTop: 8, marginBottom: 18 },
  filaRegistro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  textoSecundario: { fontSize: 13, color: theme.colors.mutedForeground },
  linkRegistro: { fontSize: 13, color: theme.colors.foreground, fontWeight: '600', textDecorationLine: 'underline' },
});

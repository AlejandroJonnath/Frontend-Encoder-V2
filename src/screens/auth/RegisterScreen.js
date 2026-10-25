import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ onIrALogin }) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bloqueado, setBloqueado] = useState(false);

  const { registrarUsuario } = useAuth();

  const manejarRegistro = async () => {
    if (!nombre || !apellido || !username || !email || !password) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos del formulario.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Asegúrate de que ambas contraseñas sean idénticas.');
      return;
    }

    try {
      setBloqueado(true);
      await registrarUsuario({
        nombre,
        apellido,
        username,
        email,
        password
      });

      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Si Supabase requiere confirmación por correo, revisa tu bandeja de entrada antes de iniciar sesión.',
        [{ text: 'Iniciar Sesión', onPress: onIrALogin }]
      );
    } catch (err) {
      Alert.alert('Error al registrar', err.message || 'No se pudo completar el registro.');
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
          <View style={estilos.tarjeta}>
            <Text style={estilos.titulo}>Únete a PDF Master</Text>
            <Text style={estilos.subtitulo}>
              Ingresa tus datos para registrarte en el sistema
            </Text>

            <View style={estilos.filaDoble}>
              <View style={[estilos.grupoInput, { flex: 1, marginRight: 8 }]}>
                <Text style={estilos.etiqueta}>Nombre</Text>
                <TextInput
                  style={estilos.input}
                  placeholder="Juan"
                  placeholderTextColor="#64748B"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>

              <View style={[estilos.grupoInput, { flex: 1, marginLeft: 8 }]}>
                <Text style={estilos.etiqueta}>Apellido</Text>
                <TextInput
                  style={estilos.input}
                  placeholder="Pérez"
                  placeholderTextColor="#64748B"
                  value={apellido}
                  onChangeText={setApellido}
                />
              </View>
            </View>

            <View style={estilos.grupoInput}>
              <Text style={estilos.etiqueta}>Nombre de Usuario</Text>
              <TextInput
                style={estilos.input}
                placeholder="juanperez26"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={estilos.grupoInput}>
              <Text style={estilos.etiqueta}>Correo Electrónico</Text>
              <TextInput
                style={estilos.input}
                placeholder="tu@correo.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={estilos.grupoInput}>
              <Text style={estilos.etiqueta}>Contraseña</Text>
              <TextInput
                style={estilos.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#64748B"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={estilos.grupoInput}>
              <Text style={estilos.etiqueta}>Confirmar Contraseña</Text>
              <TextInput
                style={estilos.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#64748B"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={[estilos.botonPrincipal, bloqueado && { opacity: 0.7 }]}
              onPress={manejarRegistro}
              disabled={bloqueado}
              activeOpacity={0.8}
            >
              {bloqueado ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={estilos.textoBotonPrincipal}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>

            <View style={estilos.filaRegistro}>
              <Text style={estilos.textoSecundario}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={onIrALogin}>
                <Text style={estilos.linkRegistro}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 30,
  },
  tarjeta: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
  },
  filaDoble: {
    flexDirection: 'row',
    width: '100%',
  },
  grupoInput: {
    width: '100%',
    marginBottom: 14,
  },
  etiqueta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#F8FAFC',
  },
  botonPrincipal: {
    width: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  filaRegistro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoSecundario: {
    fontSize: 13,
    color: '#94A3B8',
  },
  linkRegistro: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: 'bold',
  },
});

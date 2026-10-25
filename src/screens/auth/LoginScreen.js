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

export default function LoginScreen({ onIrARegistro, onIrAOlvidasteContrasena }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const { iniciarSesion } = useAuth();

  const manejarLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setBloqueado(true);
      await iniciarSesion(email, password);
    } catch (err) {
      Alert.alert('Error al iniciar sesión', err.message || 'Verifica tus credenciales.');
    } finally {
      setBloqueado(false);
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
          <View style={estilos.tarjeta}>
            <View style={estilos.logoCaja}>
              <Text style={estilos.iconoApp}>📄</Text>
            </View>
            <Text style={estilos.titulo}>PDF Master & FirmaEC</Text>
            <Text style={estilos.subtitulo}>
              Inicia sesión con tu correo para acceder a todas las herramientas
            </Text>

            <View style={estilos.grupoInput}>
              <Text style={estilos.etiqueta}>Correo Electrónico</Text>
              <TextInput
                style={estilos.input}
                placeholder="ejemplo@correo.com"
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
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={estilos.botonOlvido}
              onPress={onIrAOlvidasteContrasena}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={estilos.textoOlvido}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[estilos.botonPrincipal, bloqueado && { opacity: 0.7 }]}
              onPress={manejarLogin}
              disabled={bloqueado}
              activeOpacity={0.8}
            >
              {bloqueado ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={estilos.textoBotonPrincipal}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <View style={estilos.filaRegistro}>
              <Text style={estilos.textoSecundario}>¿No tienes una cuenta? </Text>
              <TouchableOpacity onPress={onIrARegistro}>
                <Text style={estilos.linkRegistro}>Crear cuenta nueva</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  tarjeta: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  logoCaja: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  iconoApp: {
    fontSize: 32,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  grupoInput: {
    width: '100%',
    marginBottom: 16,
  },
  etiqueta: {
    fontSize: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F8FAFC',
  },
  botonOlvido: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  textoOlvido: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '600',
  },
  botonPrincipal: {
    width: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
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
    letterSpacing: 0.3,
  },
  filaRegistro: {
    flexDirection: 'row',
    alignItems: 'center',
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

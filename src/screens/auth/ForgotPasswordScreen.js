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

export default function ForgotPasswordScreen({ onVolverALogin }) {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { recuperarContrasena } = useAuth();

  const manejarRecuperacion = async () => {
    if (!email) {
      Alert.alert('Correo requerido', 'Ingresa la dirección de correo asociada a tu cuenta.');
      return;
    }

    try {
      setEnviando(true);
      await recuperarContrasena(email);
      Alert.alert(
        'Enlace Enviado',
        'Hemos enviado un correo electrónico con las instrucciones para restablecer tu contraseña. Revisa también tu carpeta de spam.',
        [{ text: 'Entendido', onPress: onVolverALogin }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo enviar el correo de recuperación.');
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
        <ScrollView
          contentContainerStyle={estilos.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={estilos.tarjeta}>
            <View style={estilos.logoCaja}>
              <Text style={estilos.iconoApp}>🔐</Text>
            </View>
            <Text style={estilos.titulo}>¿Olvidaste tu contraseña?</Text>
            <Text style={estilos.subtitulo}>
              Escribe el correo electrónico con el que te registraste y te enviaremos un enlace seguro para crear una nueva contraseña.
            </Text>

            <View style={estilos.grupoInput}>
              <Text style={estilos.etiqueta}>Correo Electrónico Registrado</Text>
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

            <TouchableOpacity
              style={[estilos.botonPrincipal, enviando && { opacity: 0.7 }]}
              onPress={manejarRecuperacion}
              disabled={enviando}
              activeOpacity={0.8}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={estilos.textoBotonPrincipal}>Enviar Correo de Recuperación</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonVolver}
              onPress={onVolverALogin}
            >
              <Text style={estilos.textoVolver}>← Regresar al Inicio de Sesión</Text>
            </TouchableOpacity>
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
    fontSize: 30,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  grupoInput: {
    width: '100%',
    marginBottom: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F8FAFC',
  },
  botonPrincipal: {
    width: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
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
  botonVolver: {
    paddingVertical: 10,
  },
  textoVolver: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: '600',
  },
});

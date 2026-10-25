import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/dashboard/HomeScreen';

// Pantallas de Operaciones
import SignPdfScreen from './src/screens/operations/SignPdfScreen';
import CompressPdfScreen from './src/screens/operations/CompressPdfScreen';
import MergePdfScreen from './src/screens/operations/MergePdfScreen';
import AddNoteScreen from './src/screens/operations/AddNoteScreen';
import GroqAiScreen from './src/screens/operations/GroqAiScreen';

// Herramientas de Conversión Separadas
import ConvertWordScreen from './src/screens/operations/ConvertWordScreen';
import ConvertExcelScreen from './src/screens/operations/ConvertExcelScreen';
import ConvertPptScreen from './src/screens/operations/ConvertPptScreen';
import ConvertTxtScreen from './src/screens/operations/ConvertTxtScreen';
import ConvertImageScreen from './src/screens/operations/ConvertImageScreen';

function NavegadorPrincipal() {
  const { usuario, cargando } = useAuth();
  const [rutaAuth, setRutaAuth] = useState('login'); // 'login', 'registro', 'olvidaste'
  const [rutaApp, setRutaApp] = useState('home');

  if (cargando) {
    return (
      <View style={estilos.cargandoContenedor}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  // 1. Vistas de Autenticación si el usuario no ha iniciado sesión
  if (!usuario) {
    if (rutaAuth === 'registro') {
      return <RegisterScreen onIrALogin={() => setRutaAuth('login')} />;
    }
    if (rutaAuth === 'olvidaste') {
      return <ForgotPasswordScreen onVolverALogin={() => setRutaAuth('login')} />;
    }
    return (
      <LoginScreen
        onIrARegistro={() => setRutaAuth('registro')}
        onIrAOlvidasteContrasena={() => setRutaAuth('olvidaste')}
      />
    );
  }

  // 2. Vistas de la Aplicación si el usuario está autenticado
  switch (rutaApp) {
    case 'firmar':
      return <SignPdfScreen onVolver={() => setRutaApp('home')} />;
    case 'comprimir':
      return <CompressPdfScreen onVolver={() => setRutaApp('home')} />;
    case 'unir':
      return <MergePdfScreen onVolver={() => setRutaApp('home')} />;
    case 'notas':
      return <AddNoteScreen onVolver={() => setRutaApp('home')} />;
    case 'ia':
      return <GroqAiScreen onVolver={() => setRutaApp('home')} />;

    // Herramientas de Conversión Separadas
    case 'convert_word':
      return <ConvertWordScreen onVolver={() => setRutaApp('home')} />;
    case 'convert_excel':
      return <ConvertExcelScreen onVolver={() => setRutaApp('home')} />;
    case 'convert_ppt':
      return <ConvertPptScreen onVolver={() => setRutaApp('home')} />;
    case 'convert_txt':
      return <ConvertTxtScreen onVolver={() => setRutaApp('home')} />;
    case 'convert_image':
      return <ConvertImageScreen onVolver={() => setRutaApp('home')} />;

    case 'home':
    default:
      return <HomeScreen onNavegar={(pantalla) => setRutaApp(pantalla)} />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AlertProvider>
        <AuthProvider>
          <StatusBar barStyle="light-content" backgroundColor="#09090B" />
          <NavegadorPrincipal />
        </AuthProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  cargandoContenedor: {
    flex: 1,
    backgroundColor: '#09090B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../features/dashboard/screens/HomeScreen';
import SignPdfScreen from '../features/firma/screens/SignPdfScreen';
import CompressPdfScreen from '../features/pdf/screens/CompressPdfScreen';
import MergePdfScreen from '../features/pdf/screens/MergePdfScreen';
import AddNoteScreen from '../features/pdf/screens/AddNoteScreen';
import GroqAiScreen from '../features/ia/screens/GroqAiScreen';
import ConvertWordScreen from '../features/conversion/screens/ConvertWordScreen';
import ConvertExcelScreen from '../features/conversion/screens/ConvertExcelScreen';
import ConvertTxtScreen from '../features/conversion/screens/ConvertTxtScreen';
import ConvertImageScreen from '../features/conversion/screens/ConvertImageScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SupportScreen from '../screens/settings/SupportScreen';
import AdminScreen from '../screens/admin/AdminScreen';

//  Navegador del flujo de operaciones documentales protegidas.
// Importa directamente desde la ubicación canónica en features/*/screens 
export function OperationNavigator() {
  const [ruta, setRuta] = useState('home');
  const { usuario, perfil } = useAuth();

  const esAdmin =
    perfil?.role === 'admin' ||
    perfil?.is_admin === true ||
    usuario?.app_metadata?.role === 'admin' ||
    usuario?.user_metadata?.role === 'admin' ||
    usuario?.email?.toLowerCase() === 'alejo.admin@hotmail.com' ||
    usuario?.email?.toLowerCase() === 'adriel.admin@hotmail.com';

  const volverAHome = () => setRuta('home');

  switch (ruta) {
    case 'configuracion':
      return (
        <SettingsScreen
          onVolver={volverAHome}
          onNavegarASoporte={() => setRuta('soporte')}
          onNavegarAAdmin={() => {
            if (!esAdmin) {
              Alert.alert('Acceso Denegado', 'No cuentas con privilegios de administrador.');
              return;
            }
            setRuta('admin');
          }}
        />
      );
    case 'soporte':
      return <SupportScreen onVolver={() => setRuta('configuracion')} />;
    case 'admin':
      if (!esAdmin) {
        return (
          <SettingsScreen
            onVolver={volverAHome}
            onNavegarASoporte={() => setRuta('soporte')}
            onNavegarAAdmin={() => {}}
          />
        );
      }
      return <AdminScreen onVolver={() => setRuta('configuracion')} />;

    case 'firmar':
      return <SignPdfScreen onVolver={volverAHome} />;
    case 'comprimir':
      return <CompressPdfScreen onVolver={volverAHome} />;
    case 'unir':
      return <MergePdfScreen onVolver={volverAHome} />;
    case 'notas':
      return <AddNoteScreen onVolver={volverAHome} />;
    case 'ia':
      return <GroqAiScreen onVolver={volverAHome} />;

    // Herramientas de Conversión
    case 'convert_word':
      return <ConvertWordScreen onVolver={volverAHome} />;
    case 'convert_excel':
      return <ConvertExcelScreen onVolver={volverAHome} />;
    case 'convert_txt':
      return <ConvertTxtScreen onVolver={volverAHome} />;
    case 'convert_image':
      return <ConvertImageScreen onVolver={volverAHome} />;

    case 'home':
    default:
      return <HomeScreen onNavegar={(pantalla) => setRuta(pantalla)} />;
  }
}

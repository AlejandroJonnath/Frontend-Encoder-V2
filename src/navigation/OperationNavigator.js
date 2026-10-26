import React, { useState } from 'react';
import HomeScreen from '../features/dashboard/screens/HomeScreen';
import SignPdfScreen from '../features/firma/screens/SignPdfScreen';
import CompressPdfScreen from '../features/pdf/screens/CompressPdfScreen';
import MergePdfScreen from '../features/pdf/screens/MergePdfScreen';
import AddNoteScreen from '../features/pdf/screens/AddNoteScreen';
import GroqAiScreen from '../features/ia/screens/GroqAiScreen';
import ConvertWordScreen from '../features/conversion/screens/ConvertWordScreen';
import ConvertExcelScreen from '../features/conversion/screens/ConvertExcelScreen';
import ConvertPptScreen from '../features/conversion/screens/ConvertPptScreen';
import ConvertTxtScreen from '../features/conversion/screens/ConvertTxtScreen';
import ConvertImageScreen from '../features/conversion/screens/ConvertImageScreen';

//  Navegador del flujo de operaciones documentales protegidas.
// Importa directamente desde la ubicación canónica en features/*/screens 
export function OperationNavigator() {
  const [ruta, setRuta] = useState('home');

  const volverAHome = () => setRuta('home');

  switch (ruta) {
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
    case 'convert_ppt':
      return <ConvertPptScreen onVolver={volverAHome} />;
    case 'convert_txt':
      return <ConvertTxtScreen onVolver={volverAHome} />;
    case 'convert_image':
      return <ConvertImageScreen onVolver={volverAHome} />;

    case 'home':
    default:
      return <HomeScreen onNavegar={(pantalla) => setRuta(pantalla)} />;
  }
}

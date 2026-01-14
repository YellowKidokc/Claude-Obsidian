/**
 * Pipeline - Data Sovereignty Layer
 *
 * Main application entry point.
 * A personal data operating system with four layers:
 * - Surface (Markdown)
 * - Structure (Navigation)
 * - Logic (Computation)
 * - AI (Intelligence)
 */

import { AppProvider } from './store';
import { MainLayout } from './components';

function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;

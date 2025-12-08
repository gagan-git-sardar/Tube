
import Map from './components/Map/Map';
import Overlay from './components/UI/Overlay';
import './App.css';
import { TubeProvider } from './context/TubeContext';

function App() {
  return (
    <TubeProvider>
      <div className="app-container">
        <Overlay />
        <Map />
      </div>
    </TubeProvider>
  );
}

export default App;

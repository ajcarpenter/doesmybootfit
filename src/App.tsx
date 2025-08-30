import React from 'react';
import './App.css';
import '../styles/main.css';
import CanvasContainer from './components/CanvasContainer';
import Sidebar from './Sidebar';

import { useStore } from './store/store';

const App: React.FC = () => {
  const loadFromSharedHash = useStore((s) => s.loadFromSharedHash);

  React.useEffect(() => {
    loadFromSharedHash();
  }, [loadFromSharedHash]);

  return (
    <div className="container">
      <Sidebar />
      <CanvasContainer />
    </div>
  );
};

export default App;

// ================================================================
// App.js — Point d'entrée de DAUST-Thérapie
// Gère les 3 modes : login / face (robot) / controller (thérapeute)
// ================================================================

import React, { useState, useEffect } from 'react';
import Login      from './Login';
import RobotFace  from './RobotFace';
import Controller from './Controller';
import './App.css';

function App() {
  const [mode,     setMode]     = useState('login');
  const [roomCode, setRoomCode] = useState('');

  // Lire les paramètres URL pour démarrage automatique
  // Utile pour le Raspberry Pi : ?room=SALLE01_mdp&mode=face
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const room     = params.get('room');
    const autoMode = params.get('mode');
    if (room && autoMode) {
      setRoomCode(room);
      setMode(autoMode);
    }
  }, []);

  const handleJoin = (selectedMode, code) => {
    setRoomCode(code);
    setMode(selectedMode);
  };

  // Retour à l'accueil quand la session se termine
  const handleEndSession = () => {
    setMode('login');
    setRoomCode('');
  };

  if (mode === 'face')       return <RobotFace  roomCode={roomCode} />;
  if (mode === 'controller') return <Controller roomCode={roomCode} onEndSession={handleEndSession} />;
  return <Login onJoin={handleJoin} />;
}

export default App;
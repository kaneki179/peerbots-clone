import React, { useState } from 'react';
import Login      from './Login';
import RobotFace  from './RobotFace';
import Controller from './Controller';
import './App.css';

function App() {
  const [mode, setMode]         = useState('login');
  const [roomCode, setRoomCode] = useState('');

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
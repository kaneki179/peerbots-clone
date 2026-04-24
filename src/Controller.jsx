// ================================================================
// Controller.jsx — VERSION PRO
// Nouvelles fonctionnalités :
// - Enregistrement voix du thérapeute (micro réel)
// - Envoi audio base64 via Socket.io
// - Bouton fin de session
// - Design amélioré
// ================================================================

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

const EXPRESSIONS = [
  { id: 'neutral',   label: 'Neutre',    emoji: '😐', color: '#6B7280' },
  { id: 'happy',     label: 'Heureux',   emoji: '😊', color: '#10B981' },
  { id: 'sad',       label: 'Triste',    emoji: '😢', color: '#3B82F6' },
  { id: 'surprised', label: 'Surpris',   emoji: '😮', color: '#F59E0B' },
  { id: 'thinking',  label: 'Réfléchit', emoji: '🤔', color: '#8B5CF6' },
  { id: 'excited',   label: 'Excité',    emoji: '😄', color: '#EF4444' },
  { id: 'angry',     label: 'Colère',    emoji: '😠', color: '#DC2626' },
  { id: 'love',      label: 'Amour',     emoji: '🥰', color: '#EC4899' },
];

const SCENARIOS = [
  {
    id: 'greeting', name: '👋 Accueil',
    desc: 'Saluer l\'enfant en début de session',
    steps: [
      { expression: 'happy',   text: 'Bonjour ! Je suis tellement content de te voir aujourd\'hui !' },
      { expression: 'excited', text: 'On va passer une super session ensemble !' },
      { expression: 'neutral', text: 'Comment tu te sens aujourd\'hui ?' },
    ]
  },
  {
    id: 'emotions', name: '😊 Émotions',
    desc: 'Reconnaître les émotions',
    steps: [
      { expression: 'happy',     text: 'Regarde ! Quand je fais ça, je suis heureux !' },
      { expression: 'sad',       text: 'Et maintenant je suis triste. Tu connais ce sentiment ?' },
      { expression: 'surprised', text: 'Oh ! Je suis surpris !' },
      { expression: 'thinking',  text: 'Hmm... je réfléchis très fort.' },
    ]
  },
  {
    id: 'bravo', name: '🎉 Bravo !',
    desc: 'Féliciter l\'enfant',
    steps: [
      { expression: 'excited', text: 'Bravo ! Tu as très bien fait !' },
      { expression: 'love',    text: 'Je suis tellement fier de toi !' },
      { expression: 'happy',   text: 'Continue comme ça, tu es fantastique !' },
    ]
  },
  {
    id: 'farewell', name: '👋 Au revoir',
    desc: 'Terminer positivement',
    steps: [
      { expression: 'happy',   text: 'On a très bien travaillé aujourd\'hui !' },
      { expression: 'excited', text: 'Tu as fait de super progrès !' },
      { expression: 'love',    text: 'À très bientôt ! Je t\'attendrai !' },
    ]
  },
];

export default function Controller({ roomCode, onEndSession }) {
  const [socket, setSocket]         = useState(null);
  const [connected, setConnected]   = useState(false);
  const [speechText, setSpeech]     = useState('');
  const [activeExpr, setActive]     = useState('neutral');
  const [running, setRunning]       = useState(null);
  const [log, setLog]               = useState([]);
  const [isRecording, setIsRec]     = useState(false);
  const [hasAudio, setHasAudio]     = useState(false);
  const [audioBlob, setAudioBlob]   = useState(null);
  const [useRealVoice, setRealVoice]= useState(false);
  const [showEndModal, setEndModal] = useState(false);
  const [sessionTime, setTime]      = useState(0);
  const mediaRef   = useRef(null);
  const chunksRef  = useRef([]);
  const timerRef   = useRef(null);

  const addLog = (msg) => {
    const t = new Date().toLocaleTimeString('fr-FR');
    setLog(prev => [`[${t}] ${msg}`, ...prev].slice(0, 30));
  };

  // Timer de session
  useEffect(() => {
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2,'0');
    const sec = (s % 60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  };

  // Connexion Socket.io
  useEffect(() => {
    const s = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    s.on('connect',           () => { setConnected(true);  s.emit('join-room', roomCode); addLog('✅ Connecté'); });
    s.on('disconnect',        () => { setConnected(false); addLog('❌ Déconnecté'); });
    s.on('partner-connected', () => addLog('🤖 Robot Face connecté !'));
    setSocket(s);
    return () => s.disconnect();
  }, [roomCode]);

  // Envoyer une expression
  const sendExpression = (id) => {
    if (!socket || !connected) return;
    socket.emit('send-expression', { roomCode, expression: id });
    setActive(id);
    addLog(`😊 Expression → ${id}`);
  };

  // Envoyer du texte TTS
  const sendSpeech = () => {
    if (!socket || !connected || !speechText.trim()) return;

    if (useRealVoice && audioBlob) {
      // Envoyer l'audio enregistré
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        socket.emit('send-audio', { roomCode, audioBase64: base64, text: speechText });
        addLog(`🎙️ Audio envoyé → "${speechText}"`);
        setSpeech('');
        setHasAudio(false);
        setAudioBlob(null);
      };
      reader.readAsDataURL(audioBlob);
    } else {
      socket.emit('send-speech', { roomCode, text: speechText });
      addLog(`🗣️ TTS → "${speechText}"`);
      setSpeech('');
    }
  };

  const sendQuick = (phrase) => {
    if (!socket || !connected) return;
    socket.emit('send-speech', { roomCode, text: phrase });
    addLog(`💬 Phrase rapide → "${phrase}"`);
  };

  const runScenario = (sc) => {
    if (!socket || !connected || running) return;
    socket.emit('send-scenario', { roomCode, scenario: sc });
    setRunning(sc.id);
    addLog(`📋 Scénario → ${sc.name}`);
    setTimeout(() => setRunning(null), sc.steps.length * 3500 + 1000);
  };

  // ── ENREGISTREMENT MICROPHONE ──────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setHasAudio(true);
        stream.getTracks().forEach(t => t.stop());
        addLog('🎙️ Enregistrement terminé');
      };
      mr.start();
      mediaRef.current = mr;
      setIsRec(true);
      addLog('🔴 Enregistrement en cours...');
    } catch (e) {
      alert('Microphone non disponible. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && isRecording) {
      mediaRef.current.stop();
      setIsRec(false);
    }
  };

  // ── FIN DE SESSION ─────────────────────────────────────────────
  const endSession = () => {
    if (!socket) return;
    socket.emit('end-session', { roomCode });
    addLog('🔚 Session terminée');
    setEndModal(false);
    if (onEndSession) onEndSession();
  };

  return (
    <div className="ctrl-container">

      {/* ── HEADER ── */}
      <div className="ctrl-header">
        <div className="ctrl-header-left">
          <div className="ctrl-logo">🤖</div>
          <div>
            <h1>Contrôleur PEERbots</h1>
            <p>Salle : <strong>{roomCode}</strong></p>
          </div>
        </div>
        <div className="ctrl-header-right">
          <div className="session-timer">⏱ {formatTime(sessionTime)}</div>
          <div className={`status-badge ${connected ? 'ok' : 'ko'}`}>
            <span className={`status-dot ${connected ? 'on' : 'off'}`}/>
            {connected ? 'Connecté' : 'Déconnecté'}
          </div>
          <button className="end-session-btn" onClick={() => setEndModal(true)}>
            🔚 Terminer
          </button>
        </div>
      </div>

      {/* ── MODAL FIN DE SESSION ── */}
      {showEndModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ fontSize: 48 }}>⏹️</div>
            <h2>Terminer la session ?</h2>
            <p>Le Robot Face affichera un message de fin à l'enfant.</p>
            <p>Durée de la session : <strong>{formatTime(sessionTime)}</strong></p>
            <div className="modal-buttons">
              <button className="modal-btn-cancel" onClick={() => setEndModal(false)}>
                Continuer
              </button>
              <button className="modal-btn-confirm" onClick={endSession}>
                Terminer la session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CORPS ── */}
      <div className="ctrl-body">

        {/* COLONNE GAUCHE */}
        <div className="ctrl-col">

          {/* Expressions */}
          <div className="card">
            <div className="card-header">
              <span className="card-icon">😊</span>
              <h2>Expressions du robot</h2>
            </div>
            <div className="expr-grid">
              {EXPRESSIONS.map((e) => (
                <button key={e.id}
                  className={`expr-btn ${activeExpr === e.id ? 'active' : ''}`}
                  style={{
                    borderColor: activeExpr === e.id ? e.color : 'transparent',
                    background:  activeExpr === e.id ? e.color + '22' : 'var(--card-bg2)',
                    boxShadow:   activeExpr === e.id ? `0 4px 16px ${e.color}44` : 'none',
                  }}
                  onClick={() => sendExpression(e.id)}
                  disabled={!connected}
                >
                  <span className="expr-emoji">{e.emoji}</span>
                  <span className="expr-label">{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Faire parler le robot */}
          <div className="card">
            <div className="card-header">
              <span className="card-icon">🗣️</span>
              <h2>Faire parler le robot</h2>
            </div>

            {/* Toggle voix réelle */}
            <div className="voice-toggle">
              <label className="toggle-label">
                <span>Voix synthétique</span>
                <div className={`toggle-switch ${useRealVoice ? 'active' : ''}`}
                     onClick={() => setRealVoice(!useRealVoice)}>
                  <div className="toggle-thumb"/>
                </div>
                <span>Ma vraie voix 🎙️</span>
              </label>
            </div>

            {/* Zone d'enregistrement */}
            {useRealVoice && (
              <div className="record-zone">
                <div className="record-info">
                  {isRecording
                    ? '🔴 Enregistrement en cours... Parlez !'
                    : hasAudio
                      ? '✅ Audio prêt à envoyer'
                      : '🎙️ Cliquez pour enregistrer votre voix'
                  }
                </div>
                <button
                  className={`record-btn ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? '⏹ Arrêter' : '🎙️ Enregistrer'}
                </button>
              </div>
            )}

            <textarea
              value={speechText}
              onChange={(e) => setSpeech(e.target.value)}
              placeholder={useRealVoice
                ? "Écris le texte qui s'affichera sur l'écran..."
                : "Écris ce que le robot doit dire..."}
              rows={3}
              className="speech-input"
              disabled={!connected}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSpeech(); }
              }}
            />
            <button
              className="send-btn"
              onClick={sendSpeech}
              disabled={!connected || !speechText.trim()}
            >
              {useRealVoice && hasAudio ? '🎙️ Envoyer ma voix' : '📢 Envoyer au robot'}
            </button>

            {/* Phrases rapides */}
            <p className="quick-label">Phrases rapides :</p>
            <div className="quick-row">
              {['Bonjour !', 'Très bien !', 'Bravo !', 'Comment tu vas ?',
                'C\'est super !', 'Tu peux répéter ?', 'On continue !', 'Excellent !'].map(ph => (
                <button key={ph} className="quick-btn"
                        onClick={() => sendQuick(ph)}
                        disabled={!connected}>{ph}</button>
              ))}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE */}
        <div className="ctrl-col">

          {/* Scénarios */}
          <div className="card">
            <div className="card-header">
              <span className="card-icon">📋</span>
              <h2>Scénarios thérapeutiques</h2>
            </div>
            <p className="card-desc">
              Un scénario enchaîne plusieurs étapes automatiquement (3.5s entre chaque).
            </p>
            {SCENARIOS.map((sc) => (
              <button key={sc.id}
                className={`scenario-btn ${running === sc.id ? 'running' : ''}`}
                onClick={() => runScenario(sc)}
                disabled={!connected || running !== null}
              >
                <div className="sc-top">
                  <span className="sc-name">{sc.name}</span>
                  <span className="sc-steps">{sc.steps.length} étapes · {sc.steps.length * 3.5}s</span>
                </div>
                <span className="sc-desc">{sc.desc}</span>
                {running === sc.id && (
                  <div className="sc-progress">
                    <div className="sc-progress-bar"/>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Journal */}
          <div className="card">
            <div className="card-header">
              <span className="card-icon">📝</span>
              <h2>Journal de session</h2>
              <button className="clear-log" onClick={() => setLog([])}>Effacer</button>
            </div>
            <div className="log-box">
              {log.length === 0
                ? <p className="log-empty">Les actions s'afficheront ici...</p>
                : log.map((entry, i) => (
                    <div key={i} className={`log-line ${i === 0 ? 'log-latest' : ''}`}>
                      {entry}
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
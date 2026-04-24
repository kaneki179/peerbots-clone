// ================================================================
// RobotFace.jsx — VERSION PRO
// Visages SVG haute qualité avec :
// - Sourcils expressifs
// - Pupilles avec reflets
// - Animations CSS fluides
// - Clignement naturel
// - Transitions de couleur
// - Voix du thérapeute (audio réel) ou TTS amélioré
// ================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import './RobotFace.css';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

// ================================================================
// DÉFINITION DES EXPRESSIONS PRO
// Chaque expression contrôle : yeux, sourcils, bouche, fond, lueur
// ================================================================
const EXPRESSIONS = {
  neutral: {
    eyeRy: 22, eyeRx: 20,
    pupilY: 0,
    browLeft:  'M 95 112 Q 115 108 135 112',
    browRight: 'M 165 112 Q 185 108 205 112',
    mouth: 'M 130 190 Q 150 195 170 190',
    mouthOpen: false,
    bg: ['#00C5C5', '#009999'],
    glow: '#00FFD4',
    label: 'Neutre',
    cheekOpacity: 0.3,
  },
  happy: {
    eyeRy: 18, eyeRx: 22,
    pupilY: -3,
    browLeft:  'M 92 105 Q 112 98 132 105',
    browRight: 'M 168 105 Q 188 98 208 105',
    mouth: 'M 118 184 Q 150 215 182 184',
    mouthOpen: true,
    bg: ['#00D4AA', '#00A87A'],
    glow: '#00FFD4',
    label: 'Heureux 😊',
    cheekOpacity: 0.65,
  },
  sad: {
    eyeRy: 16, eyeRx: 19,
    pupilY: 4,
    browLeft:  'M 92 115 Q 112 122 132 115',
    browRight: 'M 168 115 Q 188 122 208 115',
    mouth: 'M 122 200 Q 150 180 178 200',
    mouthOpen: false,
    bg: ['#4A7FA5', '#2A5F85'],
    glow: '#7AAFCC',
    label: 'Triste 😢',
    cheekOpacity: 0.2,
  },
  surprised: {
    eyeRy: 28, eyeRx: 24,
    pupilY: -5,
    browLeft:  'M 90 100 Q 110 88 130 100',
    browRight: 'M 170 100 Q 190 88 210 100',
    mouth: 'M 135 180 Q 150 210 165 180',
    mouthOpen: true,
    mouthRound: true,
    bg: ['#FF8C42', '#E06020'],
    glow: '#FFB347',
    label: 'Surpris 😮',
    cheekOpacity: 0.4,
  },
  thinking: {
    eyeRy: 15, eyeRx: 20,
    pupilY: -6, pupilXLeft: 3, pupilXRight: 5,
    browLeft:  'M 92 110 Q 112 105 132 108',
    browRight: 'M 168 105 Q 188 108 208 112',
    mouth: 'M 128 192 Q 148 196 168 188',
    mouthOpen: false,
    bg: ['#7B68EE', '#5A4FCC'],
    glow: '#B0A8FF',
    label: 'Réfléchit 🤔',
    cheekOpacity: 0.2,
  },
  excited: {
    eyeRy: 20, eyeRx: 23,
    pupilY: -4,
    browLeft:  'M 90 102 Q 110 92 130 102',
    browRight: 'M 170 102 Q 190 92 210 102',
    mouth: 'M 112 182 Q 150 222 188 182',
    mouthOpen: true,
    bg: ['#FF6B9D', '#CC4477'],
    glow: '#FF99CC',
    label: 'Excité 😄',
    cheekOpacity: 0.7,
  },
  angry: {
    eyeRy: 17, eyeRx: 21,
    pupilY: 2,
    browLeft:  'M 90 118 Q 110 108 130 114',
    browRight: 'M 170 114 Q 190 108 210 118',
    mouth: 'M 120 198 Q 150 185 180 198',
    mouthOpen: false,
    bg: ['#E53935', '#B71C1C'],
    glow: '#FF6B6B',
    label: 'En colère 😠',
    cheekOpacity: 0.15,
  },
  love: {
    eyeRy: 0, eyeRx: 0,
    isHeart: true,
    browLeft:  'M 92 105 Q 112 98 132 105',
    browRight: 'M 168 105 Q 188 98 208 105',
    mouth: 'M 118 184 Q 150 215 182 184',
    mouthOpen: true,
    bg: ['#FF4D8D', '#CC1166'],
    glow: '#FF80B3',
    label: 'Amour 🥰',
    cheekOpacity: 0.8,
  },
};

// ================================================================
// COMPOSANT PRINCIPAL
// ================================================================
export default function RobotFace({ roomCode }) {
  const [expression, setExpression]   = useState('neutral');
  const [speechText, setSpeechText]   = useState('');
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [connected,  setConnected]    = useState(false);
  const [eyesClosed, setEyesClosed]   = useState(false);
  const [isBlinking, setIsBlinking]   = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const audioRef = useRef(null);

  // ================================================================
  // VOIX — Jouer l'audio du thérapeute OU fallback TTS amélioré
  // ================================================================
  const playAudio = useCallback((base64Audio) => {
    try {
      const audio = new Audio(`data:audio/webm;base64,${base64Audio}`);
      audio.onplay  = () => { setIsSpeaking(true); };
      audio.onended = () => {
        setIsSpeaking(false);
        setTimeout(() => setSpeechText(''), 3000);
      };
      audio.play();
    } catch (e) {
      console.error('Erreur audio:', e);
    }
  }, []);

  // Fallback TTS amélioré si pas d'audio réel
  const speak = useCallback((text) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);

    // Chercher la meilleure voix disponible
    const voices = window.speechSynthesis.getVoices();
    const preferred = ['Google français', 'Microsoft Julie', 'Amélie', 'Thomas',
                       'fr-FR', 'fr_FR', 'French'];
    const bestVoice = voices.find(v =>
      preferred.some(p => v.name.includes(p) || v.lang.includes('fr'))
    );
    if (bestVoice) u.voice = bestVoice;

    u.lang   = 'fr-FR';
    u.rate   = 0.92;
    u.pitch  = 1.1;
    u.volume = 1.0;
    u.onstart = () => { setIsSpeaking(true); setSpeechText(text); };
    u.onend   = () => {
      setIsSpeaking(false);
      setTimeout(() => setSpeechText(''), 3000);
    };
    window.speechSynthesis.speak(u);
  }, []);

  // ================================================================
  // CONNEXION SOCKET.IO
  // ================================================================
  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', roomCode);
    });
    socket.on('disconnect', () => setConnected(false));

    // Expression
    socket.on('receive-expression', expr => {
      setExpression(expr);
    });

    // Texte TTS (fallback)
    socket.on('receive-speech', text => {
      setSpeechText(text);
      speak(text);
    });

    // Audio réel du thérapeute
    socket.on('receive-audio', ({ audioBase64, text }) => {
      setSpeechText(text || '');
      playAudio(audioBase64);
    });

    // Scénario
    socket.on('receive-scenario', sc => {
      sc.steps.forEach((step, i) => {
        setTimeout(() => {
          if (step.expression) setExpression(step.expression);
          if (step.audioBase64) { setSpeechText(step.text||''); playAudio(step.audioBase64); }
          else if (step.text) { setSpeechText(step.text); speak(step.text); }
        }, i * 3500);
      });
    });

    // Fin de session
    socket.on('session-ended', () => {
      setSessionEnded(true);
      setExpression('sad');
      speak('La session est terminée. Au revoir !');
    });

    return () => socket.disconnect();
  }, [roomCode, speak, playAudio]);

  // ================================================================
  // CLIGNEMENT NATUREL DES YEUX
  // ================================================================
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    // Double clignement parfois
    const interval = setInterval(() => {
      blink();
      if (Math.random() > 0.7) setTimeout(blink, 300);
    }, 2500 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, []);

  const expr = EXPRESSIONS[expression] || EXPRESSIONS.neutral;
  const eyeRy = isBlinking ? 2 : expr.eyeRy;
  const [bg1, bg2] = expr.bg;

  if (sessionEnded) {
    return (
      <div className="rf-container" style={{ background: '#1a1a2e' }}>
        <div className="rf-session-ended">
          <div style={{ fontSize: 80 }}>👋</div>
          <h2>Session terminée</h2>
          <p>Merci et à bientôt !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rf-container" style={{ background: `linear-gradient(160deg, ${bg1}, ${bg2})` }}>

      {/* Fond décoratif animé */}
      <div className="rf-bg-circles">
        <div className="rf-circle rf-circle-1" style={{ background: expr.glow }}/>
        <div className="rf-circle rf-circle-2" style={{ background: bg2 }}/>
      </div>

      {/* Indicateur connexion */}
      <div className="rf-status">
        <div className={`rf-dot ${connected ? 'rf-dot-on' : 'rf-dot-off'}`}/>
        <span>{connected ? 'Connecté' : 'Reconnexion...'}</span>
      </div>

      {/* Badge expression */}
      <div className="rf-expr-badge">{expr.label}</div>

      {/* LE VISAGE SVG PRO */}
      <div className={`rf-face-wrapper ${isSpeaking ? 'rf-speaking' : ''}`}>
        <svg
          width="320" height="340"
          viewBox="0 0 300 320"
          className="rf-face-svg"
        >
          {/* Définitions : filtres et dégradés */}
          <defs>
            {/* Ombre douce sous le visage */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={bg2} floodOpacity="0.5"/>
            </filter>
            {/* Brillance des yeux */}
            <radialGradient id="eyeGrad" cx="35%" cy="30%" r="60%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9"/>
              <stop offset="40%"  stopColor="#1a1a2e" stopOpacity="1"/>
              <stop offset="100%" stopColor="#000000" stopOpacity="1"/>
            </radialGradient>
            {/* Dégradé de la peau */}
            <radialGradient id="skinGrad" cx="45%" cy="35%" r="70%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#000000" stopOpacity="0.08"/>
            </radialGradient>
            {/* Lueur */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>

          {/* Corps du visage (cercle principal) */}
          <circle
            cx="150" cy="155"
            r="130"
            fill={bg1}
            filter="url(#shadow)"
            className="rf-face-circle"
          />
          {/* Overlay de profondeur */}
          <circle cx="150" cy="155" r="130" fill="url(#skinGrad)"/>

          {/* ── SOURCILS ── */}
          <path
            d={expr.browLeft}
            stroke="#1a1a2e"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            className="rf-brow"
          />
          <path
            d={expr.browRight}
            stroke="#1a1a2e"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            className="rf-brow"
          />

          {/* ── YEUX ── */}
          {expr.isHeart ? (
            // Yeux en forme de coeur (expression Love)
            <>
              <path d="M 103 135 C 95 120 80 120 80 135 C 80 148 103 162 103 162 C 103 162 126 148 126 135 C 126 120 111 120 103 135 Z"
                    fill="#FF4D8D" className="rf-eye-heart"/>
              <path d="M 197 135 C 189 120 174 120 174 135 C 174 148 197 162 197 162 C 197 162 220 148 220 135 C 220 120 205 120 197 135 Z"
                    fill="#FF4D8D" className="rf-eye-heart"/>
            </>
          ) : (
            <>
              {/* Blanc de l'oeil gauche */}
              <ellipse cx="103" cy="140" rx={expr.eyeRx + 6} ry={eyeRy + 6}
                       fill="white" opacity="0.95"/>
              {/* Iris gauche */}
              <ellipse cx="103" cy={140 + (expr.pupilY||0)}
                       rx={expr.eyeRx} ry={eyeRy}
                       fill="url(#eyeGrad)"
                       style={{ transition: 'all 0.15s ease' }}
                       className="rf-iris"/>
              {/* Reflet brillant oeil gauche */}
              <ellipse cx="96" cy={131 + (expr.pupilY||0)} rx="5" ry="4"
                       fill="white" opacity="0.9"/>
              <ellipse cx="108" cy={137 + (expr.pupilY||0)} rx="2.5" ry="2"
                       fill="white" opacity="0.6"/>

              {/* Blanc de l'oeil droit */}
              <ellipse cx="197" cy="140" rx={expr.eyeRx + 6} ry={eyeRy + 6}
                       fill="white" opacity="0.95"/>
              {/* Iris droit */}
              <ellipse cx="197" cy={140 + (expr.pupilY||0)}
                       rx={expr.eyeRx} ry={eyeRy}
                       fill="url(#eyeGrad)"
                       style={{ transition: 'all 0.15s ease' }}
                       className="rf-iris"/>
              {/* Reflets oeil droit */}
              <ellipse cx="190" cy={131 + (expr.pupilY||0)} rx="5" ry="4"
                       fill="white" opacity="0.9"/>
              <ellipse cx="202" cy={137 + (expr.pupilY||0)} rx="2.5" ry="2"
                       fill="white" opacity="0.6"/>
            </>
          )}

          {/* ── JOUES ── */}
          <ellipse cx="62" cy="185" rx="28" ry="18"
                   fill="#FF8FAB" opacity={expr.cheekOpacity}
                   className="rf-cheek"/>
          <ellipse cx="238" cy="185" rx="28" ry="18"
                   fill="#FF8FAB" opacity={expr.cheekOpacity}
                   className="rf-cheek"/>

          {/* ── BOUCHE ── */}
          {expr.mouthRound ? (
            // Bouche ronde (surpris)
            <ellipse cx="150" cy="220" rx="20" ry="25"
                     fill="#1a1a2e" className="rf-mouth"/>
          ) : expr.mouthOpen ? (
            // Bouche ouverte avec dents
            <>
              <path d={expr.mouth}
                    stroke="#1a1a2e" strokeWidth="4"
                    fill="#1a1a2e" className="rf-mouth"/>
              <clipPath id="mouthClip">
                <path d={expr.mouth + ' Z'}/>
              </clipPath>
              {/* Dents */}
              <rect x="128" y="188" width="44" height="14" rx="4"
                    fill="white" clipPath="url(#mouthClip)" opacity="0.95"/>
            </>
          ) : (
            // Bouche fermée
            <path d={expr.mouth}
                  stroke="#1a1a2e" strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  className="rf-mouth"/>
          )}

          {/* ── NŒUD PAPILLON (detail pro) ── */}
          <path d="M 135 295 L 150 285 L 165 295 L 150 305 Z"
                fill="#1a1a2e" opacity="0.3"/>
          <circle cx="150" cy="295" r="4" fill={expr.glow} opacity="0.7"/>

          {/* ── ANIMATION DE PAROLE ── */}
          {isSpeaking && (
            <g className="rf-speech-dots">
              <circle cx="130" cy="265" r="6" fill="white" opacity="0.5"
                      className="rf-dot-1"/>
              <circle cx="150" cy="270" r="8" fill="white" opacity="0.6"
                      className="rf-dot-2"/>
              <circle cx="170" cy="265" r="6" fill="white" opacity="0.5"
                      className="rf-dot-3"/>
            </g>
          )}
        </svg>
      </div>

      {/* Bulle de texte */}
      {speechText && (
        <div className="rf-speech-bubble">
          <div className="rf-speech-bubble-inner">
            💬 {speechText}
          </div>
        </div>
      )}

      {/* Code de salle */}
      <div className="rf-room-code">Salle : {roomCode}</div>
    </div>
  );
}
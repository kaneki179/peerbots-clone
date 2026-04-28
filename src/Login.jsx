// ================================================================
// Login.jsx — Écran de connexion DAUST-Thérapie
// Étape 1 : code de salle
// Étape 2 : mot de passe + choix du rôle
// ================================================================

import React, { useState } from 'react';

export default function Login({ onJoin }) {
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [step,     setStep]     = useState(1);

  const goToStep2 = () => {
    if (!roomCode.trim()) {
      setError('Entre un code de salle !');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleJoin = (mode) => {
    if (!password.trim()) {
      setError('Entre le mot de passe de session !');
      return;
    }
    setError('');
    // Combiner le code de salle + mot de passe pour sécuriser la room
    const secureRoom = `${roomCode.toUpperCase().trim()}_${password.trim()}`;
    onJoin(mode, secureRoom);
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* ── Visage SVG du robot ── */}
        <div className="login-icon">
          <svg width="70" height="70" viewBox="0 0 300 320">
            <circle cx="150" cy="160" r="130" fill="#00C5C5"/>
            {/* Sourcils */}
            <path d="M 85 105 Q 105 95 125 105"
                  stroke="#1a1a2e" strokeWidth="5"
                  fill="none" strokeLinecap="round"/>
            <path d="M 175 105 Q 195 95 215 105"
                  stroke="#1a1a2e" strokeWidth="5"
                  fill="none" strokeLinecap="round"/>
            {/* Oeil gauche */}
            <ellipse cx="103" cy="140" rx="26" ry="26"
                     fill="white" opacity="0.95"/>
            <ellipse cx="103" cy="140" rx="20" ry="20"
                     fill="#1a1a2e"/>
            <ellipse cx="96"  cy="132" rx="5"  ry="4"
                     fill="white" opacity="0.9"/>
            {/* Oeil droit */}
            <ellipse cx="197" cy="140" rx="26" ry="26"
                     fill="white" opacity="0.95"/>
            <ellipse cx="197" cy="140" rx="20" ry="20"
                     fill="#1a1a2e"/>
            <ellipse cx="190" cy="132" rx="5"  ry="4"
                     fill="white" opacity="0.9"/>
            {/* Joues */}
            <ellipse cx="62"  cy="185" rx="28" ry="18"
                     fill="#FF8FAB" opacity="0.6"/>
            <ellipse cx="238" cy="185" rx="28" ry="18"
                     fill="#FF8FAB" opacity="0.6"/>
            {/* Sourire */}
            <path d="M 118 210 Q 150 240 182 210"
                  stroke="#1a1a2e" strokeWidth="6"
                  fill="none" strokeLinecap="round"/>
          </svg>
        </div>

        {/* ── Titre de l'application ── */}
        <h1 className="login-title">DAUST-Thérapie</h1>
        <p className="login-subtitle">
          Robot Thérapeutique pour Enfants
        </p>

        {/* ════════════════════════════════
            ÉTAPE 1 — Code de salle
            ════════════════════════════════ */}
        {step === 1 && (
          <>
            <div className="login-field">
              <label>Code de la salle</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex : SALLE01"
                maxLength={10}
                className="login-input"
                autoComplete="off"
                onKeyPress={(e) => e.key === 'Enter' && goToStep2()}
              />
              {error && <p className="login-error">⚠️ {error}</p>}
            </div>

            <button
              className="btn btn-face"
              style={{ width: '100%', borderRadius: 14 }}
              onClick={goToStep2}
            >
              Continuer →
              <span>Entrer le code de salle</span>
            </button>
          </>
        )}

        {/* ════════════════════════════════
            ÉTAPE 2 — Mot de passe + rôle
            ════════════════════════════════ */}
        {step === 2 && (
          <>
            {/* Badge salle sélectionnée */}
            <div style={{
              background: '#F0FDFB',
              border: '1px solid #A8EFD4',
              borderRadius: 12,
              padding: '10px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: '#475569' }}>
                Salle :{' '}
                <strong style={{ color: '#023E4A', fontSize: 15 }}>
                  {roomCode}
                </strong>
              </span>
              <button
                onClick={() => { setStep(1); setError(''); setPassword(''); }}
                style={{
                  fontSize: 12, color: '#028090',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                Changer
              </button>
            </div>

            {/* Mot de passe de session */}
            <div className="login-field">
              <label>Mot de passe de session</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={20}
                className="login-input"
                style={{ letterSpacing: '4px', fontSize: 20 }}
                autoComplete="off"
                onKeyPress={(e) => e.key === 'Enter' && handleJoin('face')}
              />
              {error && <p className="login-error">⚠️ {error}</p>}
            </div>

            {/* Instructions */}
            <div className="login-info">
              <p>📱 Tablette de l'<strong>enfant</strong> → Robot Face</p>
              <p>🎮 Tablette du <strong>thérapeute</strong> → Contrôleur</p>
              <p>🔑 Même <strong>code</strong> et même <strong>mot de passe</strong> sur les 2 appareils</p>
            </div>

            {/* Boutons de choix du rôle */}
            <div className="login-buttons">
              <button
                className="btn btn-face"
                onClick={() => handleJoin('face')}
              >
                🤖 Robot Face
                <span>Pour l'enfant</span>
              </button>
              <button
                className="btn btn-controller"
                onClick={() => handleJoin('controller')}
              >
                🎮 Contrôleur
                <span>Pour le thérapeute</span>
              </button>
            </div>
          </>
        )}

        {/* Pied de page */}
        <p style={{
          marginTop: 20,
          fontSize: 11,
          color: '#94A3B8',
          textAlign: 'center',
        }}>
          DAUST · Département GEII · Dakar, Sénégal
        </p>

      </div>
    </div>
  );
}
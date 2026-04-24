// Login.jsx — VERSION PRO avec mot de passe de session
import React, { useState } from 'react';

export default function Login({ onJoin }) {
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [step, setStep]         = useState(1); // 1=code, 2=role

  const goToStep2 = () => {
    if (!roomCode.trim()) { setError('Entre un code de salle !'); return; }
    setError(''); setStep(2);
  };

  const handleJoin = (mode) => {
    if (!password.trim()) { setError('Entre le mot de passe de session !'); return; }
    setError('');
    // Le roomCode inclut le mot de passe pour sécuriser la salle
    const secureRoom = `${roomCode.toUpperCase()}_${password}`;
    onJoin(mode, secureRoom);
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-icon">
          <svg width="70" height="70" viewBox="0 0 300 320">
            <circle cx="150" cy="160" r="130" fill="#00C5C5"/>
            <ellipse cx="103" cy="140" rx="26" ry="26" fill="white" opacity="0.95"/>
            <ellipse cx="103" cy="140" rx="20" ry="20" fill="#1a1a2e"/>
            <ellipse cx="96"  cy="132" rx="5"  ry="4"  fill="white" opacity="0.9"/>
            <ellipse cx="197" cy="140" rx="26" ry="26" fill="white" opacity="0.95"/>
            <ellipse cx="197" cy="140" rx="20" ry="20" fill="#1a1a2e"/>
            <ellipse cx="190" cy="132" rx="5"  ry="4"  fill="white" opacity="0.9"/>
            <ellipse cx="62"  cy="185" rx="28" ry="18" fill="#FF8FAB" opacity="0.6"/>
            <ellipse cx="238" cy="185" rx="28" ry="18" fill="#FF8FAB" opacity="0.6"/>
            <path d="M 118 210 Q 150 240 182 210"
                  stroke="#1a1a2e" strokeWidth="6"
                  fill="none" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="login-title">PEERbots</h1>
        <p className="login-subtitle">Robot Thérapeutique pour Enfants</p>

        {step === 1 && (
          <>
            <div className="login-field">
              <label>Code de la salle</label>
              <input type="text" value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex : ROBOT01" maxLength={10}
                className="login-input"
                onKeyPress={(e) => e.key === 'Enter' && goToStep2()}
              />
              {error && <p className="login-error">{error}</p>}
            </div>
            <button className="btn btn-face" style={{ width:'100%', borderRadius:14 }}
                    onClick={goToStep2}>
              Continuer →
              <span>Entrer le code de salle</span>
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{
              background: '#F0FDFB', border: '1px solid #A8EFD4',
              borderRadius: 12, padding: '10px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 13, color: '#475569' }}>
                Salle : <strong style={{ color: '#023E4A' }}>{roomCode}</strong>
              </span>
              <button onClick={() => setStep(1)} style={{
                fontSize: 12, color: '#028090', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 600
              }}>Changer</button>
            </div>

            <div className="login-field">
              <label>Mot de passe de session</label>
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" maxLength={20}
                className="login-input"
                style={{ letterSpacing: '4px', fontSize: 20 }}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin('face')}
              />
              {error && <p className="login-error">{error}</p>}
            </div>

            <div className="login-info">
              <p>📱 Tablette de l'<strong>enfant</strong> → Robot Face</p>
              <p>🎮 Tablette du <strong>thérapeute</strong> → Contrôleur</p>
              <p>🔑 Les deux doivent avoir le <strong>même mot de passe</strong></p>
            </div>

            <div className="login-buttons">
              <button className="btn btn-face" onClick={() => handleJoin('face')}>
                🤖 Robot Face
                <span>Pour l'enfant</span>
              </button>
              <button className="btn btn-controller" onClick={() => handleJoin('controller')}>
                🎮 Contrôleur
                <span>Pour le thérapeute</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
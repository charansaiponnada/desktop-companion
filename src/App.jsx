import { useState, useEffect } from 'react';
import Companion from './ui/Companion.jsx';
import Settings from './ui/Settings.jsx';
import { memory } from './memory/store.js';

export default function App() {
  const [avatar, setAvatar]         = useState('cat');
  const [showSettings, setSettings] = useState(false);
  const [furColors, setFurColors]   = useState(null);

  useEffect(() => {
    Promise.all([
      memory.getPref('furCream', ''),
      memory.getPref('furCreamDark', ''),
      memory.getPref('furOrange', ''),
    ]).then(([cream, creamDark, orange]) => {
      if (cream) setFurColors({ cream, creamDark, orange });
    });
  }, []);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
      background: 'transparent',
      padding: '0 0 12px',
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <Companion avatarId={avatar} colors={furColors} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.35 }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 10,
            letterSpacing: '0.15em',
            color: '#f0ede8',
          }}>
            mochi
          </span>
          <button
            onClick={() => setSettings(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#f0ede8',
              fontSize: 13,
              lineHeight: '12px',
              cursor: 'pointer',
              padding: '2px 4px',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.1em',
              opacity: 0.6,
            }}
          >
            ···
          </button>
        </div>
      </div>

      {showSettings && (
        <Settings
          currentAvatar={avatar}
          onAvatarChange={setAvatar}
          onFurChange={setFurColors}
          onClose={() => setSettings(false)}
        />
      )}
    </div>
  );
}

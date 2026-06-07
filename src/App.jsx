import { useState } from 'react';
import Companion from './ui/Companion.jsx';
import Settings from './ui/Settings.jsx';

export default function App() {
  const [avatar, setAvatar]         = useState('cat');
  const [showSettings, setSettings] = useState(false);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
      background: 'transparent',
      padding: 16,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Companion avatarId={avatar} />
        <button
          onClick={() => setSettings(true)}
          style={{
            background: 'rgba(26,24,48,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 10,
            color: '#8a8598',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          ⚙
        </button>
      </div>

      {showSettings && (
        <Settings
          currentAvatar={avatar}
          onAvatarChange={setAvatar}
          onClose={() => setSettings(false)}
        />
      )}
    </div>
  );
}

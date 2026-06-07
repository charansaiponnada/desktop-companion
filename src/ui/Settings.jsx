import { useState, useEffect } from 'react';
import { memory } from '../memory/store.js';

export default function Settings({ onClose, onAvatarChange, currentAvatar }) {
  const [name, setName]           = useState('');
  const [avatar, setAvatar]       = useState(currentAvatar);
  const [pomodoro, setPomodoro]   = useState(25);
  const [waterMins, setWaterMins] = useState(60);
  const [ollamaOn, setOllamaOn]   = useState(false);

  useEffect(() => {
    memory.getPref('name',       '').then(setName);
    memory.getPref('pomodoro',   25).then(setPomodoro);
    memory.getPref('waterMins',  60).then(setWaterMins);
    memory.getPref('ollamaOn', false).then(setOllamaOn);
  }, []);

  async function save() {
    await memory.setPref('name',      name);
    await memory.setPref('pomodoro',  pomodoro);
    await memory.setPref('waterMins', waterMins);
    await memory.setPref('ollamaOn',  ollamaOn);
    await memory.setPref('avatar',    avatar);
    onAvatarChange(avatar);
    onClose();
  }

  const style = {
    wrap: {
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', zIndex: 999,
    },
    panel: {
      background: '#1a1830',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '1.5rem',
      width: 280,
      color: '#f0ede8',
      fontFamily: 'DM Sans, sans-serif',
    },
    label: { fontSize: 12, color: '#8a8598', marginBottom: 4, display: 'block' },
    input: {
      width: '100%', background: '#252340',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '6px 10px',
      color: '#f0ede8', fontSize: 13, marginBottom: 12,
    },
    row: { display: 'flex', gap: 8, marginBottom: 12 },
    avatarBtn: (active) => ({
      flex: 1, padding: '8px 0', borderRadius: 10,
      border: active ? '1px solid #e8834a' : '1px solid rgba(255,255,255,0.08)',
      background: active ? 'rgba(232,131,74,0.15)' : '#252340',
      color: active ? '#e8834a' : '#8a8598',
      cursor: 'pointer', fontSize: 13,
    }),
    btn: {
      width: '100%', padding: '8px 0', borderRadius: 10,
      background: '#e8834a', border: 'none', color: '#fff',
      cursor: 'pointer', fontSize: 13, fontWeight: 500, marginTop: 4,
    },
    toggle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  };

  return (
    <div style={style.wrap} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={style.panel}>
        <h3 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 500 }}>settings</h3>

        <label style={style.label}>your name</label>
        <input style={style.input} value={name} onChange={e => setName(e.target.value)} placeholder="what should i call you?" />

        <label style={style.label}>avatar</label>
        <div style={style.row}>
          <button style={style.avatarBtn(avatar === 'cat')} onClick={() => setAvatar('cat')}>🐱 cat</button>
          <button style={style.avatarBtn(avatar === 'fox')} onClick={() => setAvatar('fox')}>🦊 fox</button>
        </div>

        <label style={style.label}>pomodoro (minutes)</label>
        <input style={style.input} type="number" min={5} max={60} value={pomodoro}
          onChange={e => setPomodoro(Number(e.target.value))} />

        <label style={style.label}>water reminder (minutes)</label>
        <input style={style.input} type="number" min={15} max={180} value={waterMins}
          onChange={e => setWaterMins(Number(e.target.value))} />

        <div style={style.toggle}>
          <span style={{ fontSize: 13, color: '#8a8598' }}>ollama AI (optional)</span>
          <input type="checkbox" checked={ollamaOn} onChange={e => setOllamaOn(e.target.checked)} />
        </div>

        <button style={style.btn} onClick={save}>save</button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { memory } from '../memory/store.js';

const FUR_PRESETS = [
  { label: 'Classic', cream: '#F5ECD7', creamDark: '#EDD9B4', orange: '#E8834A' },
  { label: 'Tuxedo',  cream: '#F5F5F5', creamDark: '#E0E0E0', orange: '#333' },
  { label: 'Ginger',  cream: '#FAD6A5', creamDark: '#E8B87A', orange: '#D4783A' },
  { label: 'Calico',  cream: '#FFF0E0', creamDark: '#F5D4B8', orange: '#D4783A' },
  { label: 'Siamese', cream: '#F5ECD7', creamDark: '#D4B896', orange: '#5A4A3A' },
  { label: 'Mocha',   cream: '#E8D5B8', creamDark: '#D4B896', orange: '#8B6B4A' },
];

export default function Settings({ onClose, onAvatarChange, onFurChange, currentAvatar }) {
  const [name, setName]                   = useState('');
  const [avatar, setAvatar]               = useState(currentAvatar);
  const [pomodoro, setPomodoro]           = useState(25);
  const [waterMins, setWaterMins]         = useState(60);
  const [ollamaOn, setOllamaOn]           = useState(false);
  const [furPreset, setFurPreset]         = useState(0);
  const [reminderMsg, setReminderMsg]     = useState('');
  const [reminderMin, setReminderMin]     = useState(30);

  useEffect(() => {
    memory.getPref('name',       '').then(setName);
    memory.getPref('pomodoro',   25).then(setPomodoro);
    memory.getPref('waterMins',  60).then(setWaterMins);
    memory.getPref('ollamaOn', false).then(setOllamaOn);
    memory.getPref('furPreset',   0).then(v => setFurPreset(Number(v)));
  }, []);

  function applyFur(index) {
    setFurPreset(index);
    const p = FUR_PRESETS[index];
    onFurChange({ cream: p.cream, creamDark: p.creamDark, orange: p.orange });
    memory.setPref('furPreset', index);
    memory.setPref('furCream', p.cream);
    memory.setPref('furCreamDark', p.creamDark);
    memory.setPref('furOrange', p.orange);
  }

  async function save() {
    await memory.setPref('name',      name);
    await memory.setPref('pomodoro',  pomodoro);
    await memory.setPref('waterMins', waterMins);
    await memory.setPref('ollamaOn',  ollamaOn);
    await memory.setPref('avatar',    avatar);
    applyFur(furPreset);
    onAvatarChange(avatar);
    onClose();
  }

  async function addReminder() {
    if (!reminderMsg) return;
    const fireAt = Date.now() / 1000 + reminderMin * 60;
    await memory.addReminder?.(reminderMsg, Math.floor(fireAt), null);
    setReminderMsg('');
    setReminderMin(30);
  }

  const s = {
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
      width: 300,
      maxHeight: '80vh',
      overflowY: 'auto',
      color: '#f0ede8',
      fontFamily: 'DM Sans, sans-serif',
    },
    label: { fontSize: 12, color: '#8a8598', marginBottom: 4, display: 'block' },
    input: {
      width: '100%', background: '#252340',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, padding: '6px 10px',
      color: '#f0ede8', fontSize: 13, marginBottom: 12,
      fontFamily: 'DM Sans, sans-serif',
    },
    row: { display: 'flex', gap: 8, marginBottom: 12 },
    halfRow: { display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-end' },
    avatarBtn: (active) => ({
      flex: 1, padding: '8px 0', borderRadius: 10,
      border: active ? '1px solid #e8834a' : '1px solid rgba(255,255,255,0.08)',
      background: active ? 'rgba(232,131,74,0.15)' : '#252340',
      color: active ? '#e8834a' : '#8a8598',
      cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
    }),
    btn: {
      width: '100%', padding: '8px 0', borderRadius: 10,
      background: '#e8834a', border: 'none', color: '#fff',
      cursor: 'pointer', fontSize: 13, fontWeight: 500, marginTop: 4,
      fontFamily: 'DM Sans, sans-serif',
    },
    smallBtn: {
      padding: '8px 12px', borderRadius: 10,
      background: '#e8834a', border: 'none', color: '#fff',
      cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif',
    },
    toggle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    furGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12,
    },
    furSwatch: (active) => ({
      padding: '6px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
      border: active ? '2px solid #e8834a' : '1px solid rgba(255,255,255,0.08)',
      background: active ? 'rgba(232,131,74,0.15)' : '#252340',
      fontSize: 10, color: active ? '#e8834a' : '#8a8598', fontFamily: 'DM Sans, sans-serif',
    }),
    colorDot: (color) => ({
      width: 16, height: 16, borderRadius: '50%', background: color,
      margin: '0 auto 3px', border: '1px solid rgba(255,255,255,0.15)',
    }),
    sectionTitle: { fontSize: 12, color: '#e8834a', margin: '1rem 0 0.5rem', fontWeight: 500 },
  };

  return (
    <div style={s.wrap} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.panel}>
        <h3 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 500 }}>settings</h3>

        <label style={s.label}>your name</label>
        <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="what should i call you?" />

        <label style={s.label}>avatar</label>
        <div style={s.row}>
          <button style={s.avatarBtn(avatar === 'cat')} onClick={() => setAvatar('cat')}>mochi</button>
          <button style={s.avatarBtn(avatar === 'fox')} onClick={() => setAvatar('fox')}>fox</button>
        </div>

        <div style={s.sectionTitle}>fur color</div>
        <div style={s.furGrid}>
          {FUR_PRESETS.map((p, i) => (
            <div key={i} style={s.furSwatch(furPreset === i)} onClick={() => applyFur(i)}>
              <div style={s.colorDot(p.cream)} />
              <div>{p.label}</div>
            </div>
          ))}
        </div>

        <div style={s.sectionTitle}>productivity</div>

        <label style={s.label}>pomodoro (minutes)</label>
        <input style={s.input} type="number" min={5} max={60} value={pomodoro}
          onChange={e => setPomodoro(Number(e.target.value))} />

        <label style={s.label}>water reminder (minutes)</label>
        <input style={s.input} type="number" min={15} max={180} value={waterMins}
          onChange={e => setWaterMins(Number(e.target.value))} />

        <div style={s.sectionTitle}>reminders</div>
        <label style={s.label}>message</label>
        <input style={s.input} value={reminderMsg}
          onChange={e => setReminderMsg(e.target.value)}
          placeholder="remind me to..." />
        <div style={s.halfRow}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>in (minutes)</label>
            <input style={s.input} type="number" min={1} max={999} value={reminderMin}
              onChange={e => setReminderMin(Number(e.target.value))} />
          </div>
          <button style={s.smallBtn} onClick={addReminder}>add</button>
        </div>

        <div style={s.toggle}>
          <span style={{ fontSize: 13, color: '#8a8598' }}>ollama AI</span>
          <input type="checkbox" checked={ollamaOn} onChange={e => setOllamaOn(e.target.checked)} />
        </div>

        <button style={s.btn} onClick={save}>save</button>
      </div>
    </div>
  );
}

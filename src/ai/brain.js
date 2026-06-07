/**
 * companion — AI brain
 * wraps Ollama for intelligent reactions
 * gracefully falls back to template messages when Ollama isn't running
 */

const OLLAMA_BASE = 'http://localhost:11434';
const MODEL       = 'llama3.2';   // small, fast, runs on most machines
const MAX_TOKENS  = 80;           // keep responses short

// ── availability check ───────────────────────────────────────────────────────
let ollamaAvailable = null;

export async function checkOllama() {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(2000) });
    ollamaAvailable = r.ok;
  } catch {
    ollamaAvailable = false;
  }
  return ollamaAvailable;
}

// ── core generate ────────────────────────────────────────────────────────────
async function generate(prompt) {
  const r = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:  MODEL,
      prompt,
      stream: false,
      options: { num_predict: MAX_TOKENS, temperature: 0.7 }
    }),
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error('ollama generate failed');
  const d = await r.json();
  return d.response.trim();
}

// ── template fallbacks ───────────────────────────────────────────────────────
// avatars can inject their own via personality.js
const TEMPLATES = {
  idle: [
    'Hey {name}. Still here.',
    'Looking good, {name}.',
    '...',
    '*yawns*',
  ],
  task_complete: [
    'Nice work, {name}!',
    'Shipped it! ✓',
    'That\'s done. On to the next.',
    'You did it!',
  ],
  typing_long: [
    'You\'ve been typing for {mins} minutes.',
    'Fingers still going, {name}?',
    'Deep in it, huh.',
  ],
  idle_long: [
    'You\'ve been away {mins} minutes.',
    'Welcome back, {name}.',
    'There you are.',
  ],
  water: [
    'Water break?',
    'When did you last drink water, {name}?',
    'Hydration check.',
  ],
  pomodoro_break: [
    'Break time. Step away from the screen.',
    'Focus block done, {name}. Rest.',
    '25 minutes. Good session.',
  ],
};

function pick(arr, vars = {}) {
  let msg = arr[Math.floor(Math.random() * arr.length)];
  Object.entries(vars).forEach(([k, v]) => {
    msg = msg.replace(`{${k}}`, v);
  });
  return msg;
}

// ── public API ───────────────────────────────────────────────────────────────
export const brain = {
  /**
   * generate a contextual message for a given trigger
   * falls back to templates if Ollama unavailable
   *
   * @param {string} trigger - event type (task_complete, typing_long, etc.)
   * @param {object} ctx     - context: { name, recentSummaries, activeApp, mins }
   * @returns {Promise<string>}
   */
  async say(trigger, ctx = {}) {
    const { name = 'you', mins = 0, recentSummaries = [] } = ctx;

    if (ollamaAvailable) {
      try {
        const history = recentSummaries.slice(0, 3).map(s => s.summary).join('\n');
        const prompt = buildPrompt(trigger, { name, mins, history });
        return await generate(prompt);
      } catch {
        ollamaAvailable = false; // mark down, use templates for rest of session
      }
    }

    // template fallback
    const templates = TEMPLATES[trigger] || TEMPLATES.idle;
    return pick(templates, { name, mins });
  },

  isAvailable() { return ollamaAvailable === true; },
};

// ── prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(trigger, { name, mins, history }) {
  const persona = `You are a tiny desktop companion animal. You speak in very short, warm sentences (max 12 words). No punctuation at the end. No emojis.`;

  const context = history
    ? `Recent activity context:\n${history}\n`
    : '';

  const triggers = {
    task_complete: `${name} just finished a task. Say something encouraging.`,
    typing_long:   `${name} has been typing for ${mins} minutes straight. Gently acknowledge it.`,
    idle_long:     `${name} just came back after ${mins} minutes away. Welcome them back briefly.`,
    water:         `Remind ${name} to drink water. Be casual, not pushy.`,
    pomodoro_break:`${name} just finished a 25-minute focus block. Tell them to take a break.`,
    idle:          `Say something small and ambient to ${name}. Like a cat would.`,
  };

  const instruction = triggers[trigger] || triggers.idle;

  return `${persona}\n\n${context}${instruction}\nReply with only the message, nothing else.`;
}

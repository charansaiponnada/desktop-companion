/**
 * companion — daily summarizer
 * runs at the end of each day, compresses activity_log into a daily_summary
 * used as context for the AI brain going forward
 */

import { memory } from '../memory/store.js';
import { brain }  from '../ai/brain.js';

// ── rule-based summary (fallback when Ollama not available) ───────────────────
function buildRuleSummary(stats) {
  const parts = [];

  const keys = Object.keys(stats);
  if (!keys.length) return 'quiet day, not much activity logged';

  const typing   = stats['key_burst']   || 0;
  const tasks    = stats['task_complete'] || 0;
  const pomo     = stats['pomodoro']    || 0;
  const speech   = stats['speech']      || 0;

  if (typing > 500) parts.push('heavy typing day');
  else if (typing > 100) parts.push('moderate typing');
  else parts.push('light keyboard activity');

  if (tasks > 0)  parts.push(`${tasks} task${tasks > 1 ? 's' : ''} completed`);
  if (pomo > 0)   parts.push(`${pomo} pomodoro sessions`);
  if (speech > 5) parts.push('lots of pet interactions');

  return parts.join(', ');
}

// ── AI-powered summary ────────────────────────────────────────────────────────
async function buildAISummary(stats, date, previousSummaries) {
  const statStr = Object.entries(stats)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const prevStr = previousSummaries.slice(0, 3)
    .map(s => `${s.date}: ${s.summary}`)
    .join('\n');

  const prompt = `
You are summarizing a developer's work day for a companion app's memory.
Date: ${date}
Today's activity counts: ${statStr}
${prevStr ? `Recent days:\n${prevStr}` : ''}

Write one short sentence (max 20 words) describing today's work pattern.
Be factual and specific. No fluff. No greeting.
  `.trim();

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt,
        stream: false,
        options: { num_predict: 40, temperature: 0.3 }
      }),
      signal: AbortSignal.timeout(10000)
    });
    const d = await response.json();
    return d.response.trim();
  } catch {
    return buildRuleSummary(stats);
  }
}

// ── public: summarize a given date ───────────────────────────────────────────
export async function summarizeDay(date) {
  const stats    = await memory.getDayStats(date);
  if (!stats) return;

  const previous = await memory.getRecentSummaries(3);
  const summary  = brain.isAvailable()
    ? await buildAISummary(stats, date, previous)
    : buildRuleSummary(stats);

  // infer mood from stats
  const tasks = stats['task_complete'] || 0;
  const typing = stats['key_burst'] || 0;
  let mood = 'neutral';
  if (tasks > 3 || typing > 300) mood = 'productive';
  else if (tasks === 0 && typing < 50) mood = 'slow';

  await memory.saveSummary(date, summary, mood);
  return { date, summary, mood };
}

// ── scheduler: call summarizeDay at end of each day ──────────────────────────
export function startDailySummarizer() {
  function scheduleNext() {
    const now     = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0); // 12:01am
    const msUntil = tomorrow - now;

    setTimeout(async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      await summarizeDay(dateStr);
      scheduleNext();
    }, msUntil);
  }

  scheduleNext();
}

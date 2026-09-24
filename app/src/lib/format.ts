import type { Lang } from '../api';

const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
  hi: ['जन॰', 'फ़र॰', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल॰', 'अग॰', 'सित॰', 'अक्टू॰', 'नव॰', 'दिस॰'],
};

const pad = (n: number) => String(n).padStart(2, '0');

export const formatMoney = (amount: number) => `₹ ${amount.toLocaleString('en-IN')}`;

// "10 Aug 26"
export function formatDate(iso: string, lang: Lang) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

// "11:50 PM"
export function formatTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours() % 12 || 12)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
}

export const formatDateTime = (iso: string, lang: Lang) => `${formatDate(iso, lang)}, ${formatTime(iso)}`;

// "01d : 06h : 28m : 32s"
export function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 86400))}d : ${pad(Math.floor((s % 86400) / 3600))}h : ${pad(Math.floor((s % 3600) / 60))}m : ${pad(s % 60)}s`;
}

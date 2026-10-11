'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { OPEN_MIDI, STRING_NAMES } from '../../features/learning/domain/curriculum.ts';
import { useAudio } from '../../features/audio/components/AudioProvider.tsx';
export default function GuitarStrings({
  active,
  frets = [0, 0, 0, 0, 0, 0],
  sounding = false,
  onSelect
}: { active?: number; frets?: number[]; sounding?: boolean; onSelect?: (index: number) => void }) {
  const id = useId();
  const { audio } = useAudio();
  const context = useRef<AudioContext | null>(null);
  const [error, setError] = useState('');
  const [plucked, setPlucked] = useState<number | null>(null);
  const vibration = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (vibration.current) clearTimeout(vibration.current);
    void context.current?.close().catch(() => {});
  }, []);
  async function play(index: number) {
    if (frets[index] < 0) return;
    onSelect?.(index);
    if (vibration.current) clearTimeout(vibration.current);
    setPlucked(index);
    vibration.current = setTimeout(() => setPlucked(null), 1250);
    if (audio.status !== 'off') return;
    try {
      const output = context.current ??= new AudioContext();
      await output.resume();
      const oscillator = output.createOscillator();
      const gain = output.createGain();
      const now = output.currentTime;
      // ponytail: synthesized reference tone; use recorded samples for acoustic guitar timbre.
      oscillator.type = 'triangle';
      oscillator.frequency.value = 440 * 2 ** ((OPEN_MIDI[index] + frets[index] - 69) / 12);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      oscillator.connect(gain).connect(output.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(now);
      oscillator.stop(now + 1.25);
      setError('');
    } catch {
      setError('Suara contoh tidak tersedia. Coba lagi pada browser yang mendukung Web Audio.');
    }
  }
  return <div className="guitar-strings [&_svg]:mx-auto [&_svg]:block [&_svg]:w-full [&_svg]:max-w-[360px] [&_svg]:rounded-2xl [&_svg]:bg-[#f3f5ee] [&_svg]:border [&_svg]:border-line [&_text]:text-[11px] [&_text]:font-semibold">
    <div className="mx-auto mb-3 flex max-w-[360px] items-center justify-between text-xs text-[#58675e]"><span>Fret 1–5 · tampak depan</span><span>6 senar</span></div>
    <div className="relative mx-auto max-w-[360px]">
    <svg viewBox="0 0 320 400" role="img" aria-label={`Close-up fret 1 sampai 5 dari depan; senar tebal di kiri.${active === undefined ? '' : ` Target: ${STRING_NAMES[active]}.`}`}>
      <defs>
        <linearGradient id={`${id}-wood`} x1="0" x2="1"><stop stopColor="#48382d" /><stop offset=".45" stopColor="#735a43" /><stop offset="1" stopColor="#48382d" /></linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#707778" /><stop offset=".4" stopColor="#f4f3e9" /><stop offset="1" stopColor="#737b7e" /></linearGradient>
      </defs>
      <rect x="65" y="73" width="190" height="309" rx="10" fill="#263d32" opacity=".08" />
      <rect x="73" y="70" width="174" height="306" rx="7" fill={`url(#${id}-wood)`} stroke="#9c8064" strokeWidth="3" />
      {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${82 + i * 9} 79q${i % 2 ? 3 : -3} 145 0 293`} stroke="#e4c79d" strokeOpacity=".1" fill="none" />)}
      <rect x="77" y="65" width="166" height="12" rx="2" fill="#e9dfc7" />
      {[138, 196, 251, 303, 352].map((y, index) => <g key={y}>
        <rect x="75" y={y} width="170" height="5" rx="2" fill={`url(#${id}-metal)`} />
        <text x="49" y={y - 20} textAnchor="middle" fill="#58675e">{index + 1}</text>
        {[2, 4].includes(index) && <circle cx="160" cy={y - 23} r="6" fill="#d9d4bf" opacity=".85" />}
      </g>)}
      {STRING_NAMES.map((name, index) => <g key={name} onClick={() => void play(index)} style={{ cursor: frets[index] < 0 ? 'default' : 'pointer' }} className={`${active === index ? 'string-active' : ''} ${(active === index && sounding) || plucked === index ? 'string-sounding' : ''} ${frets[index] < 0 ? 'string-muted' : ''}`}>
        <path d={`M${90 + index * 28} 76V372`} stroke="transparent" strokeWidth="24" />
        {active === index && <path d={`M${90 + index * 28} 76V372`} stroke="#c4dca8" strokeOpacity=".3" strokeWidth="16" />}
        <path d={`M${92 + index * 28} 76V372`} stroke="#000" strokeOpacity=".25" strokeWidth="4" />
        <path className="guitar-string" d={`M${90 + index * 28} 76V372`} style={{ strokeWidth: 3.2 - index * 0.42 }} fill="none" />
        {index < 3 && <path d={`M${90 + index * 28} 79V372`} stroke="#756c55" strokeWidth="1" strokeDasharray="1 3" opacity={frets[index] < 0 ? .2 : .55} />}
        {frets[index] > 0 && <g><circle cx={90 + index * 28} cy={[0, 112, 171, 227, 280, 330][frets[index]] ?? 330} r="11" fill="#a3e0bc" stroke="#edfdf4" strokeWidth="2" /><text x={90 + index * 28} y={([0, 112, 171, 227, 280, 330][frets[index]] ?? 330) + 4} textAnchor="middle" fill="#183c2a">{frets[index]}</text></g>}
        <text x={90 + index * 28} y="30" textAnchor="middle" fill={active === index ? '#3e6450' : '#263d32'}>{['E', 'A', 'D', 'G', 'B', 'e'][index]}</text>
        <text x={90 + index * 28} y="55" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700 }} fill={frets[index] < 0 ? '#a44736' : '#3e6450'}>{frets[index] < 0 ? '×' : frets[index] === 0 ? '○' : frets[index]}</text>
      </g>)}
    </svg>
    </div>
    <div className="mx-auto mt-3 grid max-w-[360px] grid-cols-3 gap-2 min-[400px]:grid-cols-6" role="group" aria-label={onSelect ? 'Pilih senar yang disetel' : 'Dengarkan suara senar'}>
      {STRING_NAMES.map((name, index) => <button key={name} type="button" className="secondary min-h-11 rounded-xl border border-line bg-white px-1 py-2 text-sm text-[#3e6450] hover:bg-[#edf3e5] disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:bg-[#e2ebd6] aria-pressed:outline-2 aria-pressed:outline-[#446139]" aria-label={`${name}, ${frets[index] < 0 ? 'jangan dipetik' : frets[index] === 0 ? 'terbuka' : `fret ${frets[index]}`}`} aria-pressed={onSelect ? active === index : undefined} disabled={frets[index] < 0 || (!onSelect && audio.status !== 'off')} onClick={() => void play(index)}>{['E', 'A', 'D', 'G', 'B', 'e'][index]}<span className="block text-[10px]">{onSelect ? `Senar ${6 - index}` : frets[index] < 0 ? '×' : 'Putar'}</span></button>)}
    </div>
    <p className="mt-2 text-xs text-[#58675e]">{audio.status === 'off' ? 'Ketuk senar atau tombol untuk mendengar nada sintetis.' : onSelect ? 'Ketuk tombol untuk memilih senar. Suara contoh dimatikan saat mikrofon aktif.' : 'Matikan mikrofon untuk mendengar nada contoh.'}</p>
    {error && <p role="status" className="text-xs text-red-700">{error}</p>}
    <p className="privacy text-xs! leading-relaxed">Senar tebal di kiri · ○ terbuka · × jangan dipetik · angka = fret</p>
  </div>;
}

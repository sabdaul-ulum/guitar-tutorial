'use client';

import GuitarStrings from '../../../components/guitar/GuitarStrings.tsx';
import { useState } from 'react';
import Link from 'next/link';
import { OPEN_MIDI, STRING_NAMES } from '../../learning/domain/curriculum.ts';
import { describePitch } from '../lib/audio-levels.ts';
import { useAudio } from './AudioProvider.tsx';
import MicrophonePanel from './MicrophonePanel.tsx';
export default function Tuner() {
  const [index, setIndex] = useState(0);
  const {
    audio
  } = useAudio();
  const target = OPEN_MIDI[index];
  const frequency = 440 * 2 ** ((target - 69) / 12);
  const pitch = audio.status === 'ready' && !audio.noisy && !audio.clipping && audio.clarity >= 0.9 ? describePitch(audio.frequency) : null;
  const cents = pitch ? Math.round(1200 * Math.log2(audio.frequency / frequency)) : null;
  return <>
    <section className="page-heading mt-10 mb-8 flex items-center justify-between [&_h1]:text-[clamp(1.5rem,3vw,2rem)] [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:leading-tight [&_p]:mt-[9px] [&_p]:text-xs max-[560px]:mt-[25px] max-[560px]:mb-[21px] max-[560px]:[&_p]:text-[11px]"><div><h1>Tuner gitar</h1><p>Standard tuning E A D G B e. Petik satu senar terbuka, tanpa chord.</p></div></section>
    <div className="grid items-start gap-5 min-[801px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
    <section className="min-w-0 rounded-2xl border border-line bg-white p-4 min-[801px]:p-5 max-[800px]:[&_.guitar-strings_svg]:max-w-[200px]" aria-labelledby="tuner-strings">
      <h2 id="tuner-strings" className="mt-0 text-lg">1. Pilih senar</h2>
      <p className="mb-5 text-sm text-[#58675e]">Senar 6 paling tebal · senar 1 paling tipis.</p>
      <GuitarStrings active={index} onSelect={setIndex} sounding={!!pitch} />
    </section>
    <div className="grid min-w-0 gap-5">
    <section className="content-card tuner rounded-2xl border border-line bg-white p-4 min-[801px]:p-6" aria-labelledby="tuner-listen">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="tuner-listen" className="m-0 text-lg">2. Petik senar terbuka</h2><span className="rounded-full bg-[#edf3e5] px-3 py-1.5 text-xs text-[#3e6450]">{audio.status === 'ready' ? 'Mikrofon aktif' : 'Siapkan mikrofon'}</span></div>
      <div className="my-6 rounded-2xl bg-[#f3f5ee] p-5 text-center">
        <p className="m-0 text-xs text-[#58675e]">Target · {STRING_NAMES[index]} · {frequency.toFixed(2)} Hz</p>
        <strong className="tuner-note my-3 block text-[72px] leading-none text-[#263d32]">{pitch?.name || '—'}</strong>
        <p className="m-0 text-xs text-[#58675e]">{pitch ? `Terdeteksi ${audio.frequency.toFixed(2)} Hz` : 'Petik satu senar, biarkan berdering'}</p>
      </div>
    <div className={`tuning-gauge ${cents !== null && Math.abs(cents) <= 10 ? 'in-tune' : ''}`} aria-hidden="true">
      <div className="tuning-labels my-2.5 flex justify-between text-[11px]"><span>Terlalu rendah</span><span>Pas</span><span>Terlalu tinggi</span></div>
      <div className="tuning-scale relative h-16 border-b-2 border-[#8b6744]"><span className="tuning-center absolute left-[41%] h-full w-[18%] border-x border-[#446139] bg-[#bdd0a366]" /><span className="tuning-needle absolute bottom-0 h-14 w-1 -translate-x-1/2 bg-[#a25c25] transition-[left] duration-150 ease-out" style={{
              left: `${50 + Math.max(-50, Math.min(50, cents ?? 0)) * 0.9}%`,
              opacity: cents === null ? 0.25 : 1
            }} /></div>
      <div className="tuning-labels my-2.5 flex justify-between text-[11px]"><span>−50 cents</span><span>0</span><span>+50 cents</span></div>
    </div>
    <p className="rounded-xl bg-[#edf3e5] p-4 text-sm text-[#3e6450]" role="status">{cents === null ? 'Menunggu nada yang jelas…' : Math.abs(cents) <= 10 ? '✓ Sudah mendekati tuning' : cents < 0 ? `Terlalu rendah (${cents} cents). Kencangkan perlahan.` : `Terlalu tinggi (+${cents} cents). Kendurkan perlahan.`}</p>
    <p className="text-xs leading-relaxed text-[#58675e]">Putar tuning peg sedikit demi sedikit. Jika nada berbeda satu oktaf, periksa senar yang dipilih. Tuner tidak otomatis menyetel gitar dan tidak menyimpan kelulusan.</p></section>
    <MicrophonePanel />
    </div></div>
    <div className="my-6"><Link className="primary inline-flex items-center justify-center gap-[27px] min-h-11 rounded-xl border border-[#385c45] bg-[#385c45] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294a34] motion-safe:hover:-translate-y-px" href="/learn">Buka chord dasar →</Link></div>
  </>;
}

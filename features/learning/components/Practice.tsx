'use client';

import type { Lesson } from '../domain/curriculum.ts';
import { CHORDS, PROOF_STRUMS, pitchMatches } from '../domain/curriculum.ts';
import ChordDiagram from '../../../components/guitar/ChordDiagram.tsx';
import GuitarStrings from '../../../components/guitar/GuitarStrings.tsx';
import MicrophonePanel from '../../audio/components/MicrophonePanel.tsx';
import { usePracticeSession } from '../hooks/usePracticeSession.ts';
export default function Practice({
  lesson,
  onComplete
}: { lesson: Lesson; onComplete: (id: string) => void }) {
  const {
    audio,
    phase,
    stringIndex,
    strums,
    message,
    running,
    notes,
    revision,
    demo,
    offset,
    targetIndex,
    countdown,
    beat,
    playing,
    target,
    chord,
    tolerance,
    strings,
    targetString,
    detected,
    cents,
    exercise,
    skipStrings,
    setOffset,
    startRhythm,
    pauseRhythm,
    enableDemo,
    simulateStrum
  } = usePracticeSession({
    lesson,
    onComplete
  });
  return <section className="practice-panel mt-[35px] grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] overflow-hidden rounded-2xl border border-line bg-white max-[1100px]:grid-cols-1 max-[560px]:mt-6" id="practice" aria-label="Latihan chord">
      <div className="practice-intro min-w-0 border-r border-line bg-[#f0f3ea] p-6 max-[1100px]:p-[18px_24px] max-[1100px]:border-r-0 max-[1100px]:border-b max-[560px]:p-[18px_22px] [&>h2]:text-xl [&>h2]:tracking-[-.7px] max-[560px]:[&>h2]:text-[17px] [&>p]:mt-2.5 [&>p]:text-xs [&>p]:leading-relaxed [&>svg]:my-4 [&>svg]:mx-auto [&>svg]:block [&>svg]:w-40 [&>svg]:max-w-full [&_.mic-panel]:p-3">
        <div className="eyebrow mb-[11px] text-[9px] font-bold tracking-[1.8px] text-[#829475]">{lesson.kind === 'single' ? 'SATU CHORD DULU' : 'PERPINDAHAN BERTAHAP'}</div>
        <h2>{lesson.title}</h2>
        <p>{CHORDS[chord].tip}</p>
        <ChordDiagram chord={chord} />
        <p>○ senar terbuka · × jangan dipetik</p>
        <MicrophonePanel />
        <p className="privacy text-xs! leading-relaxed">Audio tetap di perangkat. Standard tuning: E A D G B e. Gunakan headphone.</p>
      </div>
      <div className="game min-w-0 p-[23px_27px] max-[1100px]:p-5 max-[560px]:p-[20px_17px] [&>h2]:text-[23px] max-[560px]:[&>h2]:text-[19px]" data-revision={revision}>
        <div className="learning-steps mb-[25px] flex flex-wrap gap-2 [&_span]:rounded-[20px] [&_span]:bg-[#f2f4ec] [&_span]:px-3 [&_span]:py-2 [&_span]:text-[10px] [&_span]:text-[#89977f] [&_.current]:bg-[#e2ebd6] [&_.current]:text-[#446139]"><span className={phase === 'strings' ? 'current' : ''}>1. Cek senar</span><span className={phase === 'strum' ? 'current' : ''}>2. Strum bebas</span><span className={phase === 'rhythm' || phase === 'done' ? 'current' : ''}>{lesson.kind === 'single' && !demo ? '3. Selesai' : '3. Ritme'}</span></div>
        <h2>{phase === 'done' ? 'Perkenalan selesai!' : phase === 'strings' ? 'Pelan, satu senar saja.' : phase === 'strum' ? 'Bunyikan chord, tanpa terburu-buru.' : 'Temukan ketukanmu.'}</h2>
        {lesson.tip && <p>{lesson.tip}</p>}
        {lesson.pattern && <p>Pola: {lesson.directions?.join(' ')} · mikrofon menilai bunyi dan timing, bukan arah pick.</p>}
        {running && countdown > 0 && <p role="status" aria-live="polite"><strong>Bersiap: {countdown}</strong></p>}
        {phase === 'strings' && <div className="single-target min-h-[190px] px-2.5 py-[30px] text-center [&_strong]:block [&_strong]:text-[44px] [&_strong]:text-[#607f49] [&_p]:mt-2 [&_p]:text-xs [&_small]:mt-2.5 [&_small]:block [&_small]:text-[#85957a]">
            <GuitarStrings active={targetString?.index} frets={CHORDS[chord].frets} sounding={audio.status === 'ready' && !audio.noisy && !audio.clipping && pitchMatches(audio.frequency, audio.clarity, targetString?.midi)} />
            <strong>Petik {targetString?.name}</strong>
            <p>{targetString?.fret === 0 ? 'Senar lepas / terbuka' : `Tekan Fret ${targetString?.fret}`} · senar {stringIndex + 1}/{strings.length}</p>
            <p>Tahan posisi chord <b>{chord}</b>. Petik <em>hanya</em> senar ini, lalu redam sebelum senar berikutnya.</p>
            <small>{audio.frequency ? `${detected?.name || '—'} · ${audio.frequency.toFixed(1)} Hz · ${cents !== null && cents > 0 ? '+' : ''}${cents} cents dari target · kejernihan ${Math.round(audio.clarity * 100)}%` : 'Menunggu nada petikan yang jelas…'}</small>
            <div className="mt-3">
              <button type="button" className="secondary min-h-11 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-[#3e6450] hover:bg-[#edf3e5]" onClick={skipStrings}>
                Lewati cek senar → Langsung strum chord
              </button>
            </div>
          </div>}
        {phase === 'strum' && <div className="single-target min-h-[190px] px-2.5 py-[30px] text-center [&_strong]:block [&_strong]:text-[44px] [&_strong]:text-[#607f49] [&_p]:mt-2 [&_p]:text-xs [&_small]:mt-2.5 [&_small]:block [&_small]:text-[#85957a]"><strong>{chord}</strong><p>{strums} / {PROOF_STRUMS} strum sesuai</p><p>Petik semua senar yang diizinkan. Redam, lalu ulangi.</p></div>}
        {phase === 'rhythm' && <>
          <div className="game-top mt-5 flex items-center justify-between text-[8px] tracking-[1px] text-[#8c9881] max-[560px]:text-[6px] [&>span>b]:font-heading [&>span>b]:text-[21px] [&>span>b]:font-bold [&>span>b]:text-[#45623b] max-[560px]:[&>span>b]:text-[19px]"><span>{exercise.proof ? 'PEMBUKTIAN · 13/16 BENAR' : 'MEMBANGUN KONSISTENSI'}</span><span><b>{exercise.tempo}</b> / {exercise.max} BPM</span></div>
          <div className="mt-5 rounded-2xl border border-line bg-[#f8faf5] p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 text-xs text-[#61745b]">
              <span>{!running ? 'Siap saat kamu siap' : countdown > 0 ? `Bersiap · ${countdown} ketukan` : beat < 0 ? 'Tunggu kartu mencapai garis petik' : 'Ikuti arah petikan pada kartu'}</span>
              <span>↓ turun · ↑ naik</span>
            </div>
            <div className="rhythm-track relative my-3 h-36 overflow-hidden rounded-xl border border-[#dbe4d3] bg-white" aria-label="Track petikan; kartu bergerak menuju zona petik">
              <div className="absolute top-1/2 h-px w-full bg-[#dbe4d3]" />
              <div aria-hidden="true" className="absolute h-full bg-[#bdd0a344]" style={{ left: `${18 - tolerance * 35 * exercise.tempo / 60}%`, width: `${2 * tolerance * 35 * exercise.tempo / 60}%` }} />
              <div className="absolute left-[18%] h-full border-l-2 border-[#446139]"><span className="absolute bottom-2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-[#446139]">PETIK DI SINI</span></div>
              {notes.map(note => <div key={note.index} className="target-note motion-reduce:hidden absolute top-8 flex h-20 w-14 -translate-x-1/2 flex-col items-center justify-center rounded-xl border border-[#a9bd95] bg-[#e6edd9] text-[#385c45] shadow-sm" style={{ left: `${note.position}%` }}><strong className="text-xl">{note.chord}</strong><span className="text-lg">{note.direction}</span></div>)}
              <div className="absolute inset-0 hidden place-items-center bg-white text-center motion-reduce:grid"><div><strong className="block text-3xl text-[#385c45]">{playing?.chord || chord}</strong><span className="text-sm">Petikan {lesson.pattern ? lesson.directions?.[lesson.pattern.indexOf(beat / 2)] || '—' : beat === 0 ? '↓' : '—'} · {running && beat >= 0 ? 'ikuti perubahan arah petikan' : 'tunggu petikan pertama'}</span></div></div>
              {running && countdown > 0 && <div className="absolute inset-0 grid place-items-center bg-white text-center"><div><strong className="block text-4xl text-[#385c45]">{countdown}</strong><span className="text-sm text-[#61745b]">Bersiap · latihan belum dimulai</span></div></div>}
            </div>
            <p className="text-xs text-[#61745b]">Petik sesuai arah saat pusat kartu menyentuh garis. — berarti tidak dipetik.</p>

          </div>
          <div className="mb-2 mt-5 flex justify-between gap-3 text-sm"><span>Segmen {exercise.count} / {exercise.length}</span><span className="font-semibold text-[#385c45]">{exercise.hits} benar</span></div>
          <progress className="mb-4 h-2 w-full" aria-label="Progres segmen ritme" max={exercise.length} value={exercise.count} />
          <div className="game-controls flex flex-wrap items-center gap-2.5 max-[1100px]:gap-[5px] [&_.primary]:px-[13px] [&_.primary]:py-[9px] [&_.primary]:text-sm"><button className="primary inline-flex items-center justify-center gap-[27px] min-h-11 rounded-xl border border-[#385c45] bg-[#385c45] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294a34] motion-safe:hover:-translate-y-px" onClick={startRhythm} disabled={running || exercise.passed}>Mulai / lanjutkan</button><button className="secondary min-h-11 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-[#3e6450] hover:bg-[#edf3e5]" onClick={pauseRhythm} disabled={!running}>Jeda</button></div>
          <label className="latency-label my-5 flex items-center gap-3 text-[11px] [&_input]:w-[75px] [&_input]:rounded-[5px] [&_input]:border [&_input]:border-[#dbe4d3] [&_input]:p-[7px]">Kompensasi input (ms)<input type="number" min="0" max="500" step="10" value={offset} onChange={event => setOffset(Math.max(0, Math.min(500, Number(event.target.value) || 0)))} /></label>
        </>}
        <p className="live-feedback my-5 min-h-[65px] rounded-[7px] bg-[#f0f5e9] p-[15px] text-xs" role="status" aria-live="polite">{message}</p>
        <details><summary>Uji antarmuka tanpa mikrofon</summary><p>Simulasi tidak membuka materi atau menyimpan kelulusan.</p><button className="secondary min-h-11 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-[#3e6450] hover:bg-[#edf3e5]" disabled={demo} onClick={enableDemo}>Aktifkan simulasi ritme</button>{demo && <button className="secondary min-h-11 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-[#3e6450] hover:bg-[#edf3e5]" onClick={simulateStrum}>Simulasikan petikan tepat</button>}</details>
        <p className="privacy text-xs! leading-relaxed">Pitchy: nada tunggal. Meyda: strum eksperimental, bukan jaminan posisi jari benar.</p>
      </div>
    </section>;
}

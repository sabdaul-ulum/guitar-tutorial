'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LESSONS, isKnownLesson } from '../domain/curriculum.ts';
import { useProgress } from '../../progress/components/ProgressProvider.tsx';
import Practice from './Practice.tsx';
import Icon from '../../../components/Icon.tsx';
export default function LessonPage({
  lesson
}: { lesson: import('../domain/curriculum.ts').Lesson }) {
  const {
    completed,
    ready,
    warning,
    complete
  } = useProgress();
  const [attempt, setAttempt] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!celebrating) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [celebrating]);
  if (!ready) {
    return <p>Memuat progres…</p>;
  }
  if (!isKnownLesson(lesson.id)) {
    return <section className="content-card mb-6 min-w-0 rounded-2xl border border-line bg-white p-6 [&_p]:my-3 [&_p]:text-[13px] [&_p]:leading-[1.7] [&_li]:my-3 [&_li]:text-[13px] [&_li]:leading-[1.7] [&_ol]:pl-5"><h1>Materi tidak tersedia</h1><Link className="primary inline-flex items-center justify-center gap-[27px] min-h-11 rounded-xl border border-[#385c45] bg-[#385c45] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294a34] motion-safe:hover:-translate-y-px" href="/learn">Lihat course</Link></section>;
  }
  const next = LESSONS[LESSONS.findIndex(item => item.id === lesson.id) + 1];
  return <>
    <section className="page-heading mt-10 mb-8 flex items-center justify-between [&_h1]:text-[clamp(1.5rem,3vw,2rem)] [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:leading-tight [&_p]:mt-[9px] [&_p]:text-xs max-[560px]:mt-[25px] max-[560px]:mb-[21px] max-[560px]:[&_p]:text-[11px]"><div><h1>{lesson.title}</h1><p>{lesson.kind === 'single' ? 'Cek senar dan 5 strum bebas. Tanpa latihan ritme panjang.' : lesson.kind === 'strumming' ? 'Ikuti pola petikan. Ganti chord setiap birama.' : 'Transisi acak tanpa pengulangan langsung, satu chord setiap empat ketukan.'}</p></div></section>
    {completed.includes(lesson.id) && <section className="mb-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#dce7da] bg-[#f0f6ee] p-5 sm:p-6" aria-label="Hasil latihan">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-[#385c45]"><Icon name="check" className="size-7" /></span>
        <div><h2 className="text-base font-bold">Latihan lulus</h2><p className="mt-1 text-sm">{warning ? 'Progres tersedia untuk sesi ini.' : 'Kemajuanmu tersimpan. Siap untuk langkah berikutnya?'}</p></div>
      </div>
      <Link className="primary inline-flex min-h-11 max-w-full items-center justify-center gap-3 rounded-xl border border-[#385c45] bg-[#385c45] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294a34] max-[560px]:w-full" href={next ? `/learn/${next.id}` : '/learn'}><span>{next ? `Lanjut: ${next.title}` : 'Lihat semua course'}</span><Icon name="arrow" /></Link>
    </section>}
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold">Ruang latihan</h2>
      <button className="secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-[#3e6450] hover:bg-[#edf3e5]" onClick={() => setAttempt(value => value + 1)}><Icon name="restart" />Ulangi latihan dari awal</button>
    </div>
    {<Practice key={`${lesson.id}-${attempt}`} lesson={lesson} onComplete={id => {
      complete(id);
      setCelebrating(true);
    }} />}
    <dialog ref={dialog} className="success-dialog m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-[440px] overflow-auto rounded-[20px] border border-line bg-white p-8 text-center text-inherit [&>p]:my-4 [&>p]:mb-6 [&>p]:leading-[1.6] [&_.primary]:mt-3 [&_.primary]:block [&_.primary]:w-full [&_.secondary]:mt-3 [&_.secondary]:block [&_.secondary]:w-full" aria-labelledby="success-title" onClose={() => setCelebrating(false)}>
      <div className="success-badge mx-auto mb-5 size-20 rounded-full bg-[#e2ebd6] grid place-items-center text-[#446139] shadow-[0_0_0_12px_#f0f5e9]" aria-hidden="true"><Icon name="check" className="size-10" /></div>
      <h2 id="success-title">Latihan lulus!</h2>
      <p>{lesson.title} berhasil diselesaikan. {warning ? 'Progres tersedia untuk sesi ini; penyimpanan perangkat bermasalah.' : 'Kemajuanmu tersimpan di perangkat ini!'}</p>
      <Link autoFocus onClick={() => dialog.current?.close()} className="primary inline-flex items-center justify-center gap-[27px] min-h-11 rounded-xl border border-[#385c45] bg-[#385c45] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294a34] motion-safe:hover:-translate-y-px" href={next ? `/learn/${next.id}` : '/learn'}>{next ? 'Materi berikutnya →' : 'Lihat semua course'}</Link>
      <button className="secondary min-h-11 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-[#3e6450] hover:bg-[#edf3e5]" onClick={() => {
        dialog.current?.close();
        setAttempt(value => value + 1);
      }}>Ulangi latihan</button>
    </dialog>
  </>;
}

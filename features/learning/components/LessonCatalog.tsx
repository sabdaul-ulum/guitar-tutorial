'use client';

import Link from 'next/link';
import { LESSONS, COURSES, TRANSITION_LESSONS } from '../domain/curriculum.ts';
import { useProgress } from '../../progress/components/ProgressProvider.tsx';
export default function LessonCatalog({
  transitions = false
}: { transitions?: boolean }) {
  const {
    completed,
    ready
  } = useProgress();
  const lessons = transitions ? TRANSITION_LESSONS : LESSONS;
  if (!ready) {
    return <p>Memuat progres…</p>;
  }
  return <>
    <section className="page-heading mt-10 mb-8 flex items-center justify-between [&_h1]:text-[clamp(1.5rem,3vw,2rem)] [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:leading-tight [&_p]:mt-[9px] [&_p]:text-xs max-[560px]:mt-[25px] max-[560px]:mb-[21px] max-[560px]:[&_p]:text-[11px]"><div><h1>{transitions ? 'Perpindahan chord' : 'Course gitar'}</h1><p>Semua materi terbuka. Ikuti urutan yang disarankan atau langsung pilih latihan yang ingin dicoba.</p></div></section>
    {COURSES.map((course, index) => <section key={course} className="content-card mb-6 min-w-0 rounded-2xl border border-line bg-white p-6 [&_p]:my-3 [&_p]:text-[13px] [&_p]:leading-[1.7] [&_li]:my-3 [&_li]:text-[13px] [&_li]:leading-[1.7] [&_ol]:pl-5"><h2>{course}</h2>
    <div className="curriculum-grid grid mt-5 grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">{lessons.filter(lesson => lesson.course === index).map(lesson => {
          return <Link key={lesson.id} className="lesson block rounded-xl border border-line bg-white p-5 text-left text-ink hover:border-[#a8bba4] hover:bg-[#f5f8f2] motion-safe:hover:-translate-y-px max-[560px]:[&_h3]:mt-[17px] [&_h3]:text-sm [&_h3]:tracking-[-.3px] [&_p]:mt-2 [&_p]:mb-[19px] [&_p]:text-[11px] max-[800px]:[&_h3]:text-xs max-[800px]:[&_p]:text-[10px] max-[560px]:p-[13px] max-[560px]:[&_h3]:text-[13px] max-[560px]:[&_p]:mb-3 active" href={`/learn/${lesson.id}`}><span className="text-[10px] font-semibold tracking-wider text-[#58675e]">{completed.includes(lesson.id) ? '✓ SELESAI' : 'SIAP DIPELAJARI'}</span><h3>{lesson.title}</h3><p>Latihan langsung →</p></Link>;
        })}</div></section>)}
  </>;
}

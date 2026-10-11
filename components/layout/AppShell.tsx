'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LESSONS, COURSES } from '../../features/learning/domain/curriculum.ts';
import { useProgress } from '../../features/progress/components/ProgressProvider.tsx';
import { useAudio } from '../../features/audio/components/AudioProvider.tsx';

export default function AppShell({
  children
}: { children: React.ReactNode }) {
  const path = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  function closeMenu() {
    menu.current?.close();
    setMenuOpen(false);
  }
  useEffect(() => {
    menu.current?.close();
    setMenuOpen(false);
  }, [path]);
  useEffect(() => {
    if (!menuOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 801px)');
    const closeOnDesktop = () => closeMenu();
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = overflow;
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);
  const {
    completed,
    ready,
    warning
  } = useProgress();
  const {
    audio
  } = useAudio();
  function item(href: string, title: string) {
    const isSelected = path === href;
    return (
      <Link
        href={href}
        onClick={closeMenu}
        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
          isSelected ? 'bg-[#eaf0e4] font-semibold text-[#355e43]' : 'text-[#58675e] hover:bg-[#f1f5ef]'
        }`}
        aria-current={isSelected ? 'page' : undefined}
      >
        {title}
      </Link>
    );
  }
  function lessons(list: import('../../features/learning/domain/curriculum.ts').Lesson[]) {
    return (
      <div className="submenu pl-3">
        {list.map(lesson => (
          <div key={lesson.id}>
            {item(`/learn/${lesson.id}`, `${completed.includes(lesson.id) ? '✓ ' : ''}${lesson.title}`)}
          </div>
        ))}
      </div>
    );
  }
  const nextLesson = LESSONS.find(lesson => !completed.includes(lesson.id));
  const activeCourse = LESSONS.find(lesson => path === `/learn/${lesson.id}`)?.course;
  const navigation = <>
        <Link
          className="brand pl-3.5 font-heading text-[37px] font-extrabold tracking-[-2px] text-ink max-[800px]:hidden"
          href="/"
          onClick={closeMenu}
        >
          petik<span className="text-[#9bb878]">.</span>
        </Link>
        <nav
          aria-label="Menu utama"
          className="mt-5 grid gap-2 max-[800px]:mt-3 "
        >
          {item('/', 'Beranda')}
          <div className="menu-group mt-3.5 [&>strong]:block [&>strong]:px-3 [&>strong]:py-2 [&>strong]:text-xs">
            <strong>Persiapan</strong>
            <div className="submenu pl-3">
              {item('/setup', 'Cek mikrofon')}
              {item('/tuner', 'Tuner gitar')}
            </div>
          </div>
          {ready && nextLesson && item(`/learn/${nextLesson.id}`, 'Lanjutkan latihan')}
          {item('/learn', 'Semua course')}
          {COURSES.map((course, index) => (
            <details key={`${course}-${activeCourse}`} open={activeCourse === index} className="menu-group rounded-xl">
              <summary className="min-h-11 cursor-pointer rounded-xl px-3 py-3 text-xs font-semibold text-[#3e6450] hover:bg-[#f1f5ef] focus-visible:outline-2 focus-visible:outline-offset-2">{course}</summary>
              {lessons(LESSONS.filter(lesson => lesson.course === index))}
            </details>
          ))}
        </nav>
        <p className="privacy mt-auto pt-6 text-xs! leading-relaxed text-[#849086] max-[800px]:mt-2">
          Progres lokal · {completed.length}/{LESSONS.length} selesai
        </p>
  </>;
  return (
    <>
      <a
        className="skip-link absolute -left-[9999px] focus:left-5 focus:top-2.5 focus:z-[100] focus:bg-white focus:p-3"
        href="#content"
      >
        Lewati ke konten
      </a>
      <aside className="sidebar app-sidebar fixed inset-y-0 left-0 z-10 flex w-[250px] flex-col overflow-y-auto border-r border-line bg-[#fcfdf9] p-6 max-[800px]:hidden">
        {navigation}
      </aside>
      <dialog
        ref={menu}
        id="mobile-menu"
        aria-label="Menu navigasi"
        onClose={() => {
          setMenuOpen(false);
          if (window.matchMedia('(max-width: 800px)').matches) menuToggle.current?.focus();
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-[#fcfdf9] p-0 text-ink backdrop:bg-black/40 min-[801px]:hidden"
      >
        <div className="sticky top-0 z-10 flex h-[91px] items-center justify-between border-b border-line bg-[#fcfdf9] px-[22px] max-[560px]:h-[65px] max-[560px]:px-[18px]">
          <Link href="/" onClick={closeMenu} className="font-heading text-[28px] font-extrabold tracking-[-1.5px] text-ink">petik<span className="text-[#9bb878]">.</span></Link>
          <button type="button" onClick={closeMenu} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-[#3e6450] hover:bg-[#edf3e5] focus-visible:outline-2 focus-visible:outline-offset-2">Tutup <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        </div>
        <div className="px-[22px] pb-6 max-[560px]:px-[18px]">{navigation}</div>
      </dialog>
      <main
        id="content"
        className="app-main ml-[250px] max-w-[1700px] px-11 min-[1450px]:px-[65px] max-[1100px]:px-7 max-[800px]:ml-0 max-[800px]:px-[22px] max-[560px]:px-[18px]"
        tabIndex={-1}
      >
        <header className="flex h-[91px] items-center justify-between border-b border-line text-sm text-[#58675e] max-[560px]:h-[65px]">
          <Link href="/" className="max-[800px]:hidden">Ruang belajarmu</Link>
          <Link href="/" className="font-heading text-[28px] font-extrabold tracking-[-1.5px] text-ink min-[801px]:hidden">petik<span className="text-[#9bb878]">.</span></Link>
          <Link href="/setup" className="max-[800px]:hidden">Mic {audio.status === 'ready' ? 'aktif' : 'belum siap'}</Link>
          <button
            type="button"
            ref={menuToggle}
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 font-semibold text-[#3e6450] hover:bg-[#edf3e5] min-[801px]:hidden focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => {
              menu.current?.showModal();
              setMenuOpen(true);
            }}
          >
            Menu <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </header>
        {warning && <p className="notice my-4 bg-[#fff4da] p-4" role="status">{warning}</p>}
        {children}
        <footer className="mt-2 flex items-center justify-between border-t border-line py-6 text-xs text-[#58675e] max-[560px]:[&>span:nth-child(2)]:hidden">
          <span className="footer-brand font-heading text-xl font-extrabold tracking-[-1px] text-[#8e9e7d]">petik.</span>
          <span>Satu chord, satu langkah.</span>
        </footer>
      </main>
    </>
  );
}

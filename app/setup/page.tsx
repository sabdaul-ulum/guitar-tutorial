import Link from 'next/link';
import MicrophonePanel from '../../features/audio/components/MicrophonePanel.tsx';
export default function SetupPage() {
  return <>
    <section className="page-heading mt-10 mb-8 flex items-center justify-between [&_h1]:text-[clamp(1.5rem,3vw,2rem)] [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:leading-tight [&_p]:mt-[9px] [&_p]:text-xs max-[560px]:mt-[25px] max-[560px]:mb-[21px] max-[560px]:[&_p]:text-[11px]"><div><h1>Cek mikrofon</h1><p>Pastikan suara gitar masuk sebelum mulai belajar.</p></div></section>
    <div className="setup-grid grid grid-cols-2 gap-5 max-[800px]:grid-cols-1"><MicrophonePanel /><section className="content-card mb-6 min-w-0 rounded-2xl border border-line bg-white p-6 [&_p]:my-3 [&_p]:text-[13px] [&_p]:leading-[1.7] [&_li]:my-3 [&_li]:text-[13px] [&_li]:leading-[1.7] [&_ol]:pl-5"><h2>Siapkan suara gitar</h2><ol>
      <li>Pilih mikrofon atau audio interface yang digunakan, lalu tekan Hubungkan mikrofon.</li>
      <li>Diam selama kalibrasi. Setelah siap, petik satu senar dan lihat apakah meter suara bergerak.</li>
      <li>Untuk gitar akustik, arahkan mikrofon ke gitar dengan jarak sekitar 20–40 cm. Pilih tempat yang tenang.</li>
      <li>Untuk gitar listrik, gunakan audio interface atau amplifier dengan suara bersih, tanpa efek.</li>
    </ol><details><summary>Suara belum masuk atau terlalu pelan?</summary><p>Periksa input dan volume mikrofon di pengaturan perangkat. Pada Mac, gunakan Mic Mode Standard, bukan Voice Isolation. Setelah mengubah input, hubungkan ulang dan diam selama kalibrasi.</p><p>Coba penguatan otomatis bila perlu. Hindari volume terlalu tinggi hingga indikator clipping menyala.</p></details><p>Meter bergerak berarti suara masuk. Selanjutnya, cek tuning sebelum latihan chord.</p><Link className="primary inline-flex items-center justify-center gap-[27px] min-h-11 rounded-xl border border-[#385c45] bg-[#385c45] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294a34] motion-safe:hover:-translate-y-px" href="/tuner">Cek tuning gitar →</Link></section></div>
  </>;
}

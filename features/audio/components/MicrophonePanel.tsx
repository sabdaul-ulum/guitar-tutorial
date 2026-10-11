'use client';

import { useAudio } from './AudioProvider.tsx';
import { meterLevel, toDb, describePitch } from '../lib/audio-levels.ts';
export default function MicrophonePanel() {
  const {
    audio,
    devices,
    deviceId,
    autoGainControl,
    error,
    connect,
    disconnect,
    refreshDevices,
    selectDevice,
    selectGain
  } = useAudio();
  const busy = audio.status === 'connecting' || audio.status === 'calibrating';
  const pitch = describePitch(audio.frequency);
  return <section className="mic-panel mb-6 min-w-0 rounded-2xl border border-line bg-white p-6 [&_p]:my-3 [&_p]:text-[13px] [&_p]:leading-[1.7] [&_li]:my-3 [&_li]:text-[13px] [&_li]:leading-[1.7] [&_ol]:pl-5 [&_label]:my-3 [&_label]:block [&_label]:text-[13px] [&_select]:mt-2 [&_select]:block [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-line [&_select]:bg-white [&_select]:p-2.5" aria-label="Pengaturan mikrofon">
    <h2>Input audio</h2>
    <label>Perangkat mikrofon<select value={deviceId} onChange={event => selectDevice(event.target.value)} disabled={busy}>
      <option value="">Default sistem</option>
      {devices.filter(device => device.deviceId && device.deviceId !== 'default').map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Input ${index + 1}`}</option>)}
    </select></label>
    <button className="text-button min-h-11 rounded-lg border-0 bg-transparent px-2 py-2.5 text-sm text-[#58675e] hover:bg-[#f1f5ef]" onClick={refreshDevices}>Muat ulang daftar perangkat</button>
    <label className="checkbox-label"><input type="checkbox" checked={autoGainControl} disabled={busy} onChange={event => selectGain(event.target.checked)} /> Penguatan otomatis (AGC)</label>
    <p>Jika mic internal terlalu pelan, coba AGC. Jangan aktifkan noise suppression / voice isolation di pengaturan sistem; fitur tersebut dapat membuang suara gitar.</p>
    <div className="game-controls flex flex-wrap items-center gap-2.5 max-[1100px]:gap-[5px] [&_.primary]:px-[13px] [&_.primary]:py-[9px] [&_.primary]:text-sm"><button className="primary inline-flex items-center justify-center gap-[27px] min-h-11 rounded-xl border border-[#385c45] bg-[#385c45] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294a34] motion-safe:hover:-translate-y-px" disabled={busy} onClick={connect}>
      {busy ? 'Menyiapkan…' : audio.status === 'ready' ? 'Kalibrasi ulang' : 'Hubungkan mikrofon'}
    </button><button className="secondary min-h-11 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-[#3e6450] hover:bg-[#edf3e5]" disabled={audio.status === 'off'} onClick={disconnect}>Matikan</button></div>
    <p role="status">{audio.status === 'suspended' ? 'Audio dijeda browser. Tekan Hubungkan mikrofon untuk memulihkan dan kalibrasi ulang.' : audio.status === 'calibrating' ? 'Diam 2 detik, jangan mainkan gitar.' : audio.status === 'ready' ? `Aktif: ${audio.label || 'mikrofon'}` : 'Mikrofon belum aktif.'}</p>
    <meter min="0" max="100" value={meterLevel(audio.rms)} aria-label="Level input mikrofon dBFS" />
    <div className="meter-scale flex justify-between text-[10px]"><span>−80 dB</span><strong>{toDb(audio.rms).toFixed(1)} dBFS</strong><span>0 dB</span></div>
    {audio.status === 'ready' && <>
      <p>{audio.clipping ? '⚠ Input clipping: kurangi level input / jauhkan gitar.' : audio.noisy ? '⚠ Noise tinggi: pindah ke tempat tenang dan kalibrasi ulang.' : audio.audible ? 'Sinyal melewati noise floor.' : 'Sinyal di bawah ambang. Dekatkan gitar atau periksa input.'}</p>
      <p>Nada: {pitch ? `${pitch.name}, ${audio.frequency.toFixed(1)} Hz, kejernihan ${Math.round(audio.clarity * 100)}%` : 'belum stabil'}</p>
      <details><summary>Diagnostik perangkat</summary><p>Noise: {audio.noiseDb?.toFixed(1)} dBFS · ambang: {audio.thresholdDb?.toFixed(1)} dBFS<br />Sample rate: {audio.settings?.sampleRate || 'tidak dilaporkan'} Hz<br />AGC: {String(audio.settings?.autoGainControl ?? 'tidak dilaporkan')} · noise suppression: {String(audio.settings?.noiseSuppression ?? 'tidak dilaporkan')}</p></details>
    </>}
    {error && <p className="notice bg-[#fff4da] p-4" role="alert">{error}</p>}
    <p className="privacy text-xs! leading-relaxed">Audio lokal, tidak direkam/diunggah. Level meter bukan penilaian chord.</p>
  </section>;
}

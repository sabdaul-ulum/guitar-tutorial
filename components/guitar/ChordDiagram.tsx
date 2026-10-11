import { CHORDS } from '../../features/learning/domain/curriculum.ts';
export default function ChordDiagram({
  chord
}: { chord: import('../../features/learning/domain/curriculum.ts').ChordName }) {
  return <svg viewBox="0 0 150 130" role="img" aria-label={`Diagram chord ${chord}; urutan senar E A D G B e. Fret: ${CHORDS[chord].frets.map(fret => fret < 0 ? 'jangan dimainkan' : fret === 0 ? 'terbuka' : fret).join(', ')}. ${CHORDS[chord].tip}`}>
      {[0, 1, 2, 3, 4].map(fret => <path key={fret} d={`M25 ${30 + fret * 20}H125`} stroke="#b0bda4" strokeWidth={fret ? 1 : 4} />)}
      {CHORDS[chord].frets.map((fret, index) => {
      const x = 25 + index * 20;
      return <g key={index}>
          <path d={`M${x} 30V110`} stroke="#a9b79c" />
          <text x={x} y="125" textAnchor="middle" fontSize="9" fill="#6b805d">{['E', 'A', 'D', 'G', 'B', 'e'][index]}</text>
          {fret > 0 ? <circle cx={x} cy={20 + fret * 20} r="7" fill="#587b43" /> : <text x={x} y="20" textAnchor="middle" fontSize="13" fill="#6b805d">{fret === 0 ? '○' : '×'}</text>}
        </g>;
    })}
      {(chord === 'F' || chord === 'Bm') && <path d={`M${chord === 'F' ? 25 : 45} ${chord === 'F' ? 40 : 60}H125`} stroke="#587b43" strokeWidth="12" strokeLinecap="round" />}
    </svg>;
}

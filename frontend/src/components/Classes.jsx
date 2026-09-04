import { Clock } from 'lucide-react';
import SectionTitle from './SectionTitle';
import { DAY_COLORS, TIMETABLE, TT_ORDER } from '../data/schoolData';
export default function Classes({grade,setGrade}){
  return <>
    <SectionTitle eyebrow="Weekly timetable" title="Classes & timings" />
    <p className="lead">Select a grade to view the current weekly class schedule.</p>
    <div className="segments">{TT_ORDER.map(g=><button key={g} className={g===grade?'active':''} onClick={()=>setGrade(g)}>{g}</button>)}</div>
    <div className="classList">{TIMETABLE[grade].map((row,i)=><div className="card classRow" key={i}><div><h3>{row[0]}</h3><p>{row[1]}</p></div><div className="classTime"><b style={{background:DAY_COLORS[row[2]]}}>{row[2]}</b><span><Clock size={13}/>{row[3]}</span></div></div>)}</div>
  </>;
}

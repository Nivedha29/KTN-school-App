import SectionTitle from './SectionTitle';
import { ASSETS, TEACHERS } from '../data/schoolData';
export default function Teachers(){return <><SectionTitle eyebrow="Our teachers" title="28 volunteers, one family"/><p className="lead">Every KTN teacher is a volunteer who gives their time so children can learn for free.</p><div className="teacherGrid">{TEACHERS.map(t=><article className="card teacher" key={t.name}><img src={ASSETS.photos[t.key]} alt={t.name}/><h3>{t.name}</h3><p>{t.role}</p><small>Since {t.joined}</small></article>)}</div></>}

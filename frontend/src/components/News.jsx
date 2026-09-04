import { Plus, Pin, Trash2 } from 'lucide-react';
import { useState } from 'react';
import SectionTitle from './SectionTitle';
export default function News({news,setNews,staff}){
 const [open,setOpen]=useState(false); const [title,setTitle]=useState(''); const [body,setBody]=useState('');
 const publish=()=>{if(!title.trim())return;setNews([{id:'n'+Date.now(),title:title.trim(),body:body.trim(),date:new Date().toISOString().slice(0,10),pinned:false},...news]);setTitle('');setBody('');setOpen(false)};
 const sorted=[...news].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.date.localeCompare(a.date));
 return <><div className="titleAction"><SectionTitle eyebrow="News & announcements" title="What's happening"/>{staff&&<button className="primary small" onClick={()=>setOpen(!open)}><Plus size={16}/>Post</button>}</div>{staff&&open&&<div className="card formCard"><h3>New announcement</h3><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"/><textarea rows="3" value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your message…"/><button className="primary full" onClick={publish}>Publish announcement</button></div>}<div className="newsList">{sorted.map(n=><article className="card newsCard" key={n.id}><div className="newsMeta">{n.pinned&&<span className="pin"><Pin size={13}/>Pinned</span>}<span>{n.date}</span>{staff&&<button className="iconBtn danger" onClick={()=>setNews(news.filter(x=>x.id!==n.id))}><Trash2 size={16}/></button>}</div><h3>{n.title}</h3><p>{n.body}</p></article>)}</div></>;
}

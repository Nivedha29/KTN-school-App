import { CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';
import SectionTitle from './SectionTitle';
const initial={student:'',grade:'Grade 1',parent:'',phone:'',email:'',location:'',message:''};
export default function Apply({onSubmit}){
 const [form,setForm]=useState(initial),[done,setDone]=useState(false),[error,setError]=useState('');
 const update=e=>setForm({...form,[e.target.name]:e.target.value});
 const submit=e=>{e.preventDefault();if(!form.student.trim()||!form.parent.trim()||(!form.phone.trim()&&!form.email.trim())){setError('Please fill in the student name, parent name, and at least a phone or email.');return;}onSubmit({...form,id:'a'+Date.now(),date:new Date().toISOString()});setDone(true)};
 if(done)return <div className="success"><CheckCircle2 size={64}/><h2>Request received</h2><p>Thank you! Our team will reach out about {form.student}'s admission. Remember — KTN is completely free.</p><button className="primary" onClick={()=>{setForm(initial);setDone(false)}}>Submit another request</button></div>;
 return <><SectionTitle eyebrow="Admissions" title="Request a place — it's free"/><p className="lead">Fill in the form and our volunteer team will contact you. Fields marked * are required.</p><form className="card formCard" onSubmit={submit}>
  <label>Student's full name *<input name="student" value={form.student} onChange={update} placeholder="e.g. Aarav Kumar"/></label>
  <label>Grade applying for *<select name="grade" value={form.grade} onChange={update}>{[1,2,3,4,5,6,7].map(n=><option key={n}>Grade {n}</option>)}</select></label>
  <label>Parent / guardian name *<input name="parent" value={form.parent} onChange={update} placeholder="Your name"/></label>
  <label>Phone<input name="phone" value={form.phone} onChange={update} placeholder="+82 10-0000-0000"/></label>
  <label>Email<input name="email" value={form.email} onChange={update} placeholder="you@email.com"/></label>
  <label>City / country<input name="location" value={form.location} onChange={update} placeholder="e.g. Seoul, South Korea"/></label>
  <label>Anything you'd like us to know?<textarea name="message" rows="3" value={form.message} onChange={update} placeholder="Optional"/></label>
  {error&&<div className="error">{error}</div>}<p className="privacy">By submitting, you agree we may contact you about admission.</p><button className="primary full"><Send size={16}/>Send request</button>
 </form></>;
}

import React, { useEffect, useId, useRef, useState } from 'react';
import api from '../../api';
export default function OpenAIWidget() {
  const id=useId();
  const [prompt,setPrompt]=useState('');
  const [answer,setAnswer]=useState(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [configured,setConfigured]=useState(null);
  const live=useRef(true);
  useEffect(()=>{
    live.current=true;
    api('/ai/status').then(data=>{if(live.current)setConfigured(data.configured);}).catch(err=>{if(live.current)setError(err.message);});
    return ()=>{live.current=false;};
  },[]);
  async function submit(event) {
    event.preventDefault();if(busy||!prompt.trim())return;
    setBusy(true);setError('');setAnswer(null);
    try {const result=await api('/ai/ask',{method:'POST',body:{prompt:prompt.trim()},timeoutMs:65000});if(live.current)setAnswer(result);}
    catch(err){if(live.current)setError(err.message);}
    finally{if(live.current)setBusy(false);}
  }
  return <div className="openai-widget">
    <p className="field-hint">Posez une question à l’IA sans quitter Lumi. Chaque demande est indépendante.</p>
    {configured===false&&<p role="status">OpenAI n’est pas encore configuré sur le serveur. Ajoutez la clé API dans le fichier .env puis redémarrez le backend.</p>}
    <form onSubmit={submit}>
      <label htmlFor={`${id}-prompt`}>Votre demande</label>
      <textarea id={`${id}-prompt`} value={prompt} onChange={event=>setPrompt(event.target.value)} maxLength={8000} rows={4} required disabled={busy} placeholder="Explique-moi un concept, aide-moi à rédiger un texte…" />
      <small>Le texte envoyé est transmis à OpenAI. Les échanges restent dans cette session du widget.</small>
      <button className="button button-dark" disabled={busy||configured!==true||!prompt.trim()}>{busy?'Réponse en cours…':'Envoyer la demande'}</button>
    </form>
    {busy&&<p role="status">OpenAI prépare la réponse…</p>}
    {error&&<p role="alert" className="feedback error">{error}</p>}
    {answer&&<section aria-label="Réponse OpenAI"><h4>Réponse</h4><div className="openai-answer">{answer.text}</div>{answer.incomplete&&<p>La réponse a atteint sa limite de longueur.</p>}<button className="text-button" onClick={()=>{setAnswer(null);setPrompt('');}}>Effacer l’échange</button></section>}
  </div>;
}

import React, { useEffect, useId, useRef, useState } from 'react';
import api from '../../api';
// Keep the historical component path and widget ID for existing dashboards.
export default function OpenAIWidget() {
  const id=useId();
  const [prompt,setPrompt]=useState('');
  const [answer,setAnswer]=useState(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState(null);
  const [checking,setChecking]=useState(false);
  const live=useRef(true);
  async function checkStatus() {
    setChecking(true);setError('');
    try {const data=await api('/ai/status');if(live.current)setStatus(data);}
    catch(err){if(live.current){setStatus(null);setError(err.message);}}
    finally{if(live.current)setChecking(false);}
  }
  useEffect(()=>{
    live.current=true;checkStatus();
    return ()=>{live.current=false;};
  },[]);
  async function submit(event) {
    event.preventDefault();if(busy||!status?.configured||!prompt.trim())return;
    setBusy(true);setError('');setAnswer(null);
    try {const result=await api('/ai/ask',{method:'POST',body:{prompt:prompt.trim()},timeoutMs:310000});if(live.current)setAnswer(result);}
    catch(err){if(live.current)setError(err.message);}
    finally{if(live.current)setBusy(false);}
  }
  return <div className="openai-widget">
    <p className="field-hint">Posez une question générale à l’IA. Chaque demande est indépendante ; l’assistant ne consulte pas de données en direct.</p>
    <p role="status">{checking?'Vérification du modèle local…':status?.configured?`Modèle local : ${status.model || 'Ollama'}.`:status?.message || 'L’assistant local n’est pas disponible.'}</p>
    {!status?.configured&&<button className="text-button" disabled={checking} onClick={checkStatus}>Vérifier le modèle</button>}
    <form onSubmit={submit}>
      <label htmlFor={`${id}-prompt`}>Votre demande</label>
      <textarea id={`${id}-prompt`} value={prompt} onChange={event=>setPrompt(event.target.value)} maxLength={8000} rows={4} required disabled={busy} placeholder="Explique-moi un concept, aide-moi à rédiger un texte…" />
      <small>Les réponses peuvent contenir des erreurs. Vérifiez les informations importantes.</small>
      <small>Votre question est traitée sur le serveur Lumi par Ollama, sans compte externe. L’échange reste dans cette session du widget.</small>
      <button className="button button-dark" disabled={busy||!status?.configured||!prompt.trim()}>{busy?'Réponse en cours…':'Envoyer la demande'}</button>
    </form>
    {busy&&<p role="status">Le modèle local prépare la réponse… Le premier envoi peut être plus lent.</p>}
    {error&&<p role="alert" className="feedback error">{error}</p>}
    {answer&&<section aria-label="Réponse de l’assistant IA"><h4>Réponse</h4><div className="openai-answer">{answer.text}</div>{answer.incomplete&&<p>La réponse a atteint sa limite de longueur.</p>}<button className="text-button" onClick={()=>{setAnswer(null);setPrompt('');}}>Effacer l’échange</button></section>}
  </div>;
}

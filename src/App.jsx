import React, { useState, useEffect } from 'react'
import { Sparkles, FileText, WandSparkles, Download, Check, ArrowRight, Menu, X, ChevronDown, LayoutTemplate, Search, Palette, BriefcaseBusiness, GraduationCap, UserRound, Plus, Trash2, Globe, LockKeyhole, CreditCard, BarChart3, Bot, Copy, Mail, Settings, Bell } from 'lucide-react'
import { supabase, isSupabaseConfigured } from './supabase'
import { templateData, industries } from './templateData'
import { getAiCareerAdvice, createCoverLetter } from './ai'
import { demoAdminStats, demoUsers } from './adminData'
import Footer from './Footer.jsx'
import { documentCollections } from './documentTemplates'
import { CvPage, LetterPage, JobPage, StagePage, AdminPage } from './SeparatedPages'

const templates = [
  { name:'Azur', style:'classic', color:'#1266D6', tag:'Populaire' },
  { name:'Élégance', style:'elegant', color:'#071B35', tag:'Professionnel' },
  { name:'Créatif', style:'creative', color:'#56B4FF', tag:'Modern' },
]

const initialCv = {
  name:'Maya Kouamé', title:'Chef de projet digital', email:'maya.kouame@email.com', phone:'+225 07 12 34 56 78', city:'Abidjan, Côte d’Ivoire',
  summary:'Chef de projet digital avec 5 ans d’expérience dans la conception et le pilotage de projets web à fort impact. J’allie vision stratégique, écoute client et rigueur opérationnelle pour livrer des solutions utiles et performantes.',
  experience:[{role:'Chef de projet digital', company:'StartApp · 2023 - Aujourd’hui', detail:'Pilotage de 8 projets digitaux, coordination d’une équipe de 12 personnes et amélioration de 32 % de la satisfaction client.'},{role:'Responsable marketing', company:'Nova Studio · 2020 - 2023', detail:'Développement des campagnes multicanales et augmentation de 45 % du taux de conversion.'}],
  education:[{degree:'Master Management Digital', school:'Université Internationale · 2018 - 2020'}],
  skills:['Gestion de projet','Notion','Agile','Marketing digital','Analyse de données']
}

function Logo({light=false}) { return <div className="brand"><img src="/logo.jpeg" alt="CVORA"/><span>CVORA</span></div> }

function Header({page,setPage}) {
 const [open,setOpen]=useState(false)
 const go=(p)=>{setPage(p);setOpen(false);window.scrollTo(0,0)}
 return <header className="header"><div className="nav-wrap"><button className="logo-btn" onClick={()=>go('home')}><Logo/></button>
  <nav className={open?'nav open':'nav'}>
   <button onClick={()=>go('cvs')}>Modèles de CV</button><button onClick={()=>go('letter')}>Lettres de motivation</button><button onClick={()=>go('jobs')}>Demandes d’emploi</button><button onClick={()=>go('stages')}>Demandes de stage</button><button onClick={()=>go('pricing')}>Tarifs</button><button onClick={()=>go('admin')}>Administration</button>
  </nav>
  <div className="nav-actions"><button className="text-btn" onClick={()=>go('auth')}>Se connecter</button><button className="primary-btn small" onClick={()=>go('auth')}>S’inscrire <ArrowRight size={16}/></button></div>
  <button className="menu-btn" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></header>
}

function Home({setPage}) {
 return <>
  <main className="hero"><div className="hero-bg"></div><div className="hero-grid container">
   <div className="hero-copy"><div className="eyebrow"><Sparkles size={16}/> Simple. Moderne. Professionnel.</div><h1>Créez un CV qui vous ouvre les bonnes portes.</h1><p>Choisissez un modèle, renseignez vos expériences et obtenez un CV élégant prêt à être envoyé — en quelques minutes.</p><div className="hero-actions"><button className="primary-btn large" onClick={()=>setPage('editor')}>Créer mon CV gratuitement <ArrowRight size={18}/></button><button className="play-btn" onClick={()=>setPage('templates')}><LayoutTemplate size={18}/> Voir les modèles</button></div><div className="home-auth-actions"><button onClick={()=>setPage('auth')}>Se connecter</button><button onClick={()=>setPage('auth')}>S’inscrire gratuitement</button></div></div>
   <div className="hero-visual"><div className="float-card card-ats"><div className="score-ring">92</div><div><b>Score ATS</b><small>Excellent</small></div></div><div className="resume-preview"><div className="resume-side"><div className="avatar">MK</div><b>CONTACT</b><i></i><i></i><i></i><b>COMPÉTENCES</b><i></i><i></i><i></i></div><div className="resume-main"><h3>MAYA KOUMÉ</h3><h5>CHEF DE PROJET DIGITAL</h5><b>PROFIL</b><p>Chef de projet digital orientée résultats...</p><b>EXPÉRIENCE</b><strong>Chef de projet digital</strong><em>StartApp · 2023 - Aujourd’hui</em><p>Pilotage de projets digitaux à fort impact.</p><strong>Responsable marketing</strong><em>Nova Studio · 2020 - 2023</em></div></div><div className="float-card card-success"><div className="check-icon"><Check/></div><div><b>CV prêt à l’emploi</b><small>Format professionnel</small></div></div></div>
  </div></main>
  <section className="steps container"><div className="section-heading"><span>COMMENT ÇA MARCHE</span><h2>Votre nouveau CV en 3 étapes</h2></div><div className="step-grid">{[{n:'1',i:<LayoutTemplate/>,t:'Choisissez un modèle',d:'Sélectionnez un design moderne adapté à votre secteur.'},{n:'2',i:<UserRound/>,t:'Renseignez vos infos',d:'Complétez simplement vos expériences et compétences.'},{n:'3',i:<Download/>,t:'Téléchargez votre CV',d:'Exportez un PDF propre, lisible et prêt à envoyer.'}].map(x=><div className="step" key={x.n}><div className="step-icon">{x.i}<span>{x.n}</span></div><h3>{x.t}</h3><p>{x.d}</p></div>)}</div></section>
  <section className="feature-band"><div className="container feature-grid"><div><span className="mini-label">CVORA INTELLIGENT</span><h2>Plus qu’un éditeur, un véritable assistant de carrière.</h2><p>Profitez d’une rédaction assistée et d’outils simples pour rendre votre candidature plus convaincante.</p></div><div className="feature-cards"><div><WandSparkles/><b>Amélioration IA</b><p>Des formulations claires et professionnelles.</p></div><div><BarChart3/><b>Analyse ATS</b><p>Évaluez la lisibilité de votre CV.</p></div></div></div></section>
 </>
}

function Templates({setPage,setTemplate}) {
 const [category,setCategory]=useState('Tous')
 const [collection,setCollection]=useState('cv')
 const [search,setSearch]=useState('')
 const filtered=templateData.filter(t=>(category==='Tous'||t.category===category)&&(`${t.name} ${t.category}`.toLowerCase().includes(search.toLowerCase())))
 const documentList=collection==='cv'?[]:documentCollections[collection]
 const documentPrice=collection==='lettre'?1000:500
 const documentLabel=collection==='lettre'?'Lettres de motivation':collection==='emploi'?"Demandes d’emploi":"Demandes de stage"

 return (
  <main className="page models-page">
   <div className="models-topbar"><button className="back-btn" onClick={()=>setPage('home')}><ArrowRight size={17}/> Retour à l’accueil</button></div>
   <div className="container">
    <div className="page-heading"><span>COLLECTION CVORA 2026</span><h1>Choisissez le modèle adapté à votre objectif</h1><p>Plus de 90 modèles personnalisables pour accompagner chaque candidature.</p></div>
    <div className="model-categories">
     <button className={collection==='cv'?'active':''} onClick={()=>setCollection('cv')}><LayoutTemplate/><b>CV</b><span>30 modèles</span></button>
     <button className={collection==='lettre'?'active':''} onClick={()=>setCollection('lettre')}><Mail/><b>Lettre de motivation</b><span>20 modèles · 1 000 FCFA</span></button>
     <button className={collection==='emploi'?'active':''} onClick={()=>setCollection('emploi')}><BriefcaseBusiness/><b>Demande d’emploi</b><span>20 modèles · 500 FCFA</span></button>
     <button className={collection==='stage'?'active':''} onClick={()=>setCollection('stage')}><GraduationCap/><b>Demande de stage</b><span>20 modèles · 500 FCFA</span></button>
    </div>
    <div className="model-tools">
     <label className="model-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Rechercher dans ${collection==='cv'?'les CV':documentLabel.toLowerCase()}`}/></label>
     {collection==='cv'&&<div className="industry-tabs">{industries.map(x=><button key={x} className={category===x?'active':''} onClick={()=>setCategory(x)}>{x}</button>)}</div>}
    </div>

    {collection==='cv' ? (
     <div className="template-grid">
      {filtered.map((t,i)=><article className="template-card" key={t.id}>
       <div className={`template-preview layout-${t.layout}`} style={{'--accent':t.color}}>
        <aside className="mini-sidebar"><div className="mini-avatar">MK</div><b>CONTACT</b><small>maya@email.com</small><small>+225 07 12 34 56 78</small><b>COMPÉTENCES</b><span>Gestion de projet</span><span>Marketing digital</span><b>LANGUES</b><span>Français · Courant</span></aside>
        <div className="mini-content"><h4>MAYA KOUMÉ</h4><h6>CHEF DE PROJET DIGITAL</h6><section><b>PROFIL</b><p>Professionnelle orientée résultats avec une solide expérience en pilotage de projets.</p></section><section><b>EXPÉRIENCE</b><strong>Chef de projet digital</strong><small>StartApp · 2023 - Aujourd’hui</small><p>Coordination d’équipe et livraison de projets à forte valeur.</p></section></div>
        {i<5&&<div className="template-badge">{t.tag}</div>}
       </div>
       <div className="template-info"><div><h3>{t.name}</h3><span>{t.category} · ATS 2026</span></div><button className="outline-btn" onClick={()=>{setTemplate(t);setPage('editor')}}>Utiliser <ArrowRight size={15}/></button></div>
      </article>)}
     </div>
    ) : (
     <div className="document-template-grid">
      {documentList.filter(d=>d.name.toLowerCase().includes(search.toLowerCase())).map((d,i)=><article className="document-template" key={d.id} style={{'--doc-accent':d.accent}}>
       <div className="document-sheet">
        <div className="doc-sheet-head"><span>MK</span><b>MAYA KOUMÉ</b><small>{collection==='stage'?'Candidature de stage':collection==='emploi'?'Demande d’emploi':'Lettre de motivation'}</small></div>
        <div className="doc-sheet-body"><small>{d.subject}</small><h4>À l’attention du service des ressources humaines</h4><p>Madame, Monsieur,</p><p>Je vous adresse ma candidature avec motivation et tout l’intérêt que représente cette opportunité.</p><p>Mon parcours et mes compétences répondent aux exigences du poste.</p><b>Maya Kouamé</b></div>
       </div>
       <div className="document-template-info"><div><h3>{d.name}</h3><span>{documentLabel} · {i+1}/20</span></div><strong>{documentPrice.toLocaleString('fr-FR')} FCFA</strong><button className="outline-btn" onClick={()=>setPage('letter')}>Personnaliser <ArrowRight size={15}/></button></div>
      </article>)}
     </div>
    )}
   </div>
  </main>
 )
}
/* BROKEN_LEGACY_EDITOR_START
function Editor({template,setPage}) {
 const [cv,setCv]=useState(initialCv)
 const [step,setStep]=useState(1)
 const [aiLoading,setAiLoading]=useState(false)
 const [generated,setGenerated]=useState(false)
 const [email,setEmail]=useState('')
 const [saving,setSaving]=useState(false)
 const isReviewStep=step===3
 const isFinalStep=step===4
 const handleNext=()=>{setStep(s=>s+1);window.scrollTo(0,0)}
 const handleBack=()=>setStep(s=>s-1)
 const handleFinish=()=>{setSaving(true);supabase.from('users').upsert([{id:1,cv:JSON.stringify(cv),template:template.name}]).then(()=>setSaving(false))}
 const handleDownload=async()=>{setAiLoading(true);const res=await createCoverLetter(cv,template);setAiLoading(false);if(res){setGenerated(true);setEmail('')}}

 return <>
  <div className="editor-hero"><div className="container"><h1>Éditeur de CV</h1><p>Personnalisez chaque section de votre CV pour qu’il reflète au mieux votre parcours.</p></div></div>
  <div className="editor-steps container">
   <div className="editor-sidebar">
    <div className="sidebar-inner">
     <div className="sidebar-header"><h2>CVORA</h2><button className="close-btn" onClick={()=>setPage('templates')}><X/></button></div>
     <div className="sidebar-content"><div className="template-preview layout-editor" style={{'--accent':template.color}}>
      <div className="editor-avatar">MK</div>
      <div className="editor-info">
       <div className="editor-name">MAYA KOUMÉ</div>
       <div className="editor-contact"><Phone/>{initialCv.phone} <Mail/>{initialCv.email}</div>
      </div>
     </div>
     <div className="section-actions"><button className="primary-btn" onClick={handleNext}>Suivant <ArrowRight size={16}/></button></div>
     <div className="step-indicator"><div className="step" style={{'--active':step>1}}><div className="step-circle"></div><div className="step-label">Informations</div></div><div className="step" style={{'--active':step>2}}><div className="step-circle"></div><div className="step-label">Modèle</div></div><div className="step" style={{'--active':step>3}}><div className="step-circle"></div><div className="step-label">Aperçu</div></div></div>
    </div>
   </div>
   <div className="editor-main">
    {step===1&&<div className="section">
     <div className="section-header"><h2>Informations personnelles</h2></div>
     <div className="section-content">
      <label>Nom complet</label>
      <input type="text" value={cv.name} onChange={e=>setCv({...cv,name:e.target.value})} placeholder="Votre nom complet"/>
      <label>Titre professionnel</label>
      <input type="text" value={cv.title} onChange={e=>setCv({...cv,title:e.target.value})} placeholder="Votre titre ou poste"/>
      <label>Email</label>
      <input type="email" value={cv.email} onChange={e=>setCv({...cv,email:e.target.value})} placeholder="Votre adresse email"/>
      <label>Téléphone</label>
      <input type="tel" value={cv.phone} onChange={e=>setCv({...cv,phone:e.target.value})} placeholder="Votre numéro de téléphone"/>
      <label>Ville</label>
      <input type="text" value={cv.city} onChange={e=>setCv({...cv,city:e.target.value})} placeholder="Votre ville et pays"/>
     </div>
    </div>}
    {step===2&&<div className="section">
     <div className="section-header"><h2>Choisissez un modèle</h2></div>
     <div className="section-content">
      <div className="template-options">{templates.map(t=><div className={`template-option ${t.style}`} key={t.name} onClick={()=>setTemplate(t)} style={{'--accent':t.color}}>
       <div className="template-preview"><div className="avatar">MK</div>
       <div className="info">
        <div className="name">{t.name}</div>
        <div className="style">{t.style}</div>
       </div>
       </div>
       <div className="template-actions"><button className="primary-btn" onClick={()=>setTemplate(t)}>Sélectionner</button></div>
      </div>)}</div>
     </div>
    </div>}
    {step===3&&<div className="section review-section">
     <div className="section-header"><h2>Aperçu et téléchargement</h2></div>
     <div className="section-content">
      <div className="resume-preview"><div className="resume-side"><div className="avatar">MK</div><b>CONTACT</b><i></i><i></i><i></i><b>COMPÉTENCES</b><i></i><i></i><i></i></div><div className="resume-main"><h3>MAYA KOUMÉ</h3><h5>CHEF DE PROJET DIGITAL</h5><b>PROFIL</b><p>Chef de projet digital orientée résultats...</p><b>EXPÉRIENCE</b><strong>Chef de projet digital</strong><em>StartApp · 2023 - Aujourd’hui</em><p>Pilotage de projets digitaux à fort impact.</p><strong>Responsable marketing</strong><em>Nova Studio · 2020 - 2023</em></div></div><div className="float-card card-success"><div className="check-icon"><Check/></div><div><b>CV prêt à l’emploi</b><small>Format professionnel</small></div></div></div>
      <div className="actions"><button className="primary-btn" onClick={handleDownload}>{aiLoading?'Génération en cours...':'Télécharger le CV'} <ArrowRight size={16}/></button></div>
     </div>
    </div>}
   </div>
  </div>
  <Footer/>
 </>
}
BROKEN_LEGACY_EDITOR_END */

function Editor({template,setPage}) {
 const [cv,setCv]=useState(initialCv)
 const [tab,setTab]=useState('profile')
 const [paymentOpen,setPaymentOpen]=useState(false)
 const [method,setMethod]=useState('MTN Mobile Money')
 const [phone,setPhone]=useState('680409437')
 const accent=template?.color||'#1266D6'
 const download=async()=>{if(supabase){const {data}=await supabase.auth.getSession();if(!data.session){sessionStorage.setItem('cvora_pending','editor');setPage('auth');return}}setPaymentOpen(true)}
 return <main className="editor-page"><aside className="editor-sidebar"><button className="editor-back" onClick={()=>setPage('templates')}><ArrowRight size={16}/> Retour aux modèles</button><div className="editor-tabs"><button className={tab==='profile'?'active':''} onClick={()=>setTab('profile')}><UserRound/> Profil</button><button className={tab==='experience'?'active':''} onClick={()=>setTab('experience')}><BriefcaseBusiness/> Expérience</button><button className={tab==='design'?'active':''} onClick={()=>setTab('design')}><Palette/> Design</button></div><div className="form-area"><h3>{tab==='profile'?'Informations personnelles':tab==='experience'?'Expérience professionnelle':'Personnalisation'}</h3>{tab==='profile'&&<><label>Nom complet<input value={cv.name} onChange={e=>setCv({...cv,name:e.target.value})}/></label><label>Titre professionnel<input value={cv.title} onChange={e=>setCv({...cv,title:e.target.value})}/></label><label>E-mail<input value={cv.email} onChange={e=>setCv({...cv,email:e.target.value})}/></label><label>Téléphone<input value={cv.phone} onChange={e=>setCv({...cv,phone:e.target.value})}/></label><label>Profil<textarea rows="5" value={cv.summary} onChange={e=>setCv({...cv,summary:e.target.value})}/></label></>}{tab==='experience'&&cv.experience.map((x,i)=><div className="experience-form" key={i}><label>Poste<input value={x.role} onChange={e=>{const next=[...cv.experience];next[i]={...x,role:e.target.value};setCv({...cv,experience:next})}}/></label><label>Entreprise<input value={x.company} onChange={e=>{const next=[...cv.experience];next[i]={...x,company:e.target.value};setCv({...cv,experience:next})}}/></label></div>)}{tab==='design'&&<div className="colors">{['#1266D6','#071B35','#56B4FF','#C67A52','#2B9D78'].map(c=><button key={c} style={{background:c}} className={accent===c?'selected':''}/>)}</div>}</div></aside><section className="preview-workspace"><div className="preview-toolbar"><span>Aperçu en temps réel</span><button className="primary-btn small" onClick={download}><Download size={16}/> Télécharger PDF</button></div><div className="cv-sheet" style={{'--cv-accent':accent}}><aside><div className="cv-avatar">{cv.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div className="cv-block"><h4>CONTACT</h4><p>{cv.email}</p><p>{cv.phone}</p></div><div className="cv-block"><h4>COMPÉTENCES</h4>{cv.skills.map(s=><p key={s}>{s}</p>)}</div></aside><div className="cv-content"><h1>{cv.name}</h1><h2>{cv.title}</h2><section><h3>PROFIL</h3><p>{cv.summary}</p></section><section><h3>EXPÉRIENCE</h3>{cv.experience.map((x,i)=><div key={i}><h4>{x.role}</h4><b>{x.company}</b><p>{x.detail}</p></div>)}</section></div></div></section>{paymentOpen&&<div className="payment-overlay"><div className="payment-modal"><button className="modal-close" onClick={()=>setPaymentOpen(false)}>×</button><h2>Débloquer votre CV</h2><div className="payment-price">1 500 <small>FCFA</small></div><label>Moyen de paiement<select value={method} onChange={e=>setMethod(e.target.value)}><option>MTN Mobile Money</option><option>Orange Money</option></select></label><label>Numéro<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><button className="primary-btn" onClick={()=>{setPaymentOpen(false);window.print()}}>Payer 1 500 FCFA</button></div></div>}</main>
}

function Letter({setPage}){
 const [type,setType]=useState('Lettre de motivation')
 const [recipient,setRecipient]=useState('Monsieur le Directeur des Ressources Humaines')
 const [company,setCompany]=useState('StartApp')
 const [position,setPosition]=useState('Chef de projet digital')
 const [motivation,setMotivation]=useState('mon expérience, mon sens des responsabilités et ma disponibilité à contribuer efficacement aux objectifs de votre structure')
 const [paymentOpen,setPaymentOpen]=useState(false)
 const [method,setMethod]=useState('MTN Mobile Money')
 const [phone,setPhone]=useState('680409437')
 const price=type==='Lettre de motivation'?1000:500
 const download=async()=>{if(supabase){const {data}=await supabase.auth.getSession();if(!data.session){sessionStorage.setItem('cvora_pending','letter');setPage('auth');return}}setPaymentOpen(true)}
 const intro=type==='Demande de stage'?`Je sollicite respectueusement votre bienveillance afin d’effectuer un stage au sein de ${company}, dans le domaine ${position}.`:type==='Demande d’emploi'?`J’ai l’honneur de solliciter un emploi au poste de ${position} au sein de ${company}.`:`Je vous adresse ma candidature pour le poste de ${position} au sein de ${company}.`
 return <main className="letter-page container"><div className="page-heading"><span>DOCUMENTS PROFESSIONELS</span><h1>Rédigez une candidature au formalisme camerounais</h1><p>Structure nationale, formulation professionnelle et mise en page prête à imprimer.</p></div><div className="letter-grid"><div className="letter-form"><button className="editor-back" onClick={()=>setPage('templates')}><ArrowRight size={16}/> Retour aux modèles</button><label>Type de document<select value={type} onChange={e=>setType(e.target.value)}><option>Lettre de motivation</option><option>Demande d’emploi</option><option>Demande de stage</option></select></label><div className="document-price"><b>{price.toLocaleString('fr-FR')} FCFA</b><span>Paiement unique</span></div><label>Destinataire<input value={recipient} onChange={e=>setRecipient(e.target.value)}/></label><label>Entreprise ou organisation<input value={company} onChange={e=>setCompany(e.target.value)}/></label><label>Poste, métier ou domaine du stage<input value={position} onChange={e=>setPosition(e.target.value)}/></label><label>Motivations<textarea rows="5" value={motivation} onChange={e=>setMotivation(e.target.value)}/></label><button className="primary-btn" onClick={download}>Télécharger le document <Download size={16}/></button></div><div className="letter-preview"><p className="document-location">Yaoundé, le 19 novembre 2026</p><h3>MAYA KOUMÉ</h3><div className="document-adress"><span>Quartier Essos, Yaoundé</span><span>Tél. : +237 680 40 94 37</span><span>E-mail : maya.kouame@email.com</span></div><h4>À {recipient}<br/>{company}</h4><h4 className="document-object"><b>Objet :</b> {type} — {position}</h4><p>{recipient},</p><p>{intro}</p><p>Sérieusement motivée par cette opportunité, je souhaite mettre à votre disposition {motivation}. Dotée d’une grande rigueur, je suis convaincue de pouvoir apporter une contribution utile à vos activités.</p><p>{type==='Demande de stage'?'Cette période constituerait pour moi une expérience professionnelle formative et une occasion précieuse de mettre mes connaissances théoriques en pratique.':'Je suis disponible pour tout entretien à votre convenance afin de vous exposer plus en détail mon parcours et mes capacités.'}</p><p>Dans l’attente de votre retour, je vous prie d’agréer, Monsieur le Directeur, l’expression de ma haute considération.</p><p className="document-signature">Maya Kouamé</p></div></div>{paymentOpen&&<div className="payment-overlay"><div className="payment-modal"><button className="modal-close" onClick={()=>setPaymentOpen(false)}>×</button><h2>Débloquer le document</h2><div className="payment-price">{price.toLocaleString('fr-FR')} <small>FCFA</small></div><label>Moyen de paiement<select value={method} onChange={e=>setMethod(e.target.value)}><option>MTN Mobile Money</option><option>Orange Money</option></select></label><label>Numéro de paiement<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><button className="primary-btn" onClick={()=>{setPaymentOpen(false);window.print()}}>Payer {price.toLocaleString('fr-FR')} FCFA</button></div></div>}</main>
}

function Auth({setPage}){
 const [signup,setSignup]=useState(false)
 const [fullName,setFullName]=useState('')
 const [email,setEmail]=useState('')
 const [password,setPassword]=useState('')
 const [message,setMessage]=useState('')
 const submit=async()=>{
  if(!supabase){setMessage('Ajoutez les clés Supabase dans les variables d’environnement Vercel.');return}
  const result=signup?await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}}):await supabase.auth.signInWithPassword({email,password})
  if(result.error){setMessage(result.error.message);return}
  const pending=sessionStorage.getItem('cvora_pending')
  sessionStorage.removeItem('cvora_pending')
  setPage(pending==='letter'?'letter':pending==='editor'?'editor':'home')
 }
 const google=async()=>{if(!supabase){setMessage('Clés Supabase non configurées.');return}await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}})}
 return <main className="auth-page"><div className="auth-card"><Logo/><h1>{signup?'Créer votre compte':'Bienvenue sur CVORA'}</h1><p>{signup?'Créez votre compte pour télécharger vos documents.':'Authentifiez-vous avant de payer et télécharger.'}</p><button className="google-btn" onClick={google}><b>G</b> Continuer avec Google</button><div className="divider"><span>ou avec votre e-mail</span></div>{signup&&<label>Nom complet<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Votre nom"/></label>}<label>Adresse e-mail<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="nom@exemple.com"/></label><label>Mot de passe<input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="8 caractères minimum"/></label>{message&&<p className="auth-message">{message}</p>}<button className="primary-btn auth-submit" onClick={submit}>{signup?'Créer mon compte':'Se connecter'}</button><small>{signup?'Déjà inscrit ?':'Pas encore de compte ?'} <button onClick={()=>setSignup(!signup)}>{signup?'Se connecter':'Créer un compte'}</button></small></div></main>
}

function Pricing({setPage}){
 return <main className="pricing-page container">
  <div className="page-heading"><span>TARIFS CVORA</span><h1>Une offre adaptée à chaque étape de votre recherche</h1><p>Commencez gratuitement, puis payez uniquement les documents dont vous avez besoin.</p></div>
  <div className="pricing-grid">
   <article className="price-card"><h3>Basic</h3><p>Pour créer votre premier CV</p><div className="price">1 500 <small>FCFA</small></div><button className="outline-btn" onClick={()=>setPage('editor')}>Créer un CV</button><ul>{['1 modèle gratuit','Création et modification du CV','Export PDF','1 CV sauvegardé'].map(x=><li key={x}><Check/> {x}</li>)}</ul></article>
   <article className="price-card recommended"><div className="popular">RECOMMANDÉ</div><h3>Standard</h3><p>Pour découvrir plusieurs styles</p><div className="price">2 500 <small>FCFA</small></div><button className="primary-btn" onClick={()=>setPage('editor')}>Choisir Standard</button><ul>{['2 modèles professionnels','Création et modification du CV','Personnalisation de base','Export PDF','1 CV sauvegardé'].map(x=><li key={x}><Check/> {x}</li>)}</ul></article>
   <article className="price-card"><h3>CVORA PRO</h3><p>Pour toute votre carrière</p><div className="price">9 500 <small>FCFA / mois</small></div><button className="outline-btn" onClick={()=>setPage('auth')}>Passer à Pro</button><ul>{['Tous les modèles professionnels','Assistant IA avancé','Optimisation ATS','CV illimités','Lettres et demandes illimités'].map(x=><li key={x}><Check/> {x}</li>)}</ul></article>
  </div>
  <section className="document-pricing"><div className="section-heading"><span>ACHATS PONCTUELS</span><h2>Payez seulement votre document</h2></div><div className="document-price-grid"><article><span><FileText/></span><div><b>CV personnalisé</b><small>PDF professionnel</small></div><strong>1 500 FCFA</strong><button onClick={()=>setPage('editor')}>Choisir</button></article><article><span><Mail/></span><div><b>Lettre de motivation</b><small>Document personnalisé</small></div><strong>1 000 FCFA</strong><button onClick={()=>setPage('letter')}>Choisir</button></article><article><span><BriefcaseBusiness/></span><div><b>Demande d’emploi</b><small>Formalisme professionnel</small></div><strong>500 FCFA</strong><button onClick={()=>setPage('letter')}>Choisir</button></article><article><span><GraduationCap/></span><div><b>Demande de stage</b><small>Formalisme académique</small></div><strong>500 FCFA</strong><button onClick={()=>setPage('letter')}>Choisir</button></article></div></section>
 </main>
}

export default function App() {
 const [page,setPage]=useState('home')
 const [template,setTemplate]=useState(templateData[0])
 useEffect(()=>{window.scrollTo(0,0)},[page])
 const noShell=['editor','auth','admin'].includes(page)
 return <>{!noShell&&<Header page={page} setPage={setPage}/>} {page==='home'&&<Home setPage={setPage}/>} {page==='templates'&&<Templates setPage={setPage} setTemplate={setTemplate}/>} {page==='cvs'&&<CvPage setPage={setPage} setTemplate={setTemplate}/>} {page==='letter'&&<LetterPage setPage={setPage}/>} {page==='jobs'&&<JobPage setPage={setPage}/>} {page==='stages'&&<StagePage setPage={setPage}/>} {page==='pricing'&&<Pricing setPage={setPage}/>} {page==='admin'&&<AdminPage setPage={setPage}/>} {page==='editor'&&<Editor template={template} setPage={setPage}/>} {page==='auth'&&<Auth setPage={setPage}/>} {!noShell&&<Footer/>}</>
}
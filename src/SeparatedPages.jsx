import React, { useState } from 'react'
import { ArrowLeft, FileText, Mail, BriefcaseBusiness, GraduationCap, Search, Download, Check, ArrowRight, BarChart3, UserRound, CreditCard, LayoutTemplate, Settings } from 'lucide-react'
import { templateData, industries } from './templateData'
import { documentCollections } from './documentTemplates'
import { demoAdminStats, demoUsers } from './adminData'

const cvLogo = '/dossier.jpeg'

function BackButton({setPage}){return <button className="back-btn" onClick={()=>setPage('home')}><ArrowLeft size={17}/> Retour à l’accueil</button>}

function PriceModal({open,setOpen,amount,documentName,setPage}){
 const [method,setMethod]=useState('MTN Mobile Money')
 const [phone,setPhone]=useState('680409437')
 if(!open)return null
 return <div className="payment-overlay" role="dialog"><div className="payment-modal"><button className="modal-close" onClick={()=>setOpen(false)}>×</button><span className="payment-icon"><CreditCard/></span><h2>Débloquer {documentName}</h2><p>Authentification puis paiement sécurisé par Mobile Money.</p><div className="payment-price">{amount.toLocaleString('fr-FR')} <small>FCFA</small></div><label>Moyen de paiement<select value={method} onChange={e=>setMethod(e.target.value)}><option>MTN Mobile Money</option><option>Orange Money</option></select></label><label>Numéro de paiement<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><button className="primary-btn" onClick={()=>{setOpen(false);setPage('auth')}}>Se connecter & payer</button></div></div>
}

export function CvPage({setPage,setTemplate}){
 const [category,setCategory]=useState('Tous')
 const [search,setSearch]=useState('')
 const [open,setOpen]=useState(false)
 const [selected,setSelected]=useState(null)
 const filtered=templateData.filter(t=>(category==='Tous'||t.category===category)&&(`${t.name} ${t.category}`.toLowerCase().includes(search.toLowerCase())))
 const choose=t=>{setSelected(t);setOpen(true)}
 return <main className="separate-page cv-page"><div className="page-banner banner-cv"><div className="container"><BackButton setPage={setPage}/><span>MODÈLES DE CV</span><h1>30 CV professionnels 2026</h1><p>Des modèles modernes, lisibles par les recruteurs et compatibles avec les logiciels ATS.</p></div></div><div className="container separate-content"><div className="model-toolbar"><label><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un secteur ou un modèle"/></label><div className="industry-tabs">{industries.map(x=><button key={x} className={category===x?'active':''} onClick={()=>setCategory(x)}>{x}</button>)}</div></div><div className="template-grid">{filtered.map((t,i)=><article className="template-card" key={t.id}><div className={`template-preview layout-${t.layout}`} style={{'--accent':t.color}}><aside className="mini-sidebar"><div className="mini-avatar">MK</div><b>CONTACT</b><small>maya@email.com</small><small>+237 680 40 94 37</small><b>COMPÉTENCES</b><span>Gestion de projet</span><span>Analyse de données</span><b>LANGUES</b><span>Français · Anglais</span></aside><div className="mini-content"><h4>MAYA KOUMÉ</h4><h6>CHEF DE PROJET DIGITAL</h6><section><b>PROFIL</b><p>Professionnelle orientée résultats avec une solide expérience en pilotage de projets.</p></section><section><b>EXPÉRIENCE</b><strong>Chef de projet digital</strong><small>StartApp · 2023 - Aujourd’hui</small><p>Coordination d’équipe et livraison de projets à forte valeur.</p></section></div>{i<5&&<div className="template-badge">{t.tag}</div>}</div><div className="template-info"><div><h3>{t.name}</h3><span>{t.category} · ATS 2026</span></div><button className="outline-btn" onClick={()=>choose(t)}>Personnaliser <ArrowRight size={15}/></button></div></article>)}</div></div><PriceModal open={open} setOpen={setOpen} amount={1500} documentName="ce CV" setPage={setPage}/></main>
}

function DocumentPage({setPage,type}){
 const config={lettre:{title:'Lettre de motivation',subtitle:'20 modèles professionnels pour présenter votre motivation avec élégance.',price:1000,icon:<Mail/>,kind:'lettre',banner:'/fee.jpg'},emploi:{title:'Demande d’emploi',subtitle:'20 demandes d’emploi prêtes à personnaliser selon le poste recherché.',price:500,icon:<BriefcaseBusiness/>,kind:'emploi',banner:'/dossier.jpeg'},stage:{title:'Demande de stage',subtitle:'20 modèles académiques et professionnels adaptés aux offres de stage.',price:500,icon:<GraduationCap/>,kind:'stage',banner:'/img1.jpg'}}[type]
 const [search,setSearch]=useState('')
 const [open,setOpen]=useState(false)
 const [selected,setSelected]=useState(null)
 const list=documentCollections[config.kind].filter(d=>d.name.toLowerCase().includes(search.toLowerCase()))
 const choose=d=>{setSelected(d);setOpen(true)}
 return <main className="separate-page document-page"><div className="page-banner" style={{backgroundImage:`linear-gradient(120deg,rgba(7,27,53,.93),rgba(18,102,214,.72)),url('${config.banner}')`}}><div className="container"><BackButton setPage={setPage}/><div className="banner-icon">{config.icon}</div><span>{config.title.toUpperCase()}</span><h1>{config.subtitle}</h1><div className="banner-price">{config.price.toLocaleString('fr-FR')} FCFA <small>Paiement unique</small></div></div></div><div className="container separate-content"><div className="document-intro"><div><span>COLLECTION COMPLETÉE</span><h2>20 modèles {config.title.toLowerCase()}</h2></div><label><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un modèle"/></label></div><div className="document-template-grid">{list.map((d,i)=><article className="document-template" key={d.id} style={{'--doc-accent':d.accent}}><div className="document-sheet"><div className="doc-sheet-head"><span>MK</span><b>MAYA KOUMÉ</b><small>{config.title}</small></div><div className="doc-sheet-body"><small>{d.subject}</small><h4>À l’attention du service concerné</h4><p>Madame, Monsieur,</p><p>Je vous adresse cette {config.title.toLowerCase()} avec tout l’intérêt et la motivation que représente cette opportunité.</p><p>Dans l’attente de votre réponse, je vous prie d’agréer mes salutations distinguées.</p><b>Maya Kouamé</b></div></div><div className="document-template-info"><div><h3>{d.name}</h3><span>{config.title} · {i+1}/20</span></div><strong>{config.price} FCFA</strong><button className="outline-btn" onClick={()=>choose(d)}>Personnaliser <ArrowRight size={15}/></button></div></article>)}</div></div><PriceModal open={open} setOpen={setOpen} amount={config.price} documentName={config.title.toLowerCase()} setPage={setPage}/></main>
}

export function LetterPage({setPage}){return <DocumentPage setPage={setPage} type="lettre"/>}
export function JobPage({setPage}){return <DocumentPage setPage={setPage} type="emploi"/>}
export function StagePage({setPage}){return <DocumentPage setPage={setPage} type="stage"/>}

export function AdminPage({setPage}){
 const [stats,setStats]=useState(demoAdminStats)
 const [users,setUsers]=useState(demoUsers)
 return <main className="admin-page"><aside><div className="brand"><img src="/logo.jpeg" alt="CVORA"/><span>CVORA Admin</span></div><nav><button className="active"><BarChart3/> Vue générale</button><button><UserRound/> Utilisateurs</button><button><FileText/> Documents</button><button><CreditCard/> Paiements</button><button><Settings/> Paramètres</button></nav></aside><section><header><div><small>Centre de pilotage</small><h1>Tableau de bord administrateur</h1></div><div className="live-badge"><i/> Temps réel</div></header><div className="admin-stats"><div><small>Utilisateurs inscrits</small><b>{stats.users.toLocaleString('fr-FR')}</b><span>+12 aujourd’hui</span></div><div><small>En ligne maintenant</small><b>{stats.activeUsers}</b><span>Activité live</span></div><div><small>CV créés</small><b>{stats.cvsCreated}</b><span>+28 aujourd’hui</span></div><div><small>Revenus</small><b>{stats.revenue.toLocaleString('fr-FR')} FCFA</b><span>+{stats.conversion}%</span></div></div><div className="admin-grid"><article><h2>Utilisateurs récents</h2><div className="user-table"><div className="table-head"><b>Utilisateur</b><b>Plan</b><b>CV</b><b>Statut</b></div>{users.map((u,i)=><div className="table-row" key={i}><span><i>{u.name[0]}</i><p><b>{u.name}</b><small>{u.email}</small></p></span><b>{u.plan}</b><b>{u.cvs}</b><em className={u.status==='En ligne'?'online':''}>{u.status}</em></div>)}</div></article><article className="activity-card"><h2>Activité en direct</h2><div className="pulse"><span/><b>{stats.activeUsers}</b><small>utilisateurs actifs</small></div><div className="admin-progress"><b>Conversion</b><div><i style={{width:`${stats.conversion}%`}}/></div></div></article></div></section></main>
}

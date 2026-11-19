
/* ================= LOGO ================= */
const DEFAULT_LOGO = "data:image/svg+xml;base64," + btoa(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 210'>
<g fill='none' stroke-width='11' stroke-linecap='round'>
<path d='M60 18 C15 55 15 155 60 192' stroke='#1b3a8c'/><path d='M60 18 C40 30 28 40 22 55' stroke='#e2231a'/>
<path d='M240 18 C285 55 285 155 240 192' stroke='#1b3a8c'/><path d='M240 18 C260 30 272 40 278 55' stroke='#e2231a'/></g>
<text x='150' y='78' text-anchor='middle' font-family='Arial' font-weight='800' font-size='40' fill='#1b3a8c'>ACF</text>
<text x='150' y='120' text-anchor='middle' font-family='Arial' font-weight='800' font-size='40' fill='#1b3a8c'>CHAPPERT</text>
<text x='150' y='150' text-anchor='middle' font-family='Arial' font-weight='700' font-size='16' fill='#1b3a8c'>Froid - <tspan fill='#e2231a'>Climat</tspan>isation</text>
<text x='150' y='172' text-anchor='middle' font-family='Arial' font-weight='700' font-size='16' fill='#1b3a8c'>Ventilation - Chauffage</text>
<text x='150' y='194' text-anchor='middle' font-family='Arial' font-weight='700' font-size='16' fill='#e2231a'>Cuisines professionnelles</text></svg>`);

/* ================= BASE DE DONNÉES (localStorage) ================= */
const DBKEY = 'acf_devis_db_v1';
let db = load();
function load(){
  try{ const d = JSON.parse(localStorage.getItem(DBKEY)); if(d && d.clients && d.devis){ if(!d.commerciaux)d.commerciaux=[]; if(!d.products)d.products=[]; return d; } }catch(e){}
  return {seq:0, clients:[], commerciaux:[], products:[], devis:[], logo:DEFAULT_LOGO, lastComId:''};
}
function persist(){ try{ localStorage.setItem(DBKEY, JSON.stringify(db)); }catch(e){ alert('Sauvegarde impossible : espace saturé (photos trop lourdes). Réduisez la taille des photos.'); } }
const uid = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const eur = n => (isFinite(n)?n:0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const esc = s => (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* logo global */
let logoData = db.logo || DEFAULT_LOGO;
document.getElementById('logoImg').src = logoData;
function setLogo(e){ const f=e.target.files[0]; if(!f)return; const r=new FileReader();
  r.onload=ev=>{ logoData=ev.target.result; db.logo=logoData; document.getElementById('logoImg').src=logoData; persist(); }; r.readAsDataURL(f); }

/* ================= NAVIGATION ================= */
function showView(v){
  ['list','clients','produits','commerciaux','editor'].forEach(x=>document.getElementById('view-'+x).classList.toggle('active', x===v));
  document.getElementById('nav-list').classList.toggle('active', v==='list');
  document.getElementById('nav-clients').classList.toggle('active', v==='clients');
  document.getElementById('nav-produits').classList.toggle('active', v==='produits');
  document.getElementById('nav-commerciaux').classList.toggle('active', v==='commerciaux');
  if(v==='list') renderList();
  if(v==='clients') renderClients();
  if(v==='produits') renderProducts();
  if(v==='commerciaux') renderCommerciaux();
  window.scrollTo(0,0);
}

/* ================= CLIENTS ================= */
function clientName(c){
  if(!c) return '';
  return c.type==='pro' ? (c.societe||'(sans nom)') : [c.civ,c.nom,c.prenom].filter(Boolean).join(' ')||'(sans nom)';
}
function renderClients(){
  const q=(document.getElementById('searchClient').value||'').toLowerCase();
  const list=db.clients.filter(c=>clientName(c).toLowerCase().includes(q)||(c.ville||'').toLowerCase().includes(q));
  const wrap=document.getElementById('clientTableWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty">Aucun client. Cliquez sur « ＋ Nouveau client » pour en créer un.</div>'; return; }
  wrap.innerHTML='<table class="grid"><thead><tr><th>Nom</th><th>Type</th><th>Ville</th><th>Téléphone</th><th>Email</th><th></th></tr></thead><tbody>'+
    list.map(c=>`<tr>
      <td class="clic" onclick="openClientModal('${c.id}')"><b>${esc(clientName(c))}</b></td>
      <td><span class="tag ${c.type}">${c.type==='pro'?'Pro':'Particulier'}</span></td>
      <td>${esc(c.ville||'')}</td><td>${esc(c.tel||'')}</td><td>${esc(c.email||'')}</td>
      <td class="row-act"><button class="small" onclick="openClientModal('${c.id}')">✎</button>
        <button class="small rouge" onclick="deleteClient('${c.id}')">🗑</button></td></tr>`).join('')+'</tbody></table>';
}
let editingClientId=null;
function openClientModal(id){
  editingClientId = id||null;
  const c = id ? db.clients.find(x=>x.id===id) : null;
  document.getElementById('clientModalTitle').textContent = c ? 'Modifier le client' : 'Nouveau client';
  setClientType(c ? c.type : 'particulier');
  cVal('cCiv', c&&c.civ||'M.'); cVal('cNom', c&&c.nom||''); cVal('cPrenom', c&&c.prenom||'');
  cVal('cSociete', c&&c.societe||''); cVal('cSiret', c&&c.siret||''); cVal('cTvaIntra', c&&c.tvaIntra||''); cVal('cContact', c&&c.contact||'');
  cVal('cAdresse', c&&c.adresse||''); cVal('cCP', c&&c.cp||''); cVal('cVille', c&&c.ville||''); cVal('cTel', c&&c.tel||''); cVal('cEmail', c&&c.email||'');
  document.getElementById('clientModalBg').classList.add('open');
}
function cVal(id,v){ document.getElementById(id).value=v; }
function closeClientModal(){ document.getElementById('clientModalBg').classList.remove('open'); }
function setClientType(t){
  document.getElementById('clientModal').dataset.type=t;
  document.getElementById('segPart').classList.toggle('on', t==='particulier');
  document.getElementById('segPro').classList.toggle('on', t==='pro');
}
function saveClient(){
  const t=document.getElementById('clientModal').dataset.type;
  const c={ id: editingClientId||uid(), type:t,
    civ:document.getElementById('cCiv').value, nom:document.getElementById('cNom').value.trim(), prenom:document.getElementById('cPrenom').value.trim(),
    societe:document.getElementById('cSociete').value.trim(), siret:document.getElementById('cSiret').value.trim(),
    tvaIntra:document.getElementById('cTvaIntra').value.trim(), contact:document.getElementById('cContact').value.trim(),
    adresse:document.getElementById('cAdresse').value.trim(), cp:document.getElementById('cCP').value.trim(), ville:document.getElementById('cVille').value.trim(),
    tel:document.getElementById('cTel').value.trim(), email:document.getElementById('cEmail').value.trim() };
  if(!clientName(c)||clientName(c)==='(sans nom)'){ alert(t==='pro'?'Indiquez la raison sociale.':'Indiquez au moins le nom.'); return; }
  if(editingClientId){ const i=db.clients.findIndex(x=>x.id===editingClientId); db.clients[i]=c; }
  else db.clients.push(c);
  persist(); closeClientModal();
  if(document.getElementById('view-editor').classList.contains('active')){ fillClientSelect(c.id); onClientChange(); }
  if(document.getElementById('view-clients').classList.contains('active')) renderClients();
}
function deleteClient(id){
  if(!confirm('Supprimer ce client ?')) return;
  db.clients=db.clients.filter(c=>c.id!==id); persist(); renderClients();
}

/* ================= COMMERCIAUX ================= */
function renderCommerciaux(){
  const q=(document.getElementById('searchCom').value||'').toLowerCase();
  const list=db.commerciaux.filter(c=>(c.nom||'').toLowerCase().includes(q));
  const wrap=document.getElementById('comTableWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty">Aucun commercial. Cliquez sur « ＋ Nouveau commercial ».</div>'; return; }
  wrap.innerHTML='<table class="grid"><thead><tr><th>Nom</th><th>Fonction</th><th>Téléphone</th><th>Email</th><th></th></tr></thead><tbody>'+
    list.map(c=>`<tr>
      <td class="clic" onclick="openComModal('${c.id}')"><b>${esc(c.nom)}</b></td>
      <td>${esc(c.fonction||'')}</td><td>${esc(c.tel||'')}</td><td>${esc(c.mail||'')}</td>
      <td class="row-act"><button class="small" onclick="openComModal('${c.id}')">✎</button>
        <button class="small rouge" onclick="deleteCommercial('${c.id}')">🗑</button></td></tr>`).join('')+'</tbody></table>';
}
let editingComId=null;
function openComModal(id){
  editingComId=id||null; const c=id?db.commerciaux.find(x=>x.id===id):null;
  document.getElementById('comModalTitle').textContent=c?'Modifier le commercial':'Nouveau commercial';
  cVal('mcNom',c&&c.nom||''); cVal('mcTel',c&&c.tel||''); cVal('mcMail',c&&c.mail||''); cVal('mcFonction',c&&c.fonction||'');
  document.getElementById('comModalBg').classList.add('open');
}
function closeComModal(){ document.getElementById('comModalBg').classList.remove('open'); }
function saveCommercial(){
  const c={ id:editingComId||uid(), nom:document.getElementById('mcNom').value.trim(),
    tel:document.getElementById('mcTel').value.trim(), mail:document.getElementById('mcMail').value.trim(), fonction:document.getElementById('mcFonction').value.trim() };
  if(!c.nom){ alert('Indiquez le nom du commercial.'); return; }
  if(editingComId){ const i=db.commerciaux.findIndex(x=>x.id===editingComId); db.commerciaux[i]=c; } else db.commerciaux.push(c);
  persist(); closeComModal();
  if(document.getElementById('view-editor').classList.contains('active')){ fillComSelect(c.id); onComChange(); }
  if(document.getElementById('view-commerciaux').classList.contains('active')) renderCommerciaux();
}
function deleteCommercial(id){ if(!confirm('Supprimer ce commercial ?')) return; db.commerciaux=db.commerciaux.filter(c=>c.id!==id); persist(); renderCommerciaux(); }
function fillComSelect(sel){
  const s=document.getElementById('comSelect');
  s.innerHTML='<option value="">— Sélectionner un commercial —</option>'+
    db.commerciaux.slice().sort((a,b)=>a.nom.localeCompare(b.nom)).map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.nom)}</option>`).join('');
  document.getElementById('editComBtn').style.display=sel?'inline-flex':'none';
}
function onComChange(){ cur.commercialId=document.getElementById('comSelect').value; db.lastComId=cur.commercialId;
  document.getElementById('editComBtn').style.display=cur.commercialId?'inline-flex':'none'; renderComView(); scheduleSave(); }
function editSelectedCom(){ if(cur.commercialId) openComModal(cur.commercialId); }
function renderComView(){
  const c=db.commerciaux.find(x=>x.id===cur.commercialId); const el=document.getElementById('comView');
  if(!c){ el.innerHTML='<span style="color:var(--muted)">Aucun commercial sélectionné.</span>'; return; }
  const l=[`<span class="cname">${esc(c.nom)}</span>`];
  if(c.fonction) l.push(esc(c.fonction));
  const cont=[]; if(c.tel)cont.push('Tél. '+esc(c.tel)); if(c.mail)cont.push(esc(c.mail)); if(cont.length)l.push(cont.join(' · '));
  el.innerHTML=l.join('<br>');
}

/* ================= PRODUITS ================= */
function renderProducts(){
  const q=(document.getElementById('searchProd').value||'').toLowerCase();
  const list=db.products.filter(p=>(p.desc||'').toLowerCase().includes(q)||(p.ref||'').toLowerCase().includes(q));
  document.getElementById('prodInfo').textContent = db.products.length ? db.products.length+' produit(s) au catalogue.' : '';
  const wrap=document.getElementById('prodTableWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty">Aucun produit. Ajoutez-en un ou importez un fichier Excel/CSV.</div>'; return; }
  wrap.innerHTML='<table class="grid"><thead><tr><th>Désignation</th><th>Réf./Catégorie</th><th>Unité</th><th style="text-align:right">P.U. HT</th><th>TVA</th><th></th></tr></thead><tbody>'+
    list.map(p=>`<tr>
      <td class="clic" onclick="openProdModal('${p.id}')"><b>${esc(p.desc)}</b></td>
      <td>${esc(p.ref||'')}</td><td>${esc(p.unit||'')}</td>
      <td style="text-align:right" class="ttc-mono">${eur(+p.pu||0)}</td>
      <td>${(''+(p.tva!=null?p.tva:20)).replace('.',',')} %</td>
      <td class="row-act"><button class="small" onclick="openProdModal('${p.id}')">✎</button>
        <button class="small rouge" onclick="deleteProduct('${p.id}')">🗑</button></td></tr>`).join('')+'</tbody></table>';
}
let editingProdId=null;
function openProdModal(id){
  editingProdId=id||null; const p=id?db.products.find(x=>x.id===id):null;
  document.getElementById('prodModalTitle').textContent=p?'Modifier le produit':'Nouveau produit';
  cVal('mpDesc',p&&p.desc||''); cVal('mpUnit',p&&p.unit||'u'); cVal('mpPu',p&&p.pu!=null?p.pu:0);
  cVal('mpTva',p&&p.tva!=null?p.tva:20); cVal('mpRef',p&&p.ref||'');
  document.getElementById('prodModalBg').classList.add('open');
}
function closeProdModal(){ document.getElementById('prodModalBg').classList.remove('open'); }
function saveProduct(){
  const p={ id:editingProdId||uid(), desc:document.getElementById('mpDesc').value.trim(), unit:document.getElementById('mpUnit').value.trim()||'u',
    pu:parseFloat(document.getElementById('mpPu').value)||0, tva:parseFloat(document.getElementById('mpTva').value), ref:document.getElementById('mpRef').value.trim() };
  if(!p.desc){ alert('Indiquez la désignation.'); return; }
  if(editingProdId){ const i=db.products.findIndex(x=>x.id===editingProdId); db.products[i]=p; } else db.products.push(p);
  persist(); closeProdModal(); renderProducts();
}
function deleteProduct(id){ if(!confirm('Supprimer ce produit ?')) return; db.products=db.products.filter(p=>p.id!==id); persist(); renderProducts(); }

/* ---- Import Excel / CSV ---- */
function parseCSV(text){
  // détecte le séparateur (; ou , ou tab)
  const first=text.split(/\r?\n/)[0]||'';
  const sep = (first.match(/;/g)||[]).length >= (first.match(/,/g)||[]).length ? (first.includes('\t')&&!first.includes(';')?'\t':';') : ',';
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<text.length;i++){ const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
    else { if(c==='"') q=true; else if(c===sep){ row.push(cur); cur=''; } else if(c==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; } else if(c==='\r'){} else cur+=c; }
  }
  if(cur.length||row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r=>r.some(c=>(c||'').trim()!==''));
}
function rowsToProducts(rows){
  if(!rows.length) return [];
  const norm=s=>(s||'').toString().toLowerCase().replace(/[éè]/g,'e').replace(/[^a-z0-9]/g,'');
  const H={desc:['designation','description','libelle','libelledarticle','article','intitule','nom','produit'],
    unit:['unite','unit','unitede','u'], pu:['pu','prix','prixunitaire','prixunitaireht','puht','prixht','prixhtunitaire','montantht','tarif','prixvente'],
    tva:['tva','tauxdetva','tauxtva','taux'], ref:['ref','reference','code','categorie','famille']};
  const head=rows[0].map(norm);
  const find=keys=>{ for(const k of keys){ const idx=head.indexOf(k); if(idx>=0) return idx; } return -1; };
  let idx={desc:find(H.desc),unit:find(H.unit),pu:find(H.pu),tva:find(H.tva),ref:find(H.ref)};
  let start=1;
  if(idx.desc<0){ // pas d'en-tête reconnu -> positionnel : désignation, unité, PU, TVA, réf
    idx={desc:0,unit:1,pu:2,tva:3,ref:4}; start=0;
  }
  const toNum=v=>{ if(v==null) return 0; return parseFloat((''+v).replace(/[^0-9,.-]/g,'').replace(',','.'))||0; };
  const out=[];
  for(let i=start;i<rows.length;i++){ const r=rows[i]; const desc=(r[idx.desc]||'').toString().trim(); if(!desc) continue;
    let tva=idx.tva>=0?toNum(r[idx.tva]):20; if(![20,10,5.5,0].includes(tva)) tva=[20,10,5.5,0].includes(Math.round(tva*10)/10)?Math.round(tva*10)/10:20;
    out.push({ id:uid(), desc, unit:idx.unit>=0?((r[idx.unit]||'u').toString().trim()||'u'):'u',
      pu:idx.pu>=0?toNum(r[idx.pu]):0, tva, ref:idx.ref>=0?(r[idx.ref]||'').toString().trim():'' });
  }
  return out;
}
function mergeProducts(items){
  let added=0, updated=0;
  items.forEach(it=>{ const k=it.desc.toLowerCase();
    const ex=db.products.find(p=>p.desc.toLowerCase()===k);
    if(ex){ ex.unit=it.unit; ex.pu=it.pu; ex.tva=it.tva; if(it.ref)ex.ref=it.ref; updated++; }
    else { db.products.push(it); added++; }
  });
  persist(); return {added,updated};
}
function importFile(e){
  const f=e.target.files[0]; if(!f) return; const name=f.name.toLowerCase();
  const done=items=>{ if(!items.length){ alert('Aucun produit détecté dans le fichier. Vérifiez qu\'il contient une colonne « Désignation ».'); return; }
    const r=mergeProducts(items); renderProducts(); alert(`Import terminé : ${r.added} ajouté(s), ${r.updated} mis à jour.`); e.target.value=''; };
  if(name.endsWith('.xlsx')||name.endsWith('.xls')){
    if(typeof XLSX==='undefined'){ alert('Le lecteur Excel n\'a pas pu se charger (hors ligne ?). Enregistrez votre fichier en CSV et réimportez-le.'); e.target.value=''; return; }
    const rd=new FileReader(); rd.onload=ev=>{ try{ const wb=XLSX.read(ev.target.result,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''}); done(rowsToProducts(rows)); }
      catch(err){ alert('Fichier Excel illisible : '+err.message); } }; rd.readAsArrayBuffer(f);
  } else {
    const rd=new FileReader(); rd.onload=ev=>done(rowsToProducts(parseCSV(ev.target.result))); rd.readAsText(f,'UTF-8');
  }
}
function downloadTemplate(){
  const csv='Désignation;Unité;Prix unitaire HT;TVA;Référence\n'+
    'Climatiseur mural 3,5 kW;u;850;10;CLIM-35\n'+
    'Pose et mise en service;forfait;350;10;POSE\n'+
    'Gaine isolée Ø160 (le mètre);ml;12,50;20;GAINE-160\n';
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='modele-produits-acf.csv'; a.click();
}

/* ================= LISTE DES DEVIS ================= */
function variantTTC(v){
  let ht=0; const map={}; (v.lines||[]).forEach(l=>{ if(l.type)return; const t=(+l.qte||0)*(+l.pu||0); ht+=t; map[l.tva]=(map[l.tva]||0)+t;});
  const rem = v.remiseType==='pct' ? ht*(+v.remise||0)/100 : (+v.remise||0);
  const net = Math.max(0, ht-rem); const ratio = ht>0?net/ht:0;
  let tva=0; Object.keys(map).forEach(r=> tva+=map[r]*ratio*(+r)/100);
  return net+tva;
}
function devisTTC(d){ const v=d.variants[d.active||0]||d.variants[0]; return v?variantTTC(v):0; }
function renderList(){
  const q=(document.getElementById('searchDevis').value||'').toLowerCase();
  const list=db.devis.filter(d=>{
    const c=db.clients.find(x=>x.id===d.clientId); const cn=clientName(c).toLowerCase();
    return cn.includes(q)||(d.num||'').toLowerCase().includes(q)||(d.objet||'').toLowerCase().includes(q);
  }).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const wrap=document.getElementById('devisTableWrap');
  if(!list.length){ wrap.innerHTML='<div class="empty">Aucun devis'+(q?' pour cette recherche':'')+'. Cliquez sur « ＋ Nouveau devis ».</div>'; return; }
  const stLabel={brouillon:'Brouillon',envoye:'Envoyé',accepte:'Accepté',refuse:'Refusé'};
  wrap.innerHTML='<table class="grid"><thead><tr><th>N°</th><th>Client</th><th>Objet</th><th>Date</th><th>Variantes</th><th>Statut</th><th style="text-align:right">Total TTC</th><th></th></tr></thead><tbody>'+
    list.map(d=>{ const c=db.clients.find(x=>x.id===d.clientId);
      return `<tr>
        <td class="clic num-mono" onclick="openDevis('${d.id}')">${esc(d.num)}</td>
        <td class="clic" onclick="openDevis('${d.id}')">${esc(clientName(c))||'<span style=color:#aab>—</span>'}</td>
        <td class="clic" onclick="openDevis('${d.id}')">${esc(d.objet||'')}</td>
        <td>${d.date?new Date(d.date).toLocaleDateString('fr-FR'):''}</td>
        <td>${d.variants.length>1?d.variants.length+' variantes':'—'}</td>
        <td><span class="st ${d.statut||'brouillon'}">${stLabel[d.statut||'brouillon']}</span></td>
        <td class="ttc-mono" style="text-align:right">${eur(devisTTC(d))}</td>
        <td class="row-act"><button class="small" title="Ouvrir" onclick="openDevis('${d.id}')">Ouvrir</button>
          <button class="small" title="Dupliquer" onclick="duplicateDevis('${d.id}')">⧉</button>
          <button class="small rouge" title="Supprimer" onclick="deleteDevis('${d.id}')">🗑</button></td></tr>`;
    }).join('')+'</tbody></table>';
}
function duplicateDevis(id){
  const d=db.devis.find(x=>x.id===id); if(!d) return;
  const copy=JSON.parse(JSON.stringify(d)); copy.id=uid(); copy.num=nextNum(); copy.createdAt=Date.now(); copy.statut='brouillon';
  db.devis.push(copy); persist(); renderList();
}
function deleteDevis(id){ if(!confirm('Supprimer ce devis ?')) return; db.devis=db.devis.filter(x=>x.id!==id); persist(); renderList(); }

/* ================= NUMÉROTATION AUTO ================= */
function nextNum(){ const y=new Date().getFullYear(); db.seq=(db.seq||0)+1; return `DEV-${y}-${String(db.seq).padStart(3,'0')}`; }

/* ================= ÉDITEUR ================= */
let cur=null;  // devis en cours d'édition
function emptyVariant(name){ return {id:uid(), name:name||'Base', lines:[], remise:0, remiseType:'pct', acompte:30}; }
function newDevis(){
  cur={ id:uid(), num:nextNum(), createdAt:Date.now(), statut:'brouillon', clientId:'', commercialId:db.lastComId||'',
    date:new Date().toISOString().slice(0,10), valid:new Date(Date.now()+30*864e5).toISOString().slice(0,10),
    objet:'',
    conditions:'Acompte de 30 % à la commande, solde à la fin des travaux. Règlement par virement ou chèque à réception de facture.',
    variants:[ (()=>{const v=emptyVariant('Base'); v.lines=[{desc:'',qte:1,unit:'u',pu:0,tva:20,photo:'',size:'medium'},{desc:'',qte:1,unit:'u',pu:0,tva:10,photo:'',size:'medium'}]; return v;})() ],
    active:0 };
  db.devis.push(cur); persist();
  loadEditor();
}
function openDevis(id){ cur=db.devis.find(x=>x.id===id); if(!cur) return; if(cur.active==null)cur.active=0; loadEditor(); }
function loadEditor(){
  showView('editor');
  document.getElementById('devNum').value=cur.num;
  document.getElementById('devDate').value=cur.date||'';
  document.getElementById('devValid').value=cur.valid||'';
  document.getElementById('devObjet').value=cur.objet||'';
  document.getElementById('devStatut').value=cur.statut||'brouillon';
  document.getElementById('conditions').value=cur.conditions||'';
  fillComSelect(cur.commercialId||''); renderComView();
  fillClientSelect(cur.clientId); renderClientView();
  renderVariantTabs(); renderLines(); recalc();
}
function fillClientSelect(sel){
  const s=document.getElementById('clientSelect');
  s.innerHTML='<option value="">— Sélectionner un client —</option>'+
    db.clients.slice().sort((a,b)=>clientName(a).localeCompare(clientName(b)))
      .map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(clientName(c))} ${c.type==='pro'?'(Pro)':''}</option>`).join('');
  document.getElementById('editClientBtn').style.display = sel ? 'inline-flex':'none';
}
function onClientChange(){ cur.clientId=document.getElementById('clientSelect').value; renderClientView();
  document.getElementById('editClientBtn').style.display=cur.clientId?'inline-flex':'none'; scheduleSave(); }
function editSelectedClient(){ if(cur.clientId) openClientModal(cur.clientId); }
function renderClientView(){
  const c=db.clients.find(x=>x.id===cur.clientId); const el=document.getElementById('clientView');
  if(!c){ el.innerHTML='<span style="color:var(--muted)">Aucun client sélectionné.</span>'; return; }
  const l=[];
  l.push(`<span class="cname">${esc(clientName(c))}</span> <span class="tag ${c.type}">${c.type==='pro'?'Pro':'Particulier'}</span>`);
  if(c.type==='pro'&&c.contact) l.push('À l\'attention de '+esc(c.contact));
  if(c.adresse) l.push(esc(c.adresse));
  if(c.cp||c.ville) l.push(esc([c.cp,c.ville].filter(Boolean).join(' ')));
  const cont=[]; if(c.tel)cont.push('Tél. '+esc(c.tel)); if(c.email)cont.push(esc(c.email)); if(cont.length)l.push(cont.join(' · '));
  if(c.type==='pro'&&c.siret) l.push('SIRET '+esc(c.siret));
  if(c.type==='pro'&&c.tvaIntra) l.push('TVA '+esc(c.tvaIntra));
  el.innerHTML=l.join('<br>');
}

/* ---- Variantes ---- */
function renderVariantTabs(){
  const el=document.getElementById('variantTabs');
  el.innerHTML=cur.variants.map((v,i)=>`<span class="vtab ${i===cur.active?'active':''}" onclick="switchVariant(${i})">
    <span ondblclick="renameVariant(${i},event)">${esc(v.name)}</span>
    ${cur.variants.length>1?`<span class="vx" title="Supprimer" onclick="delVariant(${i},event)">×</span>`:''}</span>`).join('');
  document.getElementById('docVariantLabel').textContent = cur.variants.length>1 ? '— '+cur.variants[cur.active].name : '';
}
function switchVariant(i){ syncActiveVariant(); cur.active=i; renderVariantTabs(); renderLines(); recalc(); }
function addVariant(){ syncActiveVariant();
  const base=cur.variants[cur.active]; const v=JSON.parse(JSON.stringify(base)); v.id=uid();
  v.name='Variante '+String.fromCharCode(65+cur.variants.length-1);
  cur.variants.push(v); cur.active=cur.variants.length-1; renderVariantTabs(); renderLines(); recalc(); persist();
}
function delVariant(i,e){ e.stopPropagation(); if(cur.variants.length<2) return;
  if(!confirm('Supprimer la variante « '+cur.variants[i].name+' » ?')) return;
  cur.variants.splice(i,1); if(cur.active>=cur.variants.length) cur.active=cur.variants.length-1;
  renderVariantTabs(); renderLines(); recalc(); persist();
}
function renameVariant(i,e){ e.stopPropagation();
  const n=prompt('Nom de la variante :', cur.variants[i].name); if(n){ cur.variants[i].name=n.trim()||cur.variants[i].name; renderVariantTabs(); } }

/* ---- Lignes ---- */
const TVA_RATES=[20,10,5.5,0];
function tvaOptions(sel){ return TVA_RATES.map(r=>`<option value="${r}" ${r===sel?'selected':''}>${(''+r).replace('.',',')} %</option>`).join(''); }
const SIZES={petit:'small',moyen:'medium',grand:'large'};
function sizeOptions(sel){ return Object.entries(SIZES).map(([lbl,cls])=>`<option value="${cls}" ${cls===sel?'selected':''}>${lbl.charAt(0).toUpperCase()+lbl.slice(1)}</option>`).join(''); }

function renderLines(){ document.getElementById('lineBody').innerHTML='';
  (cur.variants[cur.active].lines||[]).forEach(l=> (l.type==='section'||l.type==='subsection') ? addSection(l.type,l) : addLine(l));
  if(!cur.variants[cur.active].lines.length) addLine({});
  document.getElementById('remise').value=cur.variants[cur.active].remise||0;
  document.getElementById('remiseType').value=cur.variants[cur.active].remiseType||'pct';
  document.getElementById('acompte').value=cur.variants[cur.active].acompte!=null?cur.variants[cur.active].acompte:30;
}
function addLine(data={}){
  const size=data.size||'medium';
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td class="col-num idx"></td>
    <td class="col-desc">
      <div class="fmt-bar no-print">
        <button type="button" class="fmt" title="Gras" data-cmd="bold"><b>G</b></button>
        <button type="button" class="fmt" title="Italique" data-cmd="italic"><i>I</i></button>
        <button type="button" class="fmt" title="Souligné" data-cmd="underline"><u>S</u></button>
        <button type="button" class="fmt" title="Barré" data-cmd="strikeThrough"><s>B</s></button>
        <button type="button" class="fmt" title="Liste" data-cmd="insertUnorderedList">•</button>
        <input type="color" class="fmt-color" title="Couleur" value="#1f2733">
        <span class="fmt-sep"></span>
        <label style="font-size:11px;color:var(--muted)">Photo</label>
        <select class="size-sel" title="Taille de la photo" onchange="changeSize(this)">${sizeOptions(size)}</select>
      </div>
      <div class="desc" contenteditable="true" data-ph="Désignation / description…">${data.desc||''}</div>
      <div class="photo-cell photo-${size}">
        <div class="photo-drop" onclick="this.parentNode.querySelector('input[type=file]').click()"><span>＋ Ajouter une photo</span></div>
        <button class="photo-del no-print" title="Retirer" onclick="delPhoto(this)">×</button>
        <input type="file" accept="image/*" style="display:none" onchange="setPhoto(this)">
      </div>
    </td>
    <td class="col-qte"><input class="num qte" type="number" min="0" step="0.01" value="${data.qte!=null?data.qte:1}" oninput="recalc()"></td>
    <td class="col-unit"><input class="unit" value="${data.unit||'u'}" oninput="scheduleSave()"></td>
    <td class="col-pu"><input class="num pu" type="number" min="0" step="0.01" value="${data.pu!=null?data.pu:0}" oninput="recalc()"></td>
    <td class="col-tva"><select class="tva" onchange="recalc()">${tvaOptions(data.tva!=null?data.tva:20)}</select></td>
    <td class="col-tot lineTot">0,00 €</td>
    <td class="col-act no-print"><button class="small rouge" onclick="this.closest('tr').remove();renumber();recalc()">×</button></td>`;
  tr.classList.add('row-item');
  document.getElementById('lineBody').appendChild(tr);
  if(data.photo) setPhotoData(tr,data.photo);
  renumber();
}
function addSection(type,data={}){
  const tr=document.createElement('tr'); tr.className='row-'+type;
  const tag = type==='section' ? 'Section' : 'Sous-section';
  tr.innerHTML=`<td colspan="8">
    <div class="sec-bar">
      <span class="sec-tag no-print">${tag}</span>
      <input class="sec-title" value="${esc(data.title||'').replace(/"/g,'&quot;')}" placeholder="Titre de la ${type==='section'?'section':'sous-section'}…" oninput="scheduleSave()">
      <span class="sec-sub" data-sub></span>
      <button class="small rouge no-print" title="Supprimer" onclick="this.closest('tr').remove();renumber();recalc()">×</button>
    </div></td>`;
  document.getElementById('lineBody').appendChild(tr);
  renumber();
}
function renumber(){ let n=0; document.querySelectorAll('#lineBody tr.row-item').forEach(tr=>{ n++; const idx=tr.querySelector('.idx'); if(idx) idx.textContent=n; }); }
function changeSize(sel){ const cell=sel.closest('.col-desc').querySelector('.photo-cell');
  cell.className='photo-cell photo-'+sel.value; scheduleSave(); }
function setPhoto(input){ const f=input.files[0]; if(!f)return; const r=new FileReader();
  r.onload=ev=>{ setPhotoData(input.closest('tr'),ev.target.result); recalc(); }; r.readAsDataURL(f); }
function setPhotoData(tr,src){ const cell=tr.querySelector('.photo-cell');
  cell.querySelector('.photo-drop').innerHTML=`<img src="${src}">`; cell.classList.add('has-img'); cell.dataset.photo=src; }
function delPhoto(btn){ const cell=btn.closest('.photo-cell'); cell.classList.remove('has-img'); delete cell.dataset.photo;
  cell.querySelector('.photo-drop').innerHTML='<span>＋ Ajouter une photo</span>'; cell.querySelector('input[type=file]').value=''; scheduleSave(); }

/* ---- Mise en forme désignation ---- */
document.addEventListener('mousedown', e=>{ const b=e.target.closest && e.target.closest('.fmt'); if(!b)return;
  e.preventDefault(); const d=b.closest('.col-desc').querySelector('.desc'); d.focus(); document.execCommand(b.dataset.cmd,false,null); });
document.addEventListener('input', e=>{ if(e.target.classList && e.target.classList.contains('fmt-color')){
  const d=e.target.closest('.col-desc').querySelector('.desc'); d.focus(); document.execCommand('foreColor',false,e.target.value); }
  if(e.target.classList && e.target.classList.contains('desc')){ scheduleSave(); showAC(e.target); } });
try{ document.execCommand('styleWithCSS',false,true); }catch(_){}

/* ---- Autocomplétion produit (à partir des devis précédents) ---- */
function htmlToText(h){ const d=document.createElement('div'); d.innerHTML=h||''; return (d.textContent||'').replace(/\s+/g,' ').trim(); }
function buildCatalog(){
  const seen={};
  // 1) produits du catalogue importé/saisi
  (db.products||[]).forEach(p=>{ if(!p.desc)return; seen[p.desc.toLowerCase()]={desc:p.desc, unit:p.unit||'u', pu:+p.pu||0, tva:p.tva!=null?p.tva:20}; });
  // 2) produits déjà saisis dans des devis (écrasent avec la valeur la plus récente)
  db.devis.forEach(d=>d.variants.forEach(v=>(v.lines||[]).forEach(l=>{
    if(l.type||!l.desc) return; const plain=htmlToText(l.desc); if(plain.length<2) return;
    seen[plain.toLowerCase()]={desc:plain, unit:l.unit||'u', pu:l.pu||0, tva:l.tva!=null?l.tva:20};
  })));
  return Object.values(seen);
}
let acActive=null, acItems=[], acIndex=-1;
function showAC(desc){
  const q=htmlToText(desc.innerHTML).toLowerCase(); const box=document.getElementById('acBox');
  if(q.length<2){ hideAC(); return; }
  const cat=buildCatalog().filter(p=>{const d=p.desc.toLowerCase(); return d.includes(q)&&d!==q;}).slice(0,8);
  if(!cat.length){ hideAC(); return; }
  acActive=desc; acItems=cat; acIndex=-1;
  box.innerHTML=cat.map((p,i)=>`<div class="ac-item" data-i="${i}"><div class="ac-desc">${esc(p.desc)}</div><div class="ac-meta">${eur(+p.pu)} / ${esc(p.unit)} · TVA ${(''+p.tva).replace('.',',')} %</div></div>`).join('');
  const r=desc.getBoundingClientRect();
  box.style.left=(r.left+window.scrollX)+'px'; box.style.top=(r.bottom+window.scrollY+4)+'px'; box.style.width=Math.max(280,r.width)+'px';
  box.classList.add('open');
}
function hideAC(){ document.getElementById('acBox').classList.remove('open'); acActive=null; acItems=[]; acIndex=-1; }
function pickAC(i){
  const p=acItems[i]; if(!p||!acActive) return; const tr=acActive.closest('tr');
  acActive.textContent=p.desc;
  tr.querySelector('.unit').value=p.unit; tr.querySelector('.pu').value=p.pu;
  const sel=tr.querySelector('.tva'); if([...sel.options].some(o=>+o.value===+p.tva)) sel.value=p.tva;
  hideAC(); recalc();
}
function updACSel(){ document.querySelectorAll('#acBox .ac-item').forEach((el,i)=>el.classList.toggle('sel',i===acIndex)); }
document.addEventListener('mousedown', e=>{ const it=e.target.closest && e.target.closest('.ac-item'); if(it){ e.preventDefault(); pickAC(+it.dataset.i); }
  else if(!(e.target.closest && e.target.closest('#acBox')) && !(e.target.classList&&e.target.classList.contains('desc'))) hideAC(); });
document.addEventListener('keydown', e=>{
  if(!document.getElementById('acBox').classList.contains('open')) return;
  if(e.key==='ArrowDown'){ e.preventDefault(); acIndex=Math.min(acItems.length-1,acIndex+1); updACSel(); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); acIndex=Math.max(0,acIndex-1); updACSel(); }
  else if(e.key==='Enter' && acIndex>=0){ e.preventDefault(); pickAC(acIndex); }
  else if(e.key==='Escape'){ hideAC(); }
});

/* ---- Calculs ---- */
function recalc(){
  let totalHT=0; const map={};
  const rows=[...document.querySelectorAll('#lineBody tr')];
  // total par ligne + cumul
  rows.forEach(tr=>{
    if(!tr.classList.contains('row-item')) return;
    const q=parseFloat(tr.querySelector('.qte').value)||0, p=parseFloat(tr.querySelector('.pu').value)||0, t=parseFloat(tr.querySelector('.tva').value)||0;
    const lt=q*p; tr.querySelector('.lineTot').textContent=eur(lt); totalHT+=lt; map[t]=(map[t]||0)+lt;
  });
  // sous-totaux de sections
  rows.forEach((tr,i)=>{
    const isSec=tr.classList.contains('row-section'), isSub=tr.classList.contains('row-subsection');
    if(!isSec && !isSub) return;
    const level=isSec?1:2; let sum=0;
    for(let j=i+1;j<rows.length;j++){
      const r=rows[j];
      const rl=r.classList.contains('row-section')?1:(r.classList.contains('row-subsection')?2:3);
      if(rl<=level) break;
      const q=parseFloat(r.querySelector('.qte').value)||0, p=parseFloat(r.querySelector('.pu').value)||0;
      sum+=q*p;
    }
    tr.querySelector('[data-sub]').textContent = sum>0 ? 'Sous-total : '+eur(sum) : '';
  });
  const remV=parseFloat(document.getElementById('remise').value)||0, remT=document.getElementById('remiseType').value;
  let remise=remT==='pct'?totalHT*remV/100:remV; if(remise>totalHT)remise=totalHT;
  const net=totalHT-remise, ratio=totalHT>0?net/totalHT:0;
  let totalTVA=0;
  const tvaHtml=Object.keys(map).map(Number).sort((a,b)=>b-a).map(rate=>{
    const base=map[rate]*ratio, m=base*rate/100; totalTVA+=m;
    return rate===0?'':`<div class="row sub"><span>TVA ${(''+rate).replace('.',',')} % (sur ${eur(base)})</span><span>${eur(m)}</span></div>`;
  }).join('');
  const ttc=net+totalTVA, acP=parseFloat(document.getElementById('acompte').value)||0, ac=ttc*acP/100;
  document.getElementById('tHT').textContent=eur(totalHT);
  document.getElementById('tRemise').textContent=(remise>0?'– ':'')+eur(remise);
  document.getElementById('tvaRows').innerHTML=tvaHtml;
  document.getElementById('tTVA').textContent=eur(totalTVA);
  document.getElementById('tTTC').textContent=eur(ttc);
  document.getElementById('tAcompte').textContent=eur(ac);
  document.getElementById('tReste').textContent=eur(ttc-ac);
  scheduleSave();
}

/* ---- Sauvegarde ---- */
function syncActiveVariant(){
  if(!cur) return; const v=cur.variants[cur.active]; if(!v) return;
  v.lines=[]; document.querySelectorAll('#lineBody tr').forEach(tr=>{
    if(tr.classList.contains('row-section')||tr.classList.contains('row-subsection')){
      v.lines.push({ type: tr.classList.contains('row-section')?'section':'subsection', title: tr.querySelector('.sec-title').value }); return;
    }
    const cell=tr.querySelector('.photo-cell'); const size=(cell.className.match(/photo-(small|medium|large)/)||[])[1]||'medium';
    v.lines.push({ desc:tr.querySelector('.desc').innerHTML, qte:tr.querySelector('.qte').value, unit:tr.querySelector('.unit').value,
      pu:tr.querySelector('.pu').value, tva:parseFloat(tr.querySelector('.tva').value), photo:cell.dataset.photo||'', size });
  });
  v.remise=parseFloat(document.getElementById('remise').value)||0;
  v.remiseType=document.getElementById('remiseType').value;
  v.acompte=parseFloat(document.getElementById('acompte').value)||0;
}
let saveTimer=null;
function scheduleSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(()=>saveDevis(false),600); }
function saveDevis(notify){
  if(!cur) return; syncActiveVariant();
  cur.date=document.getElementById('devDate').value; cur.valid=document.getElementById('devValid').value;
  cur.objet=document.getElementById('devObjet').value; cur.statut=document.getElementById('devStatut').value;
  cur.commercialId=document.getElementById('comSelect').value;
  cur.conditions=document.getElementById('conditions').value;
  const i=db.devis.findIndex(d=>d.id===cur.id); if(i<0) db.devis.push(cur);
  document.getElementById('docVariantLabel').textContent = cur.variants.length>1 ? '— '+cur.variants[cur.active].name : '';
  persist();
  if(notify){ const b=event&&event.target; if(b){ const t=b.textContent; b.textContent='✓ Enregistré'; setTimeout(()=>b.textContent=t,1200); } }
}
function backToList(){ saveDevis(false); showView('list'); }

/* ================= INIT ================= */
renderList();

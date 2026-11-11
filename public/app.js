const $ = id => document.getElementById(id);
const fields = ['roles','skills','seniority','industries','locations','projectEvidence','portfolioUrl','visaOnly'];
const profileStorageKey = 'ai-job-market-compass-profile';
let latestInsights = null;
try {
  const saved = JSON.parse(localStorage.getItem(profileStorageKey) || localStorage.getItem('northstar-profile') || 'null');
  if (saved) fields.forEach(id => {
    if (id === 'visaOnly') $(id).checked = Boolean(saved[id]);
    else if (typeof saved[id] === 'string') $(id).value = saved[id];
  });
  if (saved) { saveProfile(); localStorage.removeItem('northstar-profile'); }
} catch {}
if($('projectEvidence').value.trim()||$('portfolioUrl').value.trim())$('backgroundDetails').open=true;
fields.forEach(id => $(id).addEventListener(id === 'visaOnly' ? 'change' : 'input', () => { saveProfile(); if (latestInsights) renderEvidence(latestInsights); renderLinkedInSearches(); }));
function saveProfile() { localStorage.setItem(profileStorageKey, JSON.stringify(Object.fromEntries(fields.map(id => [id, id === 'visaOnly' ? $(id).checked : $(id).value])))); }
function splitLines(value) { return value.split(/\r?\n/).map(x => x.trim()).filter(Boolean); }
function splitComma(value) { return value.split(',').map(x => x.trim()).filter(Boolean); }
const europeanCountries = ['albania','andorra','armenia','austria','azerbaijan','belarus','belgium','bosnia','bulgaria','croatia','cyprus','czechia','czech republic','denmark','estonia','finland','france','georgia','germany','greece','hungary','iceland','ireland','italy','kosovo','latvia','liechtenstein','lithuania','luxembourg','malta','moldova','monaco','montenegro','netherlands','north macedonia','norway','poland','portugal','romania','russia','san marino','serbia','slovakia','slovenia','spain','sweden','switzerland','turkey','ukraine','united kingdom','uk','great britain','britain','england','scotland','wales','northern ireland','deutschland','nederland','holland','österreich','schweiz','suisse','españa','suomi','italia'];
const europeanCities = ['berlin','munich','münchen','hamburg','frankfurt','cologne','köln','stuttgart','düsseldorf','dortmund','leipzig','bremen','dresden','hannover','nuremberg','nürnberg','bonn','heidelberg','karlsruhe','freiburg','amsterdam','rotterdam','utrecht','eindhoven','the hague','den haag','groningen','maastricht','leiden','tilburg','almere','breda','nijmegen','enschede','haarlem','arnhem','london','edinburgh','glasgow','manchester','birmingham','bristol','cambridge','oxford','cardiff','belfast','leeds','liverpool','paris','lyon','marseille','toulouse','bordeaux','nice','nantes','strasbourg','brussels','bruxelles','antwerp','ghent','bruges','vienna','wien','graz','linz','zurich','zürich','geneva','genève','basel','bern','lausanne','lisbon','lisboa','porto','madrid','barcelona','valencia','seville','sevilla','malaga','málaga','rome','roma','milan','milano','turin','torino','bologna','florence','firenze','dublin','cork','galway','oslo','bergen','stockholm','gothenburg','copenhagen','helsinki','reykjavik','prague','praha','warsaw','krakow','kraków','wroclaw','wrocław','budapest','athens','thessaloniki','bucharest','sofia','zagreb','ljubljana','bratislava','tallinn','riga','vilnius','luxembourg city','belgrade','sarajevo','tirana','skopje','podgorica','kyiv','kiev','minsk','moscow','istanbul','ankara','nicosia','tbilisi','yerevan','baku','monaco'];
function isSupportedLocation(value) { const v=value.toLowerCase().trim(); return ['eu','europe','european union','europe-wide','all europe'].includes(v)||europeanCountries.some(country=>v===country||v.endsWith(', '+country))||europeanCities.some(city=>v===city||v.startsWith(city+', '))||/,\s*[a-z]{2}$/.test(v); }
function toast(message) { const t=$('toast'); t.textContent=message; t.style.display='block'; clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.style.display='none',4600); }
function safeText(text) { return String(text ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function safeHref(value) { try { const u=new URL(value); return ['https:','http:'].includes(u.protocol)?u.href:'#'; } catch { return '#'; } }
function dateLabel(date) { if (!date) return 'Date not listed'; const d=new Date(date); return Number.isNaN(d.getTime())?'Date not listed':new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(d); }
function money(job) { if (!job.salaryMin && !job.salaryMax) return ''; const fmt=n=>new Intl.NumberFormat(undefined,{style:'currency',currency:job.salaryCurrency||'EUR',maximumFractionDigits:0}).format(n); return job.salaryMin&&job.salaryMax?`${fmt(job.salaryMin)}–${fmt(job.salaryMax)}`:fmt(job.salaryMin||job.salaryMax); }
function sourceUrl(job) { const adzuna={AT:'https://www.adzuna.at',DE:'https://www.adzuna.de',FR:'https://www.adzuna.fr',GB:'https://www.adzuna.co.uk',IE:'https://www.adzuna.ie',IT:'https://www.adzuna.it',NL:'https://www.adzuna.nl',PL:'https://www.adzuna.pl'};return ({'Arbeitnow':'https://www.arbeitnow.com','Arbeitsagentur':'https://www.arbeitsagentur.de/jobsuche','Jooble':'https://jooble.org','Adzuna':adzuna[job.country]||'https://www.adzuna.com'})[job.source]||'#'; }
function renderJobs(jobs, stored=false) {
  $('jobList').replaceChildren();
  if (!jobs?.length) {
    $('jobList').innerHTML='<div class="empty"><div class="emptyicon">✳</div><h3>Make your first search</h3><p>Collect listings from the configured providers, then compare common requirements with your project evidence.</p><div class="mini">Arbeitnow · Arbeitsagentur · optional Jooble and Adzuna</div></div>';
    $('resultsMeta').textContent='No collected listings'; return;
  }
  const sourceCounts=Object.entries(jobs.reduce((counts,job)=>{const source=job.source||'Other';counts[source]=(counts[source]||0)+1;return counts;},{})).map(([source,count])=>`${source} ${count}`);
  $('resultsMeta').textContent=`${jobs.length} ${stored?'saved ':''}listings · ${sourceCounts.join(' · ')}`;
  const fragment=document.createDocumentFragment();
  for (const job of jobs) {
    const article=document.createElement('article'); article.className='job';
    const score=Number(job.score)||0;
    const tags=(job.skillsMatched||[]).slice(0,5).map(x=>`<span class="tag match">${safeText(x)}</span>`).join('');
    const concerns=(job.concerns||[]).slice(0,2).map(x=>`<span class="tag">${safeText(x)}</span>`).join('');
    const salary=money(job);
    const requirements=job.mustHave?.length||job.niceToHave?.length||job.languages?.length||job.workAuthorization;
    const requirementsBlock=requirements?`<details class="req-details"><summary>Requirements identified in this listing</summary>${job.mustHave?.length?`<p><b>Core:</b> ${job.mustHave.map(safeText).join(' · ')}</p>`:''}${job.niceToHave?.length?`<p><b>Preferred:</b> ${job.niceToHave.map(safeText).join(' · ')}</p>`:''}${job.languages?.length?`<p><b>Languages mentioned:</b> ${job.languages.map(safeText).join(' · ')}</p>`:''}${job.workAuthorization?`<p><b>Work authorization:</b> ${safeText(job.workAuthorization)}</p>`:''}${job.seniority?`<p><b>Seniority:</b> ${safeText(job.seniority)}</p>`:''}</details>`:'';
    article.innerHTML=`<div class="jobtop"><div><h3 class="jobtitle">${safeText(job.title)}</h3><div class="companyline">${safeText(job.company)}</div></div><div class="score ${score<55?'low':''}"><i></i>${score}% fit</div></div><div class="jobmeta"><span>⌖ ${safeText(job.location)} · ${safeText(job.country)}</span><span>◷ ${safeText(dateLabel(job.created))}</span>${salary?`<span>${safeText(salary)}</span>`:''}</div><p class="reason">${safeText(job.reason || 'Review the role against your preferences.')}</p><div class="tags">${tags}${concerns}</div>${requirementsBlock}<div class="jobfoot"><a class="source" href="${safeHref(sourceUrl(job))}" target="_blank" rel="noopener">${safeText(job.source||'Job source')}</a><a class="apply" href="${safeHref(job.url)}" target="_blank" rel="noopener">View listing ↗</a></div>`;
    fragment.append(article);
  }
  $('jobList').append(fragment);
}
function renderInsights(data) {
  latestInsights=data.insights||{total:0,countries:{},roles:[],skills:[]};
  const insights=latestInsights;
  $('statJobs').innerHTML=`${insights.total}<small> postings</small>`;
  $('statTopSkill').textContent=insights.skills?.[0]?.name||'Awaiting listings';
  $('marketBrief').textContent=data.marketBrief||'Run a search to build the market snapshot.';
  $('sampleNote').textContent=data.lastSearchAt?`Last refreshed ${dateLabel(data.lastSearchAt)} · ${data.lastSearchCount||0} listings in that search · saved window: 30 days.`:'No postings collected yet.';
  const regionNames=new Intl.DisplayNames(undefined,{type:'region'});
  $('countryCounts').innerHTML=Object.entries(insights.countries||{}).sort((a,b)=>b[1]-a[1]).map(([code,count])=>`<span class="country-pill">${safeText(code==='EU'?'Europe':regionNames.of(code))} · ${count}</span>`).join('');
  const max=Math.max(1,...(insights.skills||[]).map(x=>x.count));
  $('skillBars').innerHTML=(insights.skills||[]).slice(0,12).map(skill=>`<div class="skill-row" title="Seen in ${skill.count} of ${insights.total} postings"><span>${safeText(skill.name)}</span><span class="bar-track"><span class="bar-fill" style="display:block;width:${Math.max(2,Math.round(skill.count/max*100))}%"></span></span><span class="skill-count">${skill.count}</span></div>`).join('')||'<div class="muted-empty">No recurring skill terms found yet.</div>';
  $('roleRows').innerHTML=(insights.roles||[]).map(row=>{const places=Object.entries(row.countries||{}).sort((a,b)=>b[1]-a[1]).map(([code,count])=>`${safeText(code==='EU'?'Europe':regionNames.of(code))} ${count}`).join(' · ');return `<tr><td>${safeText(row.name)}</td><td>${places||'—'}</td><td><b>${row.total||0}</b></td></tr>`;}).join('')||'<tr><td colspan="3" class="muted-empty">Search to fill this breakdown.</td></tr>';
  renderEvidence(insights);
}
function renderEvidence(insights) {
  const evidence=splitLines($('projectEvidence').value).join(' ').toLowerCase().replace(/[^a-z0-9+#]+/g,' ');
  const skills=(insights.skills||[]).slice(0,12);
  if (!skills.length) { $('evidenceMap').innerHTML='<div class="muted-empty">Collect listings to see frequently requested skills here.</div>';return; }
  if (!evidence.trim()) { $('evidenceMap').innerHTML='<div class="muted-empty">Add project or experience examples in the left panel to see which recurring skills they mention.</div>';return; }
  $('evidenceMap').innerHTML=skills.map(skill=>{
    const term=skill.name.toLowerCase().replace(/[^a-z0-9+#]+/g,' ').trim();
    const covered=term.length>2&&(` ${evidence} `).includes(` ${term} `);
    return `<div class="evidence-item"><span class="evidence-name">${safeText(skill.name)} <span style="font-weight:400;color:#9ba2a8">· ${skill.count}</span></span><span class="evidence-state ${covered?'covered':''}">${covered?'Mentioned':'Not shown'}</span></div>`;
  }).join('');
}
function renderLinkedInSearches() {
  const roles=splitLines($('roles').value).slice(0,8), locations=splitLines($('locations').value).slice(0,8);
  const container=$('linkedinLinks');
  if(!roles.length||!locations.length){
    $('linkedinCount').textContent='Add roles and locations';
    container.innerHTML='<div class="muted-empty">Add at least one role and location in your search profile.</div>';
    return;
  }
  const unsupported=locations.filter(location=>!isSupportedLocation(location));
  if(unsupported.length){
    $('linkedinCount').textContent='Location not supported';
    container.innerHTML=`<div class="muted-empty">${safeText(unsupported.join(', '))} could not be recognized as a European location. Enter a European country or include the country after the city.</div>`;
    return;
  }
  const searches=roles.flatMap(role=>locations.map(location=>({role,location})));
  $('linkedinCount').textContent=`${searches.length} searches · ${locations.length} location${locations.length===1?'':'s'}`;
  container.innerHTML=searches.map(({role,location})=>{
    const url=new URL('https://www.linkedin.com/jobs/search/');
    url.searchParams.set('keywords',role);
    url.searchParams.set('location',location);
    url.searchParams.set('f_TPR','r86400');
    return `<a class="linkedin-link" href="${safeHref(url.href)}" target="_blank" rel="noopener noreferrer"><span>${safeText(role)}<br><span style="font-weight:400;color:#8993a0">${safeText(location)}</span></span><span>Search ↗</span></a>`;
  }).join('');
}
function showView(view){
  document.querySelectorAll('.tab-panel').forEach(panel=>{panel.hidden=panel.id!==view;});
  document.querySelectorAll('.view-tab,.navitem').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
  $('currentViewLabel').textContent=view==='insightsView'?'Market insights':'Search jobs';
}
document.querySelectorAll('.view-tab,.navitem').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
async function getConfig() {
  try {
    const response=await fetch('/api/config'); const config=await response.json();
    $('statEngine').textContent=config.groqReady?'Groq + keywords':'Keyword mode';
    $('statEngine').style.color=config.groqReady?'#247b61':'#92733a';
  } catch { $('statEngine').textContent='Server offline';$('statEngine').style.color='#ad5b4f'; }
}
async function loadDashboard() {
  try {
    const response=await fetch('/api/dashboard');
    if(!response.ok)throw new Error('Could not load saved research.');
    const data=await response.json();renderInsights(data);renderJobs(data.jobs,true);
  } catch { $('marketBrief').textContent='Start the app server to load saved research.'; }
}
$('searchButton').addEventListener('click', async () => {
  saveProfile();
  const button=$('searchButton'), alert=$('alert');
  const payload={roles:splitLines($('roles').value),skills:splitComma($('skills').value),seniority:$('seniority').value,industries:splitComma($('industries').value),locations:splitLines($('locations').value),projectEvidence:splitLines($('projectEvidence').value),visaOnly:$('visaOnly').checked};
  if(!payload.roles.length||!payload.locations.length){toast('Add at least one target role and one location.');return;}
  button.disabled=true;button.innerHTML='<span class="spark">✳</span>Collecting & analyzing…';alert.style.display='none';$('resultsMeta').textContent='Searching current listings…';
  $('marketBrief').textContent='Collecting postings, counting recurring skills, and preparing a market summary…';
  $('jobList').innerHTML='<div class="empty"><div class="emptyicon">◌</div><h3>Building your market snapshot</h3><p>Fetching current listings, identifying repeated requirements, and comparing roles with your profile.</p></div>';
  try {
    const response=await fetch('/api/search',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Search failed.');
    renderInsights(data);renderJobs(data.jobs||[]);
    $('statEngine').textContent=data.matchMode==='groq'?'Groq + keywords':'Keyword mode';$('statEngine').style.color=data.matchMode==='groq'?'#247b61':'#92733a';
  } catch(error) {
    $('jobList').innerHTML='<div class="empty"><div class="emptyicon">!</div><h3>Search could not finish</h3><p>Check the API setup in README, then try again.</p></div>';
    alert.textContent=error.message;alert.style.display='block';$('resultsMeta').textContent='Needs setup';
  } finally {button.disabled=false;button.innerHTML='<span class="spark">✳</span>Find matching jobs';}
});
$('importEvidence').addEventListener('click', async () => {
  const file=$('resumeFile').files?.[0], url=$('portfolioUrl').value.trim(), button=$('importEvidence');
  if(!file&&!url){toast('Choose a .txt/.md resume or enter a portfolio URL.');return;}
  if(file&&file.size>18000){toast('Keep the resume text file under 18 KB for import.');return;}
  let payload;
  if(file){
    if(!/\.(txt|md)$/i.test(file.name)){toast('Please choose a .txt or .md resume file.');return;}
    payload={text:await file.text()};
  }else payload={url};
  button.disabled=true;button.textContent='Extracting…';
  try{
    const response=await fetch('/api/profile/import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not import profile evidence.');
    const existing=splitLines($('projectEvidence').value), combined=[...existing,...(data.evidence||[])];
    $('projectEvidence').value=[...new Set(combined)].join('\n');
    $('projectEvidence').dispatchEvent(new Event('input',{bubbles:true}));
    const skills=[...new Set([...splitComma($('skills').value),...(data.skills||[])].map(value=>value.trim()).filter(Boolean))].slice(0,20);
    $('skills').value=skills.join(', ');$('skills').dispatchEvent(new Event('input',{bubbles:true}));
    if(data.skills?.length)$('skillsDetails').open=true;
    toast(`Added ${data.skills?.length||0} skills and ${data.evidence?.length||0} experience items. Review them before searching.`);
  }catch(error){toast(error.message);}
  finally{button.disabled=false;button.textContent='Extract profile skills & evidence';}
});
$('clearData').addEventListener('click',async()=>{
  if(!confirm('Clear all collected job listings and market analysis from this computer?'))return;
  const response=await fetch('/api/clear',{method:'POST'});const data=await response.json();renderInsights(data);renderJobs([],true);toast('Collected listings and analysis cleared.');
});
renderLinkedInSearches();getConfig();loadDashboard();

(() => {
  const fileInput = el('overlay-file');
  const controls = el('overlay-controls');
  const preview = el('overlay-preview');
  const status = el('overlay-status');
  const fill = el('overlay-fill');
  const fields = ['theme','motion','layout'].map(name => el('overlay-'+name));
  const safeTags = new Set('article aside blockquote br caption code dd details div dl dt em figcaption figure footer h1 h2 h3 h4 h5 h6 header hr li main mark nav ol p pre s section small span strong sub summary sup table tbody td th thead tr ul'.split(' '));
  const blockedTags = new Set('script iframe object embed meta link base form template svg math noscript'.split(' '));
  const themes = {
    night: ['#151829','#e8e9f5','#b0a1ff'],
    paper: ['#fff9ed','#32271d','#aa4c28'],
    aurora: ['#122925','#e1fff3','#51e6ac']
  };
  const demo = `<main><header><h1>The Lantern Archive</h1><p>An interactive story draft.</p></header>
  <section><h2>Arrival</h2><p>The tide brought a lantern to the empty dock.</p></section>
  <section data-swarm-gap="Transition to the keeper's cottage" data-swarm-draft="She carried the lantern up the cliff path. A warm light leaked under the keeper’s door."><h2>The keeper</h2></section>
  <section><h2>The signal</h2><p>Three flashes answered from beyond the harbor.</p></section></main>`;
  let source = null;
  let revision = 0;
  let signature = null;

  function parse(content, isHTML) {
    const doc = document.implementation.createHTMLDocument('');
    const gaps = [];
    function mark(element, description, draft = '') {
      element.dataset.gapIndex = String(gaps.length);
      gaps.push({description:description.trim().slice(0,180) || 'Missing section',draft:draft.slice(0,2000)});
    }
    if (isHTML) {
      const input = document.createElement('template');
      input.innerHTML = content;
      function copy(node, target) {
        if (node.nodeType === 3) { target.append(doc.createTextNode(node.data)); return; }
        if (node.nodeType !== 1 || blockedTags.has(node.localName)) return;
        if (node.localName === 'style') {
          const style = doc.createElement('style');
          style.textContent = node.textContent;
          doc.head.append(style);
          return;
        }
        const safe = safeTags.has(node.localName) || node.hasAttribute('data-swarm-gap');
        const output = safe ? doc.createElement(safeTags.has(node.localName) ? node.localName : 'div') : target;
        if (safe) {
          for (const attr of ['class','id','style','lang','dir','title','colspan','rowspan']) {
            if (node.hasAttribute(attr)) output.setAttribute(attr,node.getAttribute(attr));
          }
          if (node.hasAttribute('data-swarm-gap') && gaps.length < 12) mark(output,node.getAttribute('data-swarm-gap'),node.getAttribute('data-swarm-draft') ?? '');
          target.append(output);
        }
        for (const child of node.childNodes) copy(child,output);
      }
      for (const node of input.content.childNodes) copy(node,doc.body);
    } else {
      for (const line of content.split(/\r?\n/)) {
        const node = doc.createElement(/^#{1,3} /.test(line) ? 'h'+line.indexOf(' ') : 'p');
        node.textContent = line.replace(/^#{1,3} /,'');
        const gap = line.match(/^\s*(?:[-*]\s+)?TODO\s*:\s*(.*)$/i);
        if (gap && gaps.length < 12) {
          const [description,...draft] = gap[1].split('=>');
          mark(node,description,draft.join('=>').trim());
          node.textContent='TODO: '+description.trim();
        }
        doc.body.append(node);
      }
    }
    return {doc,gaps};
  }

  function open(name, content, isHTML) {
    source = parse(content,isHTML);
    el('file-name').textContent=name;
    el('overlay-clear').disabled=false;
    controls.disabled=false;
    preview.hidden=false;
    const drafts = el('overlay-drafts');
    drafts.replaceChildren();
    for (const gap of source.gaps) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      label.textContent = gap.description;
      input.type = 'text';
      input.placeholder = 'Temporary draft text';
      input.maxLength = 2000;
      input.value = gap.draft;
      input.addEventListener('input', () => {
        gap.draft = input.value;
        refresh();
      });
      label.append(input);
      drafts.append(label);
    }
    refresh();
  }

  function refresh() {
    const tasks = [];
    if (source && fill.checked) source.gaps.forEach((gap,i) => tasks.push({id:'gap-'+i,...gap}));
    if (source) fields.forEach((field,i) => {
      if (field.value) tasks.push({id:field.id,description:['Theme','Motion','Layout'][i],value:field.value});
    });
    const positioned = tasks.map((task,i) => {
      const angle = i*2.399963;
      const radius = .1+Math.sqrt(i)*.105;
      return {...task,x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};
    });
    signature=null;
    setOverlayTasks(positioned,render);
  }

  function render(tasks, assignments) {
    if (!source) return;
    const active = tasks.filter(task => assignments.has(task.id));
    const key = active.map(task=>task.id+':'+task.value).join('|');
    if (key === signature) return;
    signature=key;
    const doc=source.doc.cloneNode(true);
    const policy=doc.createElement('meta');
    policy.httpEquiv='Content-Security-Policy';
    policy.content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";
    doc.head.prepend(policy);
    const viewport=doc.createElement('meta');
    viewport.name='viewport'; viewport.content='width=device-width, initial-scale=1';
    doc.head.append(viewport);
    const css=[];
    for (const task of active) {
      if (task.id.startsWith('gap-')) {
        const node=doc.querySelector('[data-gap-index="'+task.id.slice(4)+'"]');
        const draft=doc.createElement(node.localName==='p' ? 'span' : 'p');
        draft.className='swarm-preview-draft';
        draft.textContent=task.draft.trim() || 'Temporary placeholder · '+task.description;
        if (node.localName==='p') node.replaceChildren(draft);
        else node.append(draft);
      } else if (task.id==='overlay-theme') {
        const [background,text,accent]=themes[task.value];
        css.push(`html,body{background:${background}!important;color:${text}!important} h1,h2,h3,mark{color:${accent}!important}`);
      } else if (task.id==='overlay-motion') {
        css.push(task.value==='still' ? '*,*::before,*::after{animation:none!important;transition:none!important}' :
          '@media(prefers-reduced-motion:no-preference){@keyframes swarm-drift{50%{translate:0 -4px}}section,article{animation:swarm-drift 3s ease-in-out infinite!important}section:nth-child(even),article:nth-child(even){animation-delay:-1.5s!important}}');
      } else if (task.id==='overlay-layout') {
        css.push(task.value==='grid' ?
          'body>main,body:not(:has(>main)){display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr));gap:1rem}main>header,body>header{grid-column:1/-1}section,article{padding:1rem;border:1px solid currentColor;border-radius:.65rem}' :
          'body>main,section,article{display:block!important; width:auto!important;max-width:42rem!important;margin-inline:auto!important;position:static!important;float:none!important;translate:none!important}');
      }
    }
    const defaults=doc.createElement('style');
    defaults.textContent='body{margin:0;padding:1.5rem;font:16px/1.55 system-ui,sans-serif;overflow-wrap:anywhere} h1,h2,h3{line-height:1.2}';
    doc.head.insertBefore(defaults,policy.nextSibling);
    const overlay=doc.createElement('style');
    overlay.textContent='.swarm-preview-draft{display:block;margin:.6em 0;padding:.65em;border:1px dashed currentColor;border-radius:.3em;font-style:italic}'+css.join('\n');
    doc.head.append(overlay);
    preview.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;
    status.textContent=tasks.length ? `${active.length} of ${tasks.length} overlay tasks assigned. Highlighted agents hold those tasks.` :
      'Original preview. Turn on an overlay or open a file with marked gaps.';
  }

  fields.forEach(field=>field.addEventListener('change',refresh));
  fill.addEventListener('change',refresh);
  el('overlay-demo').onclick=()=>{
    revision++;
    fileInput.value='';
    open('The Lantern Archive',demo,true);
  };
  el('overlay-clear').onclick=()=>{
    revision++;
    source=null;
    fileInput.value='';
    el('file-name').textContent='';
    el('overlay-clear').disabled=true;
    controls.disabled=true;
    el('overlay-drafts').replaceChildren();
    preview.hidden=true;
    preview.removeAttribute('srcdoc');
    status.textContent='Open a local file or try the sample.';
    refresh();
  };
  fileInput.onchange=async () => {
    const file=fileInput.files[0];
    if (!file) return;
    const request=++revision;
    if (!/\.(html?|txt|md)$/i.test(file.name) || file.size>250000) {
      status.textContent='Choose an HTML, plain-text, or Markdown file under 250 KB.';
      return;
    }
    try {
      const text=await file.text();
      if (request===revision) open(file.name,text,/\.html?$/i.test(file.name));
    } catch {
      if (request===revision) status.textContent='The selected file could not be read.';
    }
  };
})();

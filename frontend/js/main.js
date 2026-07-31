const $ = (id) => document.getElementById(id);

const elements = {
  dropZone: $('drop-zone'),
  fileInput: $('file-input'),
  fileInfo: $('file-info'),
  stepper: $('stepper'),
  progress: $('progress-section'),
  progressText: $('progress-text'),
  progressBar: $('progress-bar'),
  progressStep: $('progress-step'),
  error: $('error-section'),
  errorMessage: $('error-message'),
  dismissError: $('dismiss-error'),
  results: $('results-section'),
};

let currentFile = null;
let currentMode = 'A';
let currentData = null;
let requestId = 0;
let currentSummaryView = 'fields';

const btnModeA = $('btn-mode-a');
const btnModeB = $('btn-mode-b');

function setActiveMode(mode) {
  currentMode = mode;
  btnModeA.className = mode === 'A'
    ? 'mode-btn active px-4 py-2 text-xs font-semibold rounded-md bg-white text-primary shadow-sm'
    : 'mode-btn px-4 py-2 text-xs font-semibold rounded-md text-gray-600 hover:text-primary';
  btnModeB.className = mode === 'B'
    ? 'mode-btn active px-4 py-2 text-xs font-semibold rounded-md bg-white text-primary shadow-sm'
    : 'mode-btn px-4 py-2 text-xs font-semibold rounded-md text-gray-600 hover:text-primary';
  btnModeA.setAttribute('aria-pressed', mode === 'A');
  btnModeB.setAttribute('aria-pressed', mode === 'B');
  if (currentFile) submitFile(currentFile);
}

setActiveMode('A');

btnModeA.addEventListener('click', () => setActiveMode('A'));
btnModeB.addEventListener('click', () => setActiveMode('B'));

function setProgress(percent, text, step) {
  elements.progressBar.style.width = `${percent}%`;
  elements.progressText.textContent = text;
  if (step) elements.progressStep.textContent = step;
}

function showError(msg) {
  elements.errorMessage.textContent = msg;
  elements.error.classList.remove('hidden');
  elements.results.classList.add('hidden');
}

function hideError() {
  elements.error.classList.add('hidden');
}

function fmt(n) {
  if (n === 0) return '$0';
  let s;
  if (n < 0.0001) s = n.toFixed(8);
  else if (n < 0.01) s = n.toFixed(6);
  else s = n.toFixed(4);
  s = s.replace(/\.?0+$/, '');
  return `$${s}`;
}

function tokenBar(pct, label, color) {
  const w = Math.min(Math.max(pct, 2), 100);
  return `
    <div class="token-bar-track">
      <div class="token-bar-fill" style="width:${w}%;background:${color}" data-label="${label}"></div>
    </div>`;
}

function summaryCards(data) {
  const labels = {
    tenant: 'Inquilino',
    landlord: 'Propietario',
    start_date: 'Fecha de inicio',
    expiration_date: 'Fecha de vencimiento',
    monthly_rent: 'Alquiler mensual',
    deposit: 'Depósito / Fianza',
    penalty_clause: 'Cláusula de penalización',
    renewal: 'Renovación',
  };
  return Object.entries(labels).map(([key, label]) => `
    <div class="summary-field">
      <span class="summary-label">${label}</span>
      <span class="summary-value">${data.summary[key] || '\u2014'}</span>
    </div>`).join('');
}

function summaryMarkdown(data) {
  const labels = {
    tenant: 'Inquilino',
    landlord: 'Propietario',
    start_date: 'Fecha de inicio',
    expiration_date: 'Fecha de vencimiento',
    monthly_rent: 'Alquiler mensual',
    deposit: 'Depósito / Fianza',
    penalty_clause: 'Cláusula de penalización',
    renewal: 'Renovación',
  };
  const rows = Object.entries(labels).map(([key, label]) => {
    const val = (data.summary[key] || '—').replace(/\|/g, '\\|');
    return `<tr><td class="md-td-label">${escapeHtml(label)}</td><td class="md-td-value">${escapeHtml(val)}</td></tr>`;
  }).join('');

  const rawMd = Object.entries(labels).map(([key, label]) =>
    `| **${label}** | ${(data.summary[key] || '—').replace(/\|/g, '\\|')} |`
  ).join('\n');

  return `<div class="summary-md">
  <div class="md-table-wrap">
    <table class="md-table">
      <thead><tr><th>Campo</th><th>Valor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <details class="md-raw-toggle">
    <summary class="md-raw-summary">Ver Markdown sin formato</summary>
    <pre class="md-raw-pre"># Resumen del Contrato

| Campo | Valor |
|-------|-------|
${rawMd}
</pre>
    <div class="summary-md-actions">
      <button class="btn-icon" onclick="copyMarkdown(this)" aria-label="Copiar Markdown">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/>
        </svg>
        Copiar Markdown
      </button>
    </div>
  </details>
</div>`;
}

function summaryJSON(data) {
  const pretty = JSON.stringify(data.summary, null, 2);
  const lines = pretty.split('\n');
  const highlighted = lines.map((line, i) => {
    const num = String(i + 1).padStart(3, ' ');
    const colored = syntaxHighlightLine(line);
    return `<span class="jl"><span class="jl-num">${num}</span><span class="jl-code">${colored}</span></span>`;
  }).join('\n');
  return `<div class="summary-json">
<pre class="summary-json-pre"><code class="summary-json-code">${highlighted}</code></pre>
<div class="summary-json-actions">
  <button class="btn-icon" onclick="copyRawJSON(this)" aria-label="Copiar JSON">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/>
    </svg>
    Copiar JSON
  </button>
</div>
</div>`;
}

function syntaxHighlightLine(line) {
  const ent = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let out = '';
  let i = 0;
  const re = /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let last = 0;
  while (true) {
    const m = re.exec(line);
    if (!m) break;
    if (m.index > last) out += ent(line.slice(last, m.index));
    if (m[1]) {
      out += `<span class="j-key">${ent(m[1].slice(0, -1))}</span><span class="j-punct">:</span>`;
    } else if (m[2]) {
      out += `<span class="j-str">${ent(m[2])}</span>`;
    } else if (m[3]) {
      out += `<span class="j-bool">${ent(m[3])}</span>`;
    } else if (m[4]) {
      out += `<span class="j-num">${ent(m[4])}</span>`;
    }
    last = re.lastIndex;
  }
  if (last < line.length) out += ent(line.slice(last));
  return out || ent(line);
}

function copyRawJSON(btn) {
  if (!currentData || !currentData.summary) return;
  const text = JSON.stringify(currentData.summary, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg> Copiado';
    btn.classList.add('btn-copied');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('btn-copied'); }, 2000);
  }).catch(() => {});
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSummaryContent(data) {
  if (!data.summary || Object.keys(data.summary).length === 0) return summaryCards(data);
  switch (currentSummaryView) {
    case 'json': return summaryJSON(data);
    case 'markdown': return summaryMarkdown(data);
    default: return summaryCards(data);
  }
}

function switchSummaryView(view) {
  currentSummaryView = view;
  const container = $('summary-content');
  if (!container || !currentData) return;
  container.innerHTML = renderSummaryContent(currentData);
  document.querySelectorAll('.s-toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
}

function copyMarkdown(btn) {
  const pre = btn.closest('.summary-md')?.querySelector('.md-raw-pre');
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg> Copiado';
    btn.classList.add('btn-copied');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('btn-copied'); }, 2000);
  }).catch(() => {});
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.s-toggle-btn');
  if (btn) switchSummaryView(btn.dataset.view);
});

function updateStepper(completed, active) {
  elements.stepper.classList.remove('hidden');
  for (let i = 1; i <= 6; i++) {
    const item = elements.stepper.querySelector(`.stepper-item[data-step="${i}"]`);
    item.classList.remove('stepper-complete', 'stepper-active');
    if (i <= completed) {
      item.classList.add('stepper-complete');
    } else if (i === active) {
      item.classList.add('stepper-active');
    }
  }
  const connectors = elements.stepper.querySelectorAll('.stepper-connector');
  connectors.forEach((conn, idx) => {
    conn.classList.toggle('connector-done', idx < completed);
  });
}

function buildResultsUI(data) {
  currentData = data;
  const isB = currentMode === 'B' && data.summary_tokens > 0;
  const reduction = isB ? data.reduction_percentage : 0;
  const origW = 100;
  const summW = isB ? Math.max((data.summary_tokens / data.original_tokens) * 100, 2) : 0;
  return `
    <div class="result-card bg-white rounded-2xl shadow-sm border border-border p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-heading font-semibold text-lg text-primary flex items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
          </svg>
          Información del Documento
        </h2>
        <span class="badge badge-blue">${data.pages} página${data.pages !== 1 ? 's' : ''}</span>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${card('Páginas', data.pages, 'file-text', '#EFF6FF')}
        ${card('Caracteres', data.characters.toLocaleString(), 'text-cursor', '#F5F3FF')}
        ${card('Palabras', data.words.toLocaleString(), 'book-open', '#F0FDF4')}
        ${card('Tokens', data.original_tokens.toLocaleString(), 'code', '#FFF7ED')}
      </div>
    </div>

    <div class="result-card bg-white rounded-2xl shadow-sm border border-border p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-heading font-semibold text-lg text-primary flex items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L12 21m0 0-4.5-4.5M12 21V7.5"/>
          </svg>
          Comparación de Tokens
        </h2>
        <span class="badge ${isB ? 'badge-green' : 'badge-blue'}">${isB ? `${reduction}% de reducción` : 'Solo original'}</span>
      </div>

      <div class="space-y-4 mb-6">
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="font-medium text-gray-700">Contrato Original</span>
            <span class="text-gray-500">${data.original_tokens.toLocaleString()} tokens</span>
          </div>
          ${tokenBar(origW, `${data.original_tokens.toLocaleString()} tok`, '#3B82F6')}
        </div>
        ${isB ? `
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="font-medium text-gray-700">Resumen IA (Inglés)</span>
            <span class="text-gray-500">${data.summary_tokens.toLocaleString()} tokens</span>
          </div>
          ${tokenBar(summW, `${data.summary_tokens.toLocaleString()} tok`, '#10B981')}
        </div>` : ''}
      </div>

      <div class="overflow-x-auto rounded-xl border border-border">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-muted">
              <th class="text-left py-3 px-4 font-medium text-gray-500">Métrica</th>
              <th class="text-right py-3 px-4 font-medium text-gray-500">Opción A: Completo</th>
              ${isB ? '<th class="text-right py-3 px-4 font-medium text-gray-500">Opción B: Resumen</th>' : ''}
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-border">
              <td class="py-3 px-4 font-medium">Tokens</td>
              <td class="py-3 px-4 text-right">${data.original_tokens.toLocaleString()}</td>
              ${isB ? `<td class="py-3 px-4 text-right">${data.summary_tokens.toLocaleString()}</td>` : ''}
            </tr>
            <tr class="border-t border-border">
              <td class="py-3 px-4 font-medium">Costo por consulta</td>
              <td class="py-3 px-4 text-right font-mono">${fmt(data.original_cost)}</td>
              ${isB ? `<td class="py-3 px-4 text-right font-mono">${fmt(data.summary_cost)}</td>` : ''}
            </tr>
            <tr class="border-t border-border">
              <td class="py-3 px-4 font-medium">Costo de pre-procesamiento</td>
              <td class="py-3 px-4 text-right font-mono text-gray-400">$0</td>
              ${isB ? `<td class="py-3 px-4 text-right font-mono">${fmt(data.preprocessing_cost)}</td>` : ''}
            </tr>
          </tbody>
        </table>
      </div>
      ${!isB ? `
      <div class="mt-4 bg-blue-50 rounded-xl p-3 border border-blue-200 text-center">
        <p class="text-sm text-blue-800">
          Cambiá a <strong>Modo B (Resumen IA)</strong> para ver la comparación de costos y el punto de equilibrio.
        </p>
      </div>` : ''}
    </div>

    ${isB ? `
    <div class="result-card bg-white rounded-2xl shadow-sm border border-border p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-heading font-semibold text-lg text-primary flex items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          Análisis de Costos
        </h2>
        <span class="badge badge-amber">Punto equilibrio: ${data.break_even} consultas</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${card('Ahorro / Consulta', fmt(data.money_saved), 'cash', '#F0FDF4', 'text-accent')}
        ${card('Ahorro', `${data.savings_percentage}%`, 'percent', '#F0FDF4', 'text-accent')}
        ${card('Punto de Equilibrio', `${data.break_even} consultas`, 'balance', '#FFFBEB')}
      </div>
      <div class="mt-5 bg-amber-50 rounded-xl p-4 border border-amber-200">
        <p class="text-sm text-amber-900">
          <strong>Interpretación:</strong> Después de <strong>${data.break_even}</strong> consultas,
          el resumen pre-procesado resulta más económico que enviar el contrato completo.
          Cada consulta ahorra <strong>${fmt(data.money_saved)}</strong> (${data.savings_percentage}% menos).
        </p>
      </div>
    </div>

    <div class="result-card bg-white rounded-2xl shadow-sm border border-border p-6">
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 class="font-heading font-semibold text-lg text-primary flex items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/>
          </svg>
          Resumen Estructurado
        </h2>
        <div class="flex items-center gap-2 flex-wrap">
          <div class="summary-view-toggle" role="group" aria-label="Vista del resumen">
            <button class="s-toggle-btn active" data-view="fields">Campos</button>
            <button class="s-toggle-btn" data-view="markdown">Markdown</button>
            <button class="s-toggle-btn" data-view="json">JSON</button>
          </div>
          <button class="btn-icon" onclick="copyJSON(this)" aria-label="Copiar JSON" title="Copiar JSON al portapapeles">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"/>
            </svg>
            Copiar
          </button>
          <button class="btn-icon" onclick="downloadJSON()" aria-label="Descargar JSON" title="Descargar JSON">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            Descargar
          </button>
        </div>
      </div>
      <div id="summary-content" class="summary-card">
        ${summaryCards(data)}
      </div>
    </div>
    ` : `
    <div class="result-card bg-white rounded-2xl shadow-sm border border-border p-6 text-center">
      <div class="py-6">
        <div class="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-primary/40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"/>
          </svg>
        </div>
        <h3 class="font-heading font-semibold text-primary text-lg mb-2">Opción A Seleccionada</h3>
        <p class="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Contrato completo medido: <strong>${data.original_tokens.toLocaleString()}</strong> tokens
          a <strong>${fmt(data.original_cost)}</strong> por consulta.
          Cambiá a <strong>Modo B (Resumen IA)</strong> arriba para ver el ahorro por compresión
          y la extracción estructurada en JSON.
        </p>
      </div>
    </div>
    `}
  `;
}

function card(label, value, icon, bg, cls = 'text-foreground') {
  const icons = {
    'file-text': 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
    'text-cursor': 'M11 4a2 2 0 1 1 4 0v1a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a2 2 0 1 0 0 4h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1a2 2 0 1 0-4 0v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H4a2 2 0 1 0 0 4H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a2 2 0 1 0 0-4H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 0 1-1V4a2 2 0 0 1 2-2Z',
    'book-open': 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
    'code': 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
    'cash': 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    'percent': 'M4.499 5.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm8.235 10.445a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06l7.5 7.5a.75.75 0 0 1 0 1.06Zm-3.235-3.95a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm8.235-4.995a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z',
    'balance': 'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z',
  };
  return `
    <div class="stat-card rounded-xl p-4 border border-border/50" style="background:${bg || '#F8FAFC'}">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">${label}</p>
          <p class="font-heading font-bold text-xl md:text-2xl mt-1 ${cls}">${value}</p>
        </div>
        <svg class="w-6 h-6 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="${icons[icon] || icons['file-text']}"/>
        </svg>
      </div>
    </div>`;
}

function handleFile(file) {
  if (!file) return;
  if (file.type !== 'application/pdf') {
    showError('Solo se admiten archivos PDF. Seleccioná un documento PDF.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showError('El archivo supera el tamaño máximo de 10 MB.');
    return;
  }
  currentFile = file;
  hideError();
  elements.fileInfo.classList.remove('hidden');
  const kb = (file.size / 1024).toFixed(1);
  elements.fileInfo.innerHTML = `<span class="file-pill">
    <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
    </svg>
    ${file.name}
    <span class="text-gray-400">(${kb} KB)</span>
  </span>`;
  updateStepper(1, 2);
  submitFile(file);
}

async function submitFile(file) {
  const id = ++requestId;
  elements.results.classList.add('hidden');
  elements.results.innerHTML = '';
  elements.error.classList.add('hidden');
  elements.progress.classList.remove('hidden');

  try {
    updateStepper(1, 2);
    const modeLabel = currentMode === 'B' ? 'Subiendo PDF y consultando IA...' : 'Subiendo y analizando PDF...';
    setProgress(15, modeLabel, 'Enviando al servidor');

    const data = await analyzeContract(file, currentMode);
    if (id !== requestId) return;

    updateStepper(2, 3);
    setProgress(45, 'Procesando respuesta...', 'Analizando resultados');
    await sleep(100);
    if (id !== requestId) return;

    setProgress(70, 'Construyendo vista...', 'Formateando');
    await sleep(100);
    if (id !== requestId) return;

    currentSummaryView = 'fields';
    setProgress(100, 'Análisis completado', 'Listo');
    const completed = currentMode === 'B' && data.summary_tokens > 0 ? 6 : 4;
    updateStepper(completed, 0);
    await sleep(350);
    if (id !== requestId) return;

    elements.progress.classList.add('hidden');
    elements.results.innerHTML = buildResultsUI(data);
    elements.results.classList.remove('hidden');
    elements.results.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    if (id !== requestId) return;
    elements.progress.classList.add('hidden');
    updateStepper(0, 0);
    elements.stepper.classList.add('hidden');
    showError(err.message || 'Error al analizar el contrato. Intentá nuevamente.');
  }
}

function copyJSON(btn) {
  if (!currentData || !currentData.summary) return;
  const text = JSON.stringify(currentData.summary, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg> Copiado';
    btn.classList.add('btn-copied');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('btn-copied'); }, 2000);
  }).catch(() => {});
}

function downloadJSON() {
  if (!currentData || !currentData.summary) return;
  const text = JSON.stringify(currentData.summary, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resumen_contrato.json';
  a.click();
  URL.revokeObjectURL(url);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

elements.dropZone.addEventListener('click', () => elements.fileInput.click());
elements.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); elements.dropZone.classList.add('drag-over'); });
elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('drag-over'));
elements.dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.dropZone.classList.remove('drag-over');
  elements.dropZone.classList.add('drop-success');
  setTimeout(() => elements.dropZone.classList.remove('drop-success'), 600);
  if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});
elements.fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    elements.dropZone.classList.add('drop-success');
    setTimeout(() => elements.dropZone.classList.remove('drop-success'), 600);
    handleFile(e.target.files[0]);
  }
});
elements.dismissError.addEventListener('click', hideError);

elements.dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    elements.fileInput.click();
  }
});

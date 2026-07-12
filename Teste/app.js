/* ==========================================================================
   app.js
   Orquestra views, formulário de gastos, filtros, e renderização
   de todos os painéis a partir dos dados em Storage.
   ========================================================================== */

(() => {
  const state = {
    mesRef: new Date(), // mês exibido no painel (donut/ticker)
    filtro: { busca: '', categoria: '', ordenar: 'data-desc' },
    editandoId: null
  };

  const categorias = () => Storage.getCategorias();
  const catPorId = (id) => categorias().find(c => c.id === id);

  /* ---------------- navegação entre views ---------------- */

  function irParaView(nome){
    document.querySelectorAll('.stub__btn').forEach(b => b.classList.toggle('is-active', b.dataset.view === nome));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('is-active', v.id === `view-${nome}`));
    if (nome === 'lancamentos') renderLancamentos();
    if (nome === 'categorias') renderCategorias();
    if (nome === 'painel') renderPainel();
  }

  document.querySelectorAll('.stub__btn').forEach(btn => {
    btn.addEventListener('click', () => irParaView(btn.dataset.view));
  });
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => irParaView(btn.dataset.goto));
  });

  /* ---------------- toast ---------------- */

  let toastTimer = null;
  function toast(msg){
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2400);
  }

  /* ---------------- modal de gasto ---------------- */

  const overlay = document.getElementById('modalOverlay');
  const form = document.getElementById('formGasto');
  const selCategoria = document.getElementById('fCategoria');

  function popularSelectCategorias(select, comTodas){
    select.innerHTML = (comTodas ? '<option value="">Todas as categorias</option>' : '') +
      categorias().map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  }

  function abrirModal(gastoExistente){
    popularSelectCategorias(selCategoria, false);
    if (gastoExistente){
      state.editandoId = gastoExistente.id;
      document.getElementById('modalTitle').textContent = 'Editar gasto';
      document.getElementById('fDescricao').value = gastoExistente.descricao;
      document.getElementById('fValor').value = gastoExistente.valor;
      document.getElementById('fData').value = gastoExistente.data;
      document.getElementById('fCategoria').value = gastoExistente.categoria;
      document.getElementById('fPagamento').value = gastoExistente.pagamento;
    } else {
      state.editandoId = null;
      document.getElementById('modalTitle').textContent = 'Novo gasto';
      form.reset();
      document.getElementById('fData').value = hoje();
    }
    overlay.classList.add('is-open');
    document.getElementById('fDescricao').focus();
  }

  function fecharModal(){
    overlay.classList.remove('is-open');
  }

  document.getElementById('btnNovo').addEventListener('click', () => abrirModal(null));
  document.getElementById('btnFechar').addEventListener('click', fecharModal);
  document.getElementById('btnCancelar').addEventListener('click', fecharModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) fecharModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dados = {
      descricao: document.getElementById('fDescricao').value.trim(),
      valor: parseFloat(document.getElementById('fValor').value),
      data: document.getElementById('fData').value,
      categoria: document.getElementById('fCategoria').value,
      pagamento: document.getElementById('fPagamento').value
    };
    if (!dados.descricao || !dados.valor || dados.valor <= 0) return;

    if (state.editandoId){
      Storage.updateGasto(state.editandoId, dados);
      toast('Gasto atualizado.');
    } else {
      Storage.addGasto(dados);
      toast('Gasto registrado.');
    }
    fecharModal();
    renderTudo();
  });

  /* ---------------- reset geral ---------------- */

  document.getElementById('btnReset').addEventListener('click', () => {
    if (confirm('Isso vai apagar todos os gastos, categorias e a renda salva. Continuar?')){
      Storage.limparTudo();
      toast('Dados limpos.');
      location.reload();
    }
  });

  /* ---------------- PAINEL ---------------- */

  document.getElementById('mesAnterior').addEventListener('click', () => {
    state.mesRef.setMonth(state.mesRef.getMonth() - 1);
    renderPainel();
  });
  document.getElementById('mesSeguinte').addEventListener('click', () => {
    state.mesRef.setMonth(state.mesRef.getMonth() + 1);
    renderPainel();
  });

  function gastosDoMes(ano, mes){
    return Storage.getGastos().filter(g => {
      const d = new Date(g.data + 'T00:00:00');
      return d.getFullYear() === ano && d.getMonth() === mes;
    });
  }

  function renderPainel(){
    const ano = state.mesRef.getFullYear();
    const mes = state.mesRef.getMonth();
    document.getElementById('mesAtualLabel').textContent =
      nomeMes(ano, mes).replace(/^\w/, c => c.toUpperCase());

    const gastosMes = gastosDoMes(ano, mes);
    const total = gastosMes.reduce((s, g) => s + g.valor, 0);
    const renda = Storage.getRenda();
    const saldo = renda - total;

    // ticker
    const elSaldo = document.getElementById('statSaldo');
    elSaldo.textContent = fmtMoeda(saldo);
    elSaldo.classList.toggle('ticker__value--red', saldo < 0);
    elSaldo.classList.toggle('ticker__value', saldo >= 0);
    document.getElementById('statSaldoHint').textContent = renda > 0
      ? `renda de ${fmtMoeda(renda)} definida em Categorias`
      : 'defina uma renda mensal em Categorias';
    document.getElementById('statTotal').textContent = fmtMoeda(total);

    const dias = new Date(ano, mes + 1, 0).getDate();
    const hojeD = new Date();
    const diasPassados = (ano === hojeD.getFullYear() && mes === hojeD.getMonth()) ? hojeD.getDate() : dias;
    document.getElementById('statMedia').textContent = fmtMoeda(total / Math.max(diasPassados, 1));

    // por categoria
    const porCategoria = categorias().map(c => ({
      ...c,
      valor: gastosMes.filter(g => g.categoria === c.id).reduce((s, g) => s + g.valor, 0)
    })).sort((a, b) => b.valor - a.valor);

    const maior = porCategoria.find(c => c.valor > 0);
    document.getElementById('statMaiorCategoria').textContent = maior ? maior.nome : '—';

    Charts.desenharDonut(document.getElementById('donutChart'), porCategoria.map(c => ({ cor: c.cor, valor: c.valor })));
    document.getElementById('donutCenterValue').textContent = fmtMoedaCompacta(total);

    const legenda = document.getElementById('donutLegend');
    const comValor = porCategoria.filter(c => c.valor > 0);
    legenda.innerHTML = comValor.length ? comValor.map(c => `
      <li>
        <span class="dot" style="background:${c.cor}"></span>
        <span class="name">${c.nome}</span>
        <span class="val">${fmtMoeda(c.valor)}</span>
      </li>`).join('') : '<li class="empty">Nenhum gasto registrado neste mês.</li>';

    // tendência 6 meses
    const pontos = [];
    for (let i = 5; i >= 0; i--){
      const d = new Date(ano, mes - i, 1);
      const valor = gastosDoMes(d.getFullYear(), d.getMonth()).reduce((s, g) => s + g.valor, 0);
      pontos.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        valor,
        atual: i === 0
      });
    }
    Charts.desenharBarras(document.getElementById('barsChart'), pontos);

    // recentes (globais, não só do mês em foco)
    const recentes = [...Storage.getGastos()]
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 6);
    const recentList = document.getElementById('recentList');
    recentList.innerHTML = recentes.length ? recentes.map(g => {
      const c = catPorId(g.categoria) || {};
      return `
      <li>
        <span class="m-data">${fmtDataCurta(g.data)}</span>
        <span>${escapeHtml(g.descricao)}</span>
        <span class="m-cat"><span class="dot" style="width:6px;height:6px;border-radius:50%;background:${c.cor||'#8D97A3'};display:inline-block"></span>${c.nome||'—'}</span>
        <span class="m-valor">- ${fmtMoeda(g.valor)}</span>
      </li>`;
    }).join('') : '<li class="empty" style="border:none;padding:20px 0;">Nenhum lançamento ainda.</li>';
  }

  /* ---------------- LANÇAMENTOS ---------------- */

  const inputBusca = document.getElementById('searchInput');
  const selFiltroCategoria = document.getElementById('filterCategoria');
  const selOrdenar = document.getElementById('sortLancamentos');

  inputBusca.addEventListener('input', () => { state.filtro.busca = inputBusca.value.toLowerCase(); renderLancamentos(); });
  selFiltroCategoria.addEventListener('change', () => { state.filtro.categoria = selFiltroCategoria.value; renderLancamentos(); });
  selOrdenar.addEventListener('change', () => { state.filtro.ordenar = selOrdenar.value; renderLancamentos(); });

  function renderLancamentos(){
    popularSelectCategorias(selFiltroCategoria, true);
    selFiltroCategoria.value = state.filtro.categoria;

    let lista = Storage.getGastos().filter(g =>
      g.descricao.toLowerCase().includes(state.filtro.busca) &&
      (!state.filtro.categoria || g.categoria === state.filtro.categoria)
    );

    const [campo, direcao] = state.filtro.ordenar.split('-');
    lista.sort((a, b) => {
      let r = campo === 'data' ? a.data.localeCompare(b.data) : a.valor - b.valor;
      return direcao === 'asc' ? r : -r;
    });

    const corpo = document.getElementById('ledgerBody');
    const vazio = document.getElementById('emptyLancamentos');

    if (!lista.length){
      corpo.innerHTML = '';
      vazio.hidden = false;
      return;
    }
    vazio.hidden = true;

    corpo.innerHTML = lista.map(g => {
      const c = catPorId(g.categoria) || { nome: '—', cor: '#8D97A3', icone: 'outros' };
      return `
      <tr>
        <td class="td-data">${fmtDataCurta(g.data)}/${g.data.slice(2,4)}</td>
        <td>${escapeHtml(g.descricao)}</td>
        <td class="td-cat"><span class="cat-pill"><span class="dot" style="background:${c.cor}"></span>${c.nome}</span></td>
        <td>${g.pagamento || '—'}</td>
        <td class="td-valor">- ${fmtMoeda(g.valor)}</td>
        <td class="td-acoes">
          <button class="icon-btn" data-editar="${g.id}" title="Editar" aria-label="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4.5-1 10-10-3.5-3.5-10 10L4 20z"/><path d="M13 6.5L17.5 11"/></svg>
          </button>
          <button class="icon-btn danger" data-excluir="${g.id}" title="Excluir" aria-label="Excluir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0l1 12.5a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L17 7"/></svg>
          </button>
        </td>
      </tr>`;
    }).join('');

    corpo.querySelectorAll('[data-editar]').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = Storage.getGastos().find(x => x.id === btn.dataset.editar);
        if (g) abrirModal(g);
      });
    });
    corpo.querySelectorAll('[data-excluir]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Excluir este lançamento?')){
          Storage.deleteGasto(btn.dataset.excluir);
          toast('Lançamento excluído.');
          renderTudo();
        }
      });
    });
  }

  /* ---------------- CATEGORIAS ---------------- */

  const inputRenda = document.getElementById('rendaMensal');
  inputRenda.addEventListener('change', () => {
    Storage.setRenda(parseFloat(inputRenda.value) || 0);
    toast('Renda mensal atualizada.');
    renderPainel();
  });

  function renderCategorias(){
    inputRenda.value = Storage.getRenda() || '';

    const ano = new Date().getFullYear();
    const mes = new Date().getMonth();
    const gastosMes = gastosDoMes(ano, mes);

    const grid = document.getElementById('catGrid');
    grid.innerHTML = categorias().map(c => {
      const gasto = gastosMes.filter(g => g.categoria === c.id).reduce((s, g) => s + g.valor, 0);
      const orcamento = c.orcamento || 0;
      const pct = orcamento > 0 ? Math.min((gasto / orcamento) * 100, 100) : 0;
      return `
      <div class="cat-card" style="--cat-color:${c.cor}">
        <div class="cat-card__head">
          <div class="cat-card__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${CAT_ICONS[c.icone]||''}</svg></div>
          <span class="cat-card__name">${c.nome}</span>
        </div>
        <div class="cat-card__stat"><span>Gasto no mês</span><b>${fmtMoeda(gasto)}</b></div>
        <div class="cat-card__stat">
          <span>Orçamento</span>
          <b><input type="number" min="0" step="10" value="${orcamento}" data-orcamento="${c.id}"
             style="width:70px;background:transparent;border:none;color:inherit;font:inherit;text-align:right;outline:none;"></b>
        </div>
        <div class="cat-card__bar"><div class="cat-card__bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');

    grid.querySelectorAll('[data-orcamento]').forEach(inp => {
      inp.addEventListener('change', () => {
        Storage.updateOrcamento(inp.dataset.orcamento, parseFloat(inp.value) || 0);
        toast('Orçamento atualizado.');
        renderCategorias();
      });
    });
  }

  /* ---------------- utilidades ---------------- */

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderTudo(){
    renderPainel();
    renderLancamentos();
    renderCategorias();
  }

  /* ---------------- start ---------------- */

  renderTudo();
})();

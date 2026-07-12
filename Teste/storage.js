
const STORAGE_KEYS = {
  gastos: 'ag_gastos_v1',
  categorias: 'ag_categorias_v1',
  renda: 'ag_renda_v1'
};

// Ícones em SVG (linha, 24x24) — um por categoria
const CAT_ICONS = {
  alimentacao: '<path d="M6 3v7a2 2 0 0 0 2 2v9M9 3v6M12 3v6M17 3c-2 1-2.5 3-2.5 6 0 2 1 3 2.5 3v9"/>',
  transporte: '<path d="M4 16V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7"/><path d="M4 16h16"/><circle cx="7.5" cy="18.5" r="1.6"/><circle cx="16.5" cy="18.5" r="1.6"/><path d="M6 9l1.5-3.5h9L18 9"/>',
  moradia: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V10"/><path d="M10 20.5v-6h4v6"/>',
  lazer: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5h.01M14.5 9.5h.01M8.5 14a4.5 4.5 0 0 0 7 0"/>',
  saude: '<path d="M12 21s-7-4.35-9.5-9C.9 8.1 2.6 4.5 6 4c2-.3 3.7.8 6 3 2.3-2.2 4-3.3 6-3 3.4.5 5.1 4.1 3.5 8-2.5 4.65-9.5 9-9.5 9z"/>',
  educacao: '<path d="M2 8l10-4 10 4-10 4-10-4z"/><path d="M6 10.5v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/><path d="M22 8v6"/>',
  compras: '<path d="M6 8h12l-1 12.5a1 1 0 0 1-1 .5H8a1 1 0 0 1-1-.9L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  assinaturas: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9.5h18"/><path d="M7 13h4"/>',
  outros: '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>'
};

const CATEGORIAS_PADRAO = [
  { id: 'alimentacao', nome: 'Alimentação', cor: '#D1584E', icone: 'alimentacao', orcamento: 900 },
  { id: 'transporte', nome: 'Transporte', cor: '#C9A227', icone: 'transporte', orcamento: 350 },
  { id: 'moradia', nome: 'Moradia', cor: '#4F8FA9', icone: 'moradia', orcamento: 1500 },
  { id: 'lazer', nome: 'Lazer', cor: '#9B6FD1', icone: 'lazer', orcamento: 300 },
  { id: 'saude', nome: 'Saúde', cor: '#4FA97C', icone: 'saude', orcamento: 250 },
  { id: 'educacao', nome: 'Educação', cor: '#D18A4E', icone: 'educacao', orcamento: 200 },
  { id: 'compras', nome: 'Compras', cor: '#D1B04E', icone: 'compras', orcamento: 250 },
  { id: 'assinaturas', nome: 'Assinaturas', cor: '#7A8CD1', icone: 'assinaturas', orcamento: 120 },
  { id: 'outros', nome: 'Outros', cor: '#8D97A3', icone: 'outros', orcamento: 150 }
];

function hoje(offsetDias = 0){
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

function dataISO(ano, mes, dia){
  return `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
}

const SEED_GASTOS = (() => {
  const n = new Date();
  const itens = [
    ['Feira do mês', 214.30, 'alimentacao', 'Débito', -2],
    ['iFood - jantar', 58.90, 'alimentacao', 'Pix', -1],
    ['Combustível', 180.00, 'transporte', 'Crédito', -5],
    ['Aluguel', 1350.00, 'moradia', 'Boleto', -8],
    ['Academia', 99.90, 'saude', 'Pix', -6],
    ['Cinema', 64.00, 'lazer', 'Crédito', -3],
    ['Curso online', 79.00, 'educacao', 'Crédito', -10],
    ['Assinatura streaming', 39.90, 'assinaturas', 'Crédito', -12],
    ['Farmácia', 45.60, 'saude', 'Débito', -9],
    ['Uber', 27.50, 'transporte', 'Pix', -1],
    ['Roupas', 189.90, 'compras', 'Crédito', -14],
    ['Conta de luz', 162.40, 'moradia', 'Boleto', -18],
    ['Padaria', 32.10, 'alimentacao', 'Dinheiro', -6],
    ['Presente aniversário', 90.00, 'outros', 'Pix', -20]
  ];
  return itens.map(([descricao, valor, categoria, pagamento, offset], i) => ({
    id: `seed-${i}`,
    descricao, valor, categoria, pagamento,
    data: hoje(offset)
  }));
})();

const Storage = {
  getGastos(){
    const raw = localStorage.getItem(STORAGE_KEYS.gastos);
    if (!raw) {
      this.setGastos(SEED_GASTOS);
      return SEED_GASTOS;
    }
    try { return JSON.parse(raw); } catch { return []; }
  },
  setGastos(lista){
    localStorage.setItem(STORAGE_KEYS.gastos, JSON.stringify(lista));
  },
  addGasto(gasto){
    const lista = this.getGastos();
    gasto.id = 'g-' + Date.now() + '-' + Math.floor(Math.random()*1000);
    lista.push(gasto);
    this.setGastos(lista);
    return gasto;
  },
  updateGasto(id, dados){
    const lista = this.getGastos().map(g => g.id === id ? { ...g, ...dados, id } : g);
    this.setGastos(lista);
  },
  deleteGasto(id){
    const lista = this.getGastos().filter(g => g.id !== id);
    this.setGastos(lista);
  },

  getCategorias(){
    const raw = localStorage.getItem(STORAGE_KEYS.categorias);
    if (!raw) {
      this.setCategorias(CATEGORIAS_PADRAO);
      return CATEGORIAS_PADRAO;
    }
    try { return JSON.parse(raw); } catch { return CATEGORIAS_PADRAO; }
  },
  setCategorias(lista){
    localStorage.setItem(STORAGE_KEYS.categorias, JSON.stringify(lista));
  },
  updateOrcamento(id, orcamento){
    const lista = this.getCategorias().map(c => c.id === id ? { ...c, orcamento } : c);
    this.setCategorias(lista);
  },

  getRenda(){
    const v = localStorage.getItem(STORAGE_KEYS.renda);
    return v ? parseFloat(v) : 0;
  },
  setRenda(valor){
    localStorage.setItem(STORAGE_KEYS.renda, String(valor));
  },

  limparTudo(){
    localStorage.removeItem(STORAGE_KEYS.gastos);
    localStorage.removeItem(STORAGE_KEYS.categorias);
    localStorage.removeItem(STORAGE_KEYS.renda);
  }
};

/* ---------- utilidades de formatação ---------- */

const fmtMoeda = (valor) => {
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const fmtMoedaCompacta = (valor) => {
  const n = Number(valor) || 0;
  if (Math.abs(n) >= 1000) return 'R$ ' + (n/1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k';
  return fmtMoeda(n);
};

const fmtDataCurta = (iso) => {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
};

const nomeMes = (ano, mes) => {
  const d = new Date(ano, mes, 1);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

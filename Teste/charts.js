
const Charts = {

  /**
   * Desenha o donut de categorias dentro do <svg id="donutChart">
   * @param {SVGElement} svg
   * @param {Array<{cor:string, valor:number}>} fatias
   */
  desenharDonut(svg, fatias){
    const total = fatias.reduce((s, f) => s + f.valor, 0);
    const cx = 100, cy = 100, r = 78, espessura = 26;
    svg.innerHTML = '';

    // trilho de fundo
    const trilho = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    trilho.setAttribute('cx', cx);
    trilho.setAttribute('cy', cy);
    trilho.setAttribute('r', r);
    trilho.setAttribute('fill', 'none');
    trilho.setAttribute('stroke', '#212a34');
    trilho.setAttribute('stroke-width', espessura);
    svg.appendChild(trilho);

    if (total <= 0) return;

    const circunferencia = 2 * Math.PI * r;
    let acumulado = 0;

    fatias.forEach((f) => {
      if (f.valor <= 0) return;
      const fracao = f.valor / total;
      const comprimento = fracao * circunferencia;
      const gap = Math.max(circunferencia - comprimento, 0);

      const arco = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      arco.setAttribute('cx', cx);
      arco.setAttribute('cy', cy);
      arco.setAttribute('r', r);
      arco.setAttribute('fill', 'none');
      arco.setAttribute('stroke', f.cor);
      arco.setAttribute('stroke-width', espessura);
      arco.setAttribute('stroke-dasharray', `${comprimento} ${gap}`);
      arco.setAttribute('stroke-dashoffset', -acumulado);
      arco.setAttribute('stroke-linecap', fatias.filter(x=>x.valor>0).length > 1 ? 'butt' : 'round');
      arco.style.transition = 'stroke-dasharray 0.6s ease';
      svg.appendChild(arco);

      acumulado += comprimento;
    });
  },

  /**
   * Renderiza as barras de tendência mensal
   * @param {HTMLElement} container
   * @param {Array<{label:string, valor:number, atual:boolean}>} pontos
   */
  desenharBarras(container, pontos){
    const max = Math.max(...pontos.map(p => p.valor), 1);
    container.innerHTML = '';

    pontos.forEach(p => {
      const alturaPct = Math.max((p.valor / max) * 100, 2);

      const col = document.createElement('div');
      col.className = 'bar-col' + (p.atual ? ' is-current' : '');

      const valorEl = document.createElement('span');
      valorEl.className = 'bar-col__value';
      valorEl.textContent = fmtMoedaCompacta(p.valor);

      const barEl = document.createElement('div');
      barEl.className = 'bar-col__bar';
      barEl.style.height = '0%';

      const labelEl = document.createElement('span');
      labelEl.className = 'bar-col__label';
      labelEl.textContent = p.label;

      col.appendChild(valorEl);
      col.appendChild(barEl);
      col.appendChild(labelEl);
      container.appendChild(col);

      requestAnimationFrame(() => { barEl.style.height = alturaPct + '%'; });
    });
  }
};

/* =========================================================
   NOVERA ACADEMY — main.js
   Interações da landing + diagnóstico em 5 etapas
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     CONFIGURAÇÃO — ajuste estes valores antes de publicar
     --------------------------------------------------------- */
  const CONFIG = {
    // WhatsApp do comercial que recebe os leads, em base64.
    //
    // Por que não em texto puro: o repositório e este arquivo ficam expostos a
    // robôs que varrem código atrás de padrão de telefone por regex. Codificado,
    // eles não casam.
    //
    // O que isto NÃO é: segurança. O número é montado no navegador para virar o
    // link do wa.me — quem abrir o devtools vê. Serve só contra coleta automática.
    //
    // Para trocar, rode no console do navegador:  btoa('55DDDNUMERO')
    whatsappB64: 'NTU0ODk5ODM3NDIzMQ==',
    // Mensagem pré-preenchida do botão "Falar com a Novera"
    ofertaMsg: 'Quero falar sobre o meu plano na Novera.',
    // Supabase — destino dos leads.
    //
    // Estes valores estão AQUI, e não no .env, porque a página é estática: sem
    // build, nada lê .env em tempo de execução. Se um dia o projeto ganhar um
    // framework, migre para variáveis de ambiente e mantenha o .env em sincronia.
    //
    // A chave publishable é pública por natureza — ela vai para o navegador de
    // todo visitante. Quem protege os dados é o RLS da tabela: a policy permite
    // apenas INSERT, então ninguém consegue ler os leads com esta chave.
    supabase: {
      url: 'https://cnrdaxjglkxxlcultkjg.supabase.co',
      key: 'sb_publishable_BycmRclN5gLTUoTgueG5HA_YMdZmT7B',
      tabela: 'leads'
    },

    // Endpoint alternativo (Formspree, n8n, API própria). Se preenchido, o lead
    // é enviado para cá EM VEZ do Supabase.
    endpoint: null,
    // Chave usada no localStorage
    storageKey: 'novera:diagnostico'
  };

  /* Número montado em memória, só na hora de gerar o link */
  const WHATSAPP = (function () {
    try { return atob(CONFIG.whatsappB64); }
    catch (_) { return ''; }   // base64 inválido: link sai vazio em vez de quebrar a página
  })();

  /* Vídeo(s) de fundo do hero, sem áudio. Com um item o clipe entra em loop
     nativo; com vários, tocam em sequência e reiniciam do primeiro. */
  const VIDEOS = [
    'hero-bg.mp4'
  ].map((f) => 'assets/video/' + f);

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. NAV — estado "grudado" ao rolar
     ========================================================= */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-stuck', window.scrollY > 40);
  onScrollNav();

  /* =========================================================
     1b. VÍDEO DE FUNDO DO HERO — sequência contínua e muda
     ========================================================= */
  (function heroVideo() {
    const video = $('#heroVideo');
    if (!video || !VIDEOS.length) return;

    // Em "economizar dados" ou "menos movimento" fica só o poster.
    const saveData = navigator.connection && navigator.connection.saveData;
    if (saveData || reduceMotion) return;

    let index = 0;
    let prefetchLink = null;

    // Com um único clipe o loop é nativo: sem recarregar o arquivo a cada volta,
    // a emenda fica invisível. Com vários, o loop é feito pelo evento 'ended'.
    const single = VIDEOS.length === 1;
    video.loop = single;

    // Aquece o cache do próximo clipe enquanto o atual toca, para a troca
    // não ter buraco. rel=prefetch busca em prioridade baixa e não compete
    // com o vídeo que está tocando agora.
    function preloadNext() {
      if (single) return;
      const next = VIDEOS[(index + 1) % VIDEOS.length];
      if (!prefetchLink) {
        prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.as = 'video';
        document.head.appendChild(prefetchLink);
      }
      prefetchLink.href = next;
    }

    function play(i) {
      index = i;
      video.src = VIDEOS[index];
      video.load();
      const p = video.play();
      if (p && p.catch) {
        // Autoplay bloqueado (política do navegador): mantém o poster.
        p.catch(() => { video.classList.remove('is-ready'); });
      }
    }

    video.addEventListener('playing', () => {
      video.classList.add('is-ready');
      preloadNext();
    });

    // Fim de um clipe → próximo; depois do último, volta ao primeiro.
    // (com clipe único o 'ended' nem dispara, porque o loop é nativo)
    video.addEventListener('ended', () => {
      if (!single) play((index + 1) % VIDEOS.length);
    });

    // Se um arquivo faltar ou falhar, pula para o seguinte em vez de travar.
    video.addEventListener('error', () => {
      if (VIDEOS.length > 1) play((index + 1) % VIDEOS.length);
    });

    play(0);
  })();

  /* =========================================================
     2. SCROLL REVEAL — reaparece ao subir e ao descer,
        mantendo a coesão visual entre as seções
     ========================================================= */
  const revealItems = $$('[data-reveal]');

  // Escalona os elementos irmãos para entrarem em cascata
  revealItems.forEach((el) => {
    const siblings = Array.from(el.parentElement.children).filter((n) => n.hasAttribute('data-reveal'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty('--delay', Math.min(idx, 5) * 90 + 'ms');
  });

  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Alterna nos dois sentidos: descer revela, subir "recolhe" suavemente
        entry.target.classList.toggle('is-in', entry.isIntersecting);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    revealItems.forEach((el) => revealObs.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('is-in'));
  }

  /* =========================================================
     3. PARALLAX — deslocamento suave por rAF (sem jank)
     ========================================================= */
  const parallaxItems = $$('[data-parallax]').map((el) => ({
    el,
    speed: parseFloat(el.dataset.parallax) || 0
  }));

  let ticking = false;

  function renderFrame() {
    ticking = false;
    onScrollNav();
    updateCtaBar();

    if (reduceMotion) return;

    const vh = window.innerHeight;
    for (const item of parallaxItems) {
      const rect = item.el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue;   // fora da tela: pula
      const center = rect.top + rect.height / 2 - vh / 2;
      const offset = -center * item.speed;
      item.el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    }
  }

  function requestFrame() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(renderFrame);
    }
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame, { passive: true });
  // A 1ª chamada fica depois de 3b: renderFrame() usa ctaBar/finalSection,
  // que são const declarados lá abaixo (não podem ser lidos antes).

  /* =========================================================
     3b. BARRA FIXA DE CTA
     ========================================================= */
  const ctaBar = $('#ctaBar');
  const finalSection = $('.final');

  function updateCtaBar() {
    if (!ctaBar) return;
    // Aberto o diagnóstico, a barra sai do caminho.
    if (!$('#quiz').hidden) { ctaBar.classList.remove('is-up'); return; }

    const passouHero = window.scrollY > window.innerHeight * 0.75;
    // No CTA final o botão grande já está visível: barra redundante, some.
    const noFinal = finalSection
      ? finalSection.getBoundingClientRect().top < window.innerHeight * 0.85
      : false;

    ctaBar.classList.toggle('is-up', passouHero && !noFinal);
  }

  renderFrame();   // primeira pintura, já com ctaBar disponível

  /* =========================================================
     4. CONTADORES ANIMADOS
     ========================================================= */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countObs.unobserve(entry.target);
        const el     = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const write  = (n) => { el.textContent = prefix + n + suffix; };

        if (reduceMotion) { write(target); return; }

        const duration = 1400;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          write(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => countObs.observe(el));
  }

  /* =========================================================
     5. ANO NO RODAPÉ
     ========================================================= */
  const anoEl = $('#ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  /* =========================================================
     6. DIAGNÓSTICO — máquina de estados
     ========================================================= */
  const modal    = $('#quiz');
  const panel    = $('.modal__panel', modal);
  const steps    = $$('.step', modal);
  const bar      = $('#progressBar');
  const label    = $('#progressLabel');
  const btnNext  = $('#btnNext');
  const btnBack  = $('#btnBack');
  const foot     = $('#quizFoot');
  const progress = $('.progress', modal);
  const agenda   = $('#agenda');
  const leadForm = $('#leadForm');

  const TOTAL_QUESTIONS = 5;   // etapas exibidas na barra de progresso
  const LAST_STEP = 6;         // etapa 6 = dados de contato

  const answers = {};
  let current = 1;
  let lastFocused = null;
  let concluiu = false;   // já chegou ao relatório nesta visita?

  /* ---------- Abrir / fechar ---------- */
  function openQuiz() {
    lastFocused = document.activeElement;

    // Quem já concluiu e clica no CTA de novo quer refazer o
    // diagnóstico. Uso a flag, e não `current === 'done'`: quem concluiu e
    // clicou em "Voltar" antes de fechar tem current = 6, e reabria no
    // formulário de contato preenchido em vez de recomeçar.
    if (concluiu) {
      Object.keys(answers).forEach((k) => { delete answers[k]; });
      // a seleção é marcada por aria-checked, não por classe
      $$('.opt', modal).forEach((o) => o.setAttribute('aria-checked', 'false'));
      if (agenda) agenda.hidden = true;
      leadForm.reset();   // só nome/e-mail/telefone: a data fica na etapa 5
      current = 1;
      concluiu = false;
    }

    modal.hidden = false;
    document.body.classList.add('is-locked');
    updateCtaBar();
    goTo(current, 'forward', true);
    window.setTimeout(() => {
      const first = $('.step.is-active .opt, .step.is-active input', modal);
      if (first) first.focus();
    }, 120);
  }

  function closeQuiz() {
    modal.hidden = true;
    document.body.classList.remove('is-locked');
    updateCtaBar();
    if (lastFocused) lastFocused.focus();
  }

  $$('[data-open-quiz]').forEach((b) => b.addEventListener('click', openQuiz));
  $$('[data-close-quiz]').forEach((b) => b.addEventListener('click', closeQuiz));

  /* ---------- Teclado: ESC e focus trap ---------- */
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;

    if (e.key === 'Escape') { closeQuiz(); return; }

    if (e.key === 'Tab') {
      const focusables = $$(
        'button:not([disabled]), input, a[href], select, textarea, [tabindex]:not([tabindex="-1"])',
        panel
      ).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Navegação por setas dentro do radiogroup ---------- */
  $$('.opts', modal).forEach((group) => {
    const opts = $$('.opt', group);
    group.addEventListener('keydown', (e) => {
      const idx = opts.indexOf(document.activeElement);
      if (idx === -1) return;
      let next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = opts[(idx + 1) % opts.length];
      if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  next = opts[(idx - 1 + opts.length) % opts.length];
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
  });

  /* ---------- Seleção de opção ---------- */
  $$('.opt', modal).forEach((opt) => {
    opt.addEventListener('click', () => {
      const step = opt.closest('.step');
      const key  = step.dataset.key;

      $$('.opt', step).forEach((o) => o.setAttribute('aria-checked', 'false'));
      opt.setAttribute('aria-checked', 'true');
      answers[key] = opt.dataset.value;

      // Campo condicional de data/hora (etapa 5)
      if (step.dataset.step === '5') {
        const wantsSchedule = opt.dataset.reveals === 'agenda';
        agenda.hidden = !wantsSchedule;
        if (wantsSchedule) {
          // Os campos já vêm preenchidos: registra o padrão para que
          // quem aceitar a sugestão não fique sem horário salvo.
          answers.data = $('#agendaData').value;
          answers.hora = $('#agendaHora').value;
          window.setTimeout(() => $('#agendaData').focus(), 180);
        } else {
          delete answers.data;
          delete answers.hora;
        }
      }

      // Sem avanço automático: a opção só habilita o "Continuar".
      // Quem clica decide a hora de seguir — e pode trocar de ideia antes.
      btnNext.disabled = false;
      save();
    });
  });

  /* ---------- Agendamento: só dias úteis, das 09h às 20h ----------
     O <input type="date"> não sabe desabilitar sábado e domingo, então a
     regra é aplicada aqui: a data sugerida já cai num dia útil, e escolher
     fim de semana avisa e empurra para a segunda seguinte. */
  const dataInput = $('#agendaData');
  const horaInput = $('#agendaHora');

  const HORA_MIN = '09:00';
  const HORA_MAX = '20:00';

  const paraISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const deISO   = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };
  const fimDeSemana = (d) => d.getDay() === 0 || d.getDay() === 6;

  // Devolve a própria data se for dia útil; senão, a segunda-feira seguinte.
  function proximoDiaUtil(d) {
    const r = new Date(d);
    while (fimDeSemana(r)) r.setDate(r.getDate() + 1);
    return r;
  }

  if (dataInput && horaInput) {
    const primeiroUtil = proximoDiaUtil(new Date());
    dataInput.min   = paraISO(new Date());
    dataInput.value = paraISO(primeiroUtil);
    horaInput.min   = HORA_MIN;
    horaInput.max   = HORA_MAX;

    const aviso = $('#agendaAviso');
    function mostrarAviso(texto) {
      if (!aviso) return;
      aviso.textContent = texto || '';
      aviso.hidden = !texto;
    }

    dataInput.addEventListener('change', () => {
      if (!dataInput.value) return;
      const escolhida = deISO(dataInput.value);

      if (fimDeSemana(escolhida)) {
        const corrigida = proximoDiaUtil(escolhida);
        dataInput.value = paraISO(corrigida);
        const dia = escolhida.getDay() === 6 ? 'sábado' : 'domingo';
        mostrarAviso(`Não atendemos ${dia}. Agendamos para ${corrigida.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}.`);
      } else {
        mostrarAviso('');
      }

      answers.data = dataInput.value;
      save();
    });

    // Guardar o valor pode ser no 'change'; CORRIGIR não pode.
    // Em campo de hora o 'change' dispara a cada segmento digitado: ao teclar
    // o primeiro dígito de "14:30" o valor passa por 01:00, cai fora da janela
    // e era corrigido para 09:00 no meio da digitação. A correção foi para o
    // 'blur', quando a pessoa terminou de digitar.
    horaInput.addEventListener('change', () => {
      answers.hora = horaInput.value;
      save();
    });

    horaInput.addEventListener('blur', () => {
      if (!horaInput.value) return;

      if (horaInput.value < HORA_MIN || horaInput.value > HORA_MAX) {
        horaInput.value = horaInput.value < HORA_MIN ? HORA_MIN : HORA_MAX;
        mostrarAviso(`Atendemos das ${HORA_MIN} às ${HORA_MAX}. Ajustamos para ${horaInput.value}.`);
        answers.hora = horaInput.value;
        save();
      } else {
        mostrarAviso('');
      }
    });
  }

  /* ---------- Troca de etapa ---------- */
  function goTo(target, direction, silent) {
    const from = $('.step.is-active', modal);
    const to = steps.find((s) => s.dataset.step === String(target));
    if (!to) return;

    if (from && from !== to) {
      from.classList.remove('is-active', 'step--back');
      from.hidden = true;
    }

    to.hidden = false;
    to.classList.toggle('step--back', direction === 'back');
    to.classList.add('is-active');

    current = target;
    updateChrome();

    if (!silent) {
      $('.modal__body', modal).scrollTop = 0;
      const focusTarget = $('.opt, input', to);
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    }
  }

  function updateChrome() {
    const isDone = current === 'done';
    const step = isDone ? TOTAL_QUESTIONS : Math.min(current, TOTAL_QUESTIONS);

    bar.style.width = (isDone ? 100 : (step / TOTAL_QUESTIONS) * 100) + '%';
    progress.setAttribute('aria-valuenow', step);

    if (isDone) label.textContent = 'Diagnóstico concluído';
    else if (current === LAST_STEP) label.textContent = 'Últimos dados';
    else label.textContent = `Pergunta ${current} de ${TOTAL_QUESTIONS}`;

    // O rodapé aparece em todas as etapas — inclusive na tela final,
    // onde sobra só o "Voltar" para o usuário poder retroceder.
    foot.hidden = false;
    progress.style.display = isDone ? 'none' : '';
    label.style.display    = isDone ? 'none' : '';

    // Voltar: some só na primeira pergunta (não há para onde voltar).
    btnBack.hidden = current === 1;
    // Continuar: some na tela final e na etapa de contato,
    // que tem o próprio botão de envio dentro do formulário.
    btnNext.hidden = isDone || current === LAST_STEP;

    if (btnNext.hidden) return;

    const key = steps.find((s) => s.dataset.step === String(current)).dataset.key;
    btnNext.disabled = !answers[key];
    btnNext.firstChild.nodeValue = current === TOTAL_QUESTIONS ? 'Finalizar ' : 'Continuar ';
  }

  btnNext.addEventListener('click', () => {
    if (btnNext.disabled) return;
    goTo(current + 1, 'forward');
  });

  btnBack.addEventListener('click', () => {
    // Da tela final, volta para a etapa de contato
    if (current === 'done') { goTo(LAST_STEP, 'back'); return; }
    if (current > 1) goTo(current - 1, 'back');
  });

  /* =========================================================
     7. FORMULÁRIO DE CONTATO
     ========================================================= */
  const foneInput = $('#leadFone');
  if (foneInput) {
    foneInput.addEventListener('input', (e) => {
      const d = e.target.value.replace(/\D/g, '').slice(0, 11);
      // O bloco do meio muda de tamanho conforme o número:
      // celular tem 11 dígitos → (11) 98765-4321  (5 no meio)
      // fixo tem 10           → (48) 3333-4444    (4 no meio)
      // Antes o corte era fixo em 5 e o de 10 dígitos saía como (48) 99991-111.
      let out = '';
      if (d.length > 10)      out = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
      else if (d.length > 6)  out = `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
      else if (d.length > 2)  out = `(${d.slice(0,2)}) ${d.slice(2)}`;
      else if (d.length > 0)  out = `(${d}`;
      e.target.value = out;
    });
  }

  function setError(input, msg) {
    const box = $(`[data-err="${input.name}"]`);
    if (box) box.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  leadForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome  = $('#leadNome');
    const email = $('#leadEmail');
    const fone  = $('#leadFone');

    const okNome  = setError(nome,  nome.value.trim().length < 3 ? 'Digite seu nome completo.' : '');
    const okMail  = setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? '' : 'Digite um e-mail válido.');
    const okFone  = setError(fone,  fone.value.replace(/\D/g, '').length >= 10 ? '' : 'Digite um WhatsApp com DDD.');

    if (!(okNome && okMail && okFone)) {
      const firstBad = $('[aria-invalid="true"]', leadForm);
      if (firstBad) firstBad.focus();
      return;
    }

    answers.nome     = nome.value.trim();
    answers.email    = email.value.trim();
    answers.telefone = fone.value.trim();

    // O WhatsApp abre ANTES de gravar, e não depois. Duas razões:
    // 1) só assim sabemos se o pop-up foi bloqueado a tempo de registrar isso
    //    junto com o lead — anon só tem INSERT, não dá para corrigir depois;
    // 2) quanto menos código roda antes do window.open, menor a chance de o
    //    navegador deixar de tratá-lo como resposta ao clique.
    const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagemWhatsApp())}`;

    // Sem 'noopener' na string de features DE PROPÓSITO: com ela, window.open
    // devolve null mesmo quando abre — é o que diz a especificação. Aí não dá
    // para distinguir "abriu" de "foi bloqueado".
    const aba = window.open(wa, '_blank');
    if (aba) {
      try { aba.opener = null; } catch (_) { /* cross-origin: segue o jogo */ }
    }

    // false = o WhatsApp nem apareceu para a pessoa: perda certa, e é o que
    // este campo serve para revelar. true não garante que ela enviou — depois
    // que o app abre, o site perde toda visibilidade.
    answers.whatsappAbriu = !!aba;

    save();
    send();

    if (aba) { finish(); return; }

    // Pop-up bloqueado. Como a tela de aviso não tem mais botão de WhatsApp,
    // sem este resgate a pessoa ficaria sem caminho até a conversa. O send()
    // usa keepalive, então a gravação sobrevive à saída da página.
    window.location.href = wa;
  });

  /* =========================================================
     8. PERSISTÊNCIA E ENVIO
     ========================================================= */
  function payload() {
    return Object.assign({}, answers, {
      enviadoEm: new Date().toISOString(),
      origem: window.location.href,
      referrer: document.referrer || null
    });
  }

  function save() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(payload()));
    } catch (_) { /* modo privado / storage cheio: segue sem persistir */ }
  }

  /* O front usa camelCase e nomes curtos; a tabela usa snake_case.
     Esta função é o contrato entre os dois — se mudar coluna no banco,
     mude aqui também. */
  function linhaSupabase() {
    const p = payload();
    return {
      nome:        p.nome,
      email:       p.email,
      telefone:    p.telefone,
      objetivo:    p.objetivo    || null,
      nivel:       p.nivel       || null,
      dificuldade: p.dificuldade || null,
      prazo:       p.prazo       || null,
      conversa:    p.conversa    || null,
      agenda_data: p.data        || null,
      agenda_hora: p.hora        || null,
      whatsapp_abriu: typeof p.whatsappAbriu === 'boolean' ? p.whatsappAbriu : null,
      enviado_em:  p.enviadoEm,
      origem:      p.origem,
      referrer:    p.referrer
    };
  }

  function send() {
    // Endpoint próprio, se configurado, tem prioridade sobre o Supabase
    if (CONFIG.endpoint) { enviarParaEndpoint(); return; }

    const sb = CONFIG.supabase;
    if (!sb || !sb.url || !sb.key) return;

    // Por que não sendBeacon aqui: ele não permite definir cabeçalhos, e o
    // Supabase exige apikey + Authorization. Além disso o Content-Type json
    // dispararia um preflight de CORS que o beacon não sabe executar — ele
    // retornaria true e a requisição morreria calada. fetch com keepalive
    // sobrevive à saída da página do mesmo jeito.
    fetch(sb.url + '/rest/v1/' + sb.tabela, {
      method: 'POST',
      headers: {
        'apikey': sb.key,
        'Authorization': 'Bearer ' + sb.key,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(linhaSupabase()),
      keepalive: true
    })
      .then(function (r) {
        if (r.ok) return null;
        return r.text().then(function (t) { throw new Error(r.status + ' — ' + t); });
      })
      .catch(function (e) {
        // Falhar em silêncio esconderia perda de lead. O dado continua no
        // localStorage do visitante, mas o negócio precisa saber que falhou.
        console.error('[novera] não consegui gravar o lead no Supabase:', e.message);
      });
  }

  function enviarParaEndpoint() {
    const body = JSON.stringify(payload());
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(CONFIG.endpoint, new Blob([body], { type: 'application/json' }));
      if (ok) return;
    }
    fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(function () { /* lead já está no localStorage */ });
  }

  /* =========================================================
     9. AVISO DE CONTATO
     Uma frase só, ajustada ao que a pessoa respondeu sobre a conversa.
     (A lista de próximos passos e a recomendação de plano saíram: a tela
     final agora é aviso de envio, não relatório.)
     ========================================================= */
  function avisoDeContato() {
    const quando = formatarQuando();

    if (answers.conversa === 'Sim, mas preciso escolher um horário' && quando) {
      return `Sua conversa está reservada para ${quando}. A equipe da Novera Academy confirma o horário pelo WhatsApp.`;
    }
    if (answers.conversa === 'Sim, quero agendar') {
      return 'A equipe da Novera Academy entra em contato pelo WhatsApp para combinar o melhor horário.';
    }
    return 'A equipe da Novera Academy vai entrar em contato pelo WhatsApp.';
  }

  /* Mensagem que o lead leva ao WhatsApp do comercial.
     Carrega o diagnóstico inteiro para o vendedor abrir a conversa já sabendo
     quem é a pessoa e o que ela quer — sem precisar consultar o banco.
     Os *asteriscos* viram negrito no WhatsApp.
     Usada nos DOIS caminhos: no envio do formulário e no botão da tela final. */
  function mensagemWhatsApp() {
    const quando = formatarQuando();

    return [
      `Olá! Sou *${answers.nome || 'um interessado'}* e acabei de fazer o diagnóstico no site da Novera Academy.`,
      '',
      '*MEU DIAGNÓSTICO*',
      `• Objetivo: ${answers.objetivo || '-'}`,
      `• Nível atual: ${answers.nivel || '-'}`,
      `• Maior dificuldade: ${answers.dificuldade || '-'}`,
      `• Quero começar: ${answers.prazo || '-'}`,
      answers.conversa ? `• Conversa inicial: ${answers.conversa}` : null,
      quando ? `• Horário escolhido: ${quando}` : null,
      '',
      '*MEUS DADOS*',
      `• E-mail: ${answers.email || '-'}`,
      `• WhatsApp: ${answers.telefone || '-'}`,
      '',
      CONFIG.ofertaMsg
    ].filter((linha) => linha !== null).join('\n');
  }

  function formatarQuando() {
    if (!answers.data) return null;
    const [a, m, d] = answers.data.split('-');
    const hora = answers.hora || '10:00';
    const dt = new Date(Number(a), Number(m) - 1, Number(d));
    const semana = dt.toLocaleDateString('pt-BR', { weekday: 'long' });
    return `${semana}, ${d}/${m} às ${hora}`;
  }

  /* =========================================================
     10. TELA DE AVISO
     ========================================================= */
  function finish() {
    const primeiroNome = (answers.nome || '').split(' ')[0];

    $('#doneTitle').textContent = primeiroNome
      ? `${primeiroNome}, diagnóstico realizado!`
      : 'Diagnóstico realizado!';

    $('#doneMsg').textContent     = 'Recebemos as suas respostas.';
    $('#doneContato').textContent = avisoDeContato();

    concluiu = true;
    goTo('done', 'forward');

    // Ponto de integração com analytics (GA4, Meta Pixel, etc.)
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({ event: 'novera_lead', objetivo: answers.objetivo, nivel: answers.nivel });
    }
  }

  /* ---------- 'done' precisa existir no seletor de etapas ---------- */
  // (a etapa final usa data-step="done", já tratada em goTo)
})();

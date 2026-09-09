import { TEACHER_PASSWORD_HASH, lessons } from './config.js';

const STORAGE_KEY = 'aula_ingles_progresso';
const WAITING_KEY = 'aula_ingles_waiting';

function renderLinks() {
  const container = document.getElementById('linkList');
  container.innerHTML = lessons.map((lesson, index) => {
    const num = index + 1;
    return `
      <a href="${lesson.href}" target="_blank"
        data-id="${lesson.id}" data-href="${lesson.href}"
        class="item group block text-left rounded-xl p-5 transition-all duration-300 relative overflow-hidden w-full no-underline">
        <div class="overlay absolute inset-0 opacity-0 transition-opacity pointer-events-none"></div>
        <div class="flex items-start gap-4 relative z-10">
          <div class="icon-box rounded-lg flex-shrink-0 w-12 h-12 flex items-center justify-center font-title-md text-title-md font-bold">${num}</div>
          <div class="flex-1">
            <h3 class="font-title-md text-title-md text-on-surface mb-1">${lesson.title}</h3>
            <p class="font-body-md text-body-md text-on-surface-variant text-sm">${lesson.description}</p>
          </div>
          <div class="status-area flex items-center justify-center flex-shrink-0 self-center min-w-[40px]"></div>
        </div>
      </a>
    `;
  }).join('');
}

renderLinks();
const links = Array.from(document.querySelectorAll('#linkList a'));
const progressBar = document.getElementById('progressBar');
const progressBadge = document.getElementById('progressBadge');
const progressText = document.getElementById('progressText');

// ---- Estilos visuais por estado ----
// next            = azul/ciano: proxima atividade a ser feita
// locked          = cinza: bloqueada ate concluir a anterior
// waiting_review  = amarelo: aguardando aprovacao da professora
// done            = verde: concluida
const ITEM_BASE = 'item group block text-left rounded-xl p-5 transition-all duration-300 relative overflow-hidden w-full no-underline';
const ITEM_CLASSES = {
  next: 'bg-surface shadow-[0_0_15px_rgba(5,211,248,0.15)] border-2 border-cyan-accent hover:shadow-[0_0_25px_rgba(5,211,248,0.25)] transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
  locked: 'bg-surface-container-low shadow-sm border border-border-muted opacity-70 cursor-not-allowed',
  waiting_review: 'bg-[#fffbeb] shadow-[0_0_15px_rgba(245,158,11,0.15)] border-2 border-[#f59e0b] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transform hover:-translate-y-1 cursor-pointer',
  done: 'bg-[#f2fbf6] shadow-sm border-2 border-[#27ae60] cursor-pointer'
};
const ICON_BASE = 'icon-box rounded-lg flex-shrink-0 w-12 h-12 flex items-center justify-center font-title-md text-title-md font-bold';
const ICON_CLASSES = {
  next: 'bg-gradient-to-br from-[#009ddd] to-[#05d3f8] text-white shadow-sm',
  locked: 'bg-surface-variant text-on-surface-variant',
  waiting_review: 'bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] text-white shadow-sm',
  done: 'bg-gradient-to-br from-[#27ae60] to-[#58d68d] text-white shadow-sm'
};

function getOpened() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

function setOpened(id, value) {
  const opened = getOpened();
  opened[id] = value;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(opened));
  updateUI();
}

function getWaiting() {
  try {
    const data = sessionStorage.getItem(WAITING_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

function setWaiting(id, value) {
  const waiting = getWaiting();
  if (value) {
    waiting[id] = true;
  } else {
    delete waiting[id];
  }
  sessionStorage.setItem(WAITING_KEY, JSON.stringify(waiting));
  updateUI();
}

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(input) {
  const inputHash = await sha256(input);
  return inputHash === TEACHER_PASSWORD_HASH;
}

function applyState(link, state) {
  const num = links.indexOf(link) + 1;
  link.dataset.state = state;

  link.className = ITEM_BASE + ' ' + ITEM_CLASSES[state];

  if (state === 'locked') {
    link.removeAttribute('href');
    link.removeAttribute('target');
  } else {
    const originalHref = link.getAttribute('data-href');
    if (originalHref && !link.getAttribute('href')) {
      link.setAttribute('href', originalHref);
      link.setAttribute('target', '_blank');
    }
  }

  // Overlay de hover (somente na proxima atividade)
  const overlay = link.querySelector('.overlay');
  overlay.className = 'overlay absolute inset-0 opacity-0 transition-opacity pointer-events-none' +
    (state === 'next' ? ' bg-gradient-to-r from-[#009ddd]/5 to-[#05d3f8]/10 group-hover:opacity-100' : '');

  // Caixa do numero/icone
  const iconBox = link.querySelector('.icon-box');
  iconBox.className = ICON_BASE + ' ' + ICON_CLASSES[state];
  if (state === 'done') {
    iconBox.innerHTML = '<span class="material-symbols-outlined material-fill">check</span>';
  } else if (state === 'waiting_review') {
    iconBox.innerHTML = '<span class="material-symbols-outlined material-fill">pending</span>';
  } else {
    iconBox.textContent = num;
  }

  // Area de status (lado direito)
  const status = link.querySelector('.status-area');
  if (state === 'next') {
    status.innerHTML = '<span class="font-title-md text-title-md text-cyan-accent font-bold">' + num + '</span>';
  } else if (state === 'locked') {
    status.innerHTML = '<span class="material-symbols-outlined text-on-surface-variant/50">lock</span>';
  } else if (state === 'waiting_review') {
    status.innerHTML = '<div class="inline-password relative flex flex-col items-end"><div class="flex items-center gap-1"><input type="password" class="pwd-input w-20 px-2 py-1 text-sm rounded border border-[#f59e0b] bg-white text-on-surface focus:outline-none focus:ring-1 focus:ring-[#f59e0b]" placeholder="Senha"><button class="pwd-submit flex items-center justify-center bg-[#f59e0b] hover:bg-[#d97706] text-white px-2 py-1 rounded text-sm font-semibold transition-all active:scale-95" style="height:28px;width:32px">OK</button></div><span class="pwd-error absolute top-full mt-1 text-error text-xs hidden font-label-sm whitespace-nowrap">Senha incorreta.</span></div>';
    const container = status.querySelector('.inline-password');
    const input = container.querySelector('.pwd-input');
    const btn = container.querySelector('.pwd-submit');
    const error = container.querySelector('.pwd-error');

    async function tryUnlock() {
      const val = input.value.trim();
      if (!val) return;
      input.disabled = true;
      btn.disabled = true;
      btn.textContent = '...';
      const isValid = await verifyPassword(val);
      if (!isValid) {
        error.classList.remove('hidden');
        btn.textContent = '3s';
        let remaining = 3;
        const countdown = setInterval(() => {
          remaining--;
          if (remaining > 0) {
            btn.textContent = remaining + 's';
          } else {
            clearInterval(countdown);
            input.disabled = false;
            btn.disabled = false;
            btn.textContent = 'OK';
            input.value = '';
            input.focus();
          }
        }, 1000);
        return;
      }
      error.classList.add('hidden');
      btn.textContent = '';
      btn.innerHTML = '<span class="material-symbols-outlined text-white flex items-center justify-center leading-none" style="font-size:16px">check</span>';
      btn.classList.replace('bg-[#f59e0b]', 'bg-[#27ae60]');
      btn.classList.replace('hover:bg-[#d97706]', 'hover:bg-[#1e8449]');
      setTimeout(() => {
        setOpened(link.getAttribute('data-id'), true);
      }, 600);
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      tryUnlock();
    });
    input.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        tryUnlock();
      }
    });
  } else {
    status.innerHTML = '<span class="material-symbols-outlined material-fill text-[#27ae60]" style="font-size:28px">check_circle</span>';
  }
}

function updateUI() {
  const opened = getOpened();
  const waiting = getWaiting();
  let count = 0;

  links.forEach(function (link, index) {
    const id = link.getAttribute('data-id');
    const isOpened = !!opened[id];
    const isWaiting = !!waiting[id];
    const isLocked = index > 0 && !opened[links[index - 1].getAttribute('data-id')];

    if (isOpened) count++;

    let state;
    if (isOpened) {
      state = 'done';
    } else if (isLocked) {
      state = 'locked';
    } else if (isWaiting) {
      state = 'waiting_review';
    } else {
      state = 'next';
    }

    applyState(link, state);
  });

  const total = links.length;
  const percent = total === 0 ? 0 : Math.round((count / total) * 100);
  progressBar.style.width = percent + '%';
  progressBadge.textContent = percent + '% Complete';

  if (percent === 100) {
    progressText.textContent = 'Lesson complete. Great job!';
    progressBadge.className = 'font-label-md text-label-md bg-[#27ae60] text-white px-3 py-1 rounded-full';
  } else if (percent === 0) {
    progressText.textContent = "Let's get started on your vocabulary exercise!";
    progressBadge.className = 'font-label-md text-label-md bg-secondary text-white px-3 py-1 rounded-full';
  } else {
    progressText.textContent = "Keep going, you're making progress!";
    progressBadge.className = 'font-label-md text-label-md bg-secondary text-white px-3 py-1 rounded-full';
  }
}

links.forEach(function (link) {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const state = link.dataset.state;
    const url = link.getAttribute('data-href');

    if (state === 'locked') {
      return;
    }
    if (state === 'done') {
      return;
    }
    if (state === 'waiting_review') {
      if (url) window.open(url, '_blank');
      return;
    }

    // state === 'next'
    if (url) window.open(url, '_blank');

    const id = link.getAttribute('data-id');
    setWaiting(id, true);
  });
});

// Inicializa
updateUI();

// Foca automaticamente no campo de senha ao voltar para a aba
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    const input = document.querySelector('.inline-password .pwd-input:not([disabled])');
    if (input) {
      input.focus();
    }
  }
});

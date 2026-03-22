import { ROOT_ADMINS, getRangoVisual } from './auth.js';

export function initMatrix() {
    const cv = document.getElementById('matrix-canvas');
    if(!cv) return;
    const cx = cv.getContext('2d');
    const chars = '01アイウエオカキクサシスセタチツナニヌ<>{}[]|/\\:;~%$#@!?ABCDEFあいうえ'.split('');
    let drops = [], W, H;
    function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; drops = Array.from({ length: Math.floor(W / 16) }, () => Math.random() * -50); }
    window.addEventListener('resize', resize); resize();
    function draw() {
        cx.fillStyle = 'rgba(2,10,2,0.045)'; cx.fillRect(0, 0, W, H);
        cx.font = '13px monospace';
        drops.forEach((y, i) => {
            cx.fillStyle = Math.random() > .97 ? '#fff' : '#00ff41';
            cx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, y * 16);
            if (y * 16 > H && Math.random() > .975) drops[i] = 0; else drops[i] += .7;
        });
    }
    return setInterval(draw, 50);
}

export function mostrarPantalla(id) {
    document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
    const target = document.getElementById(id);
    if(target) { target.style.display = 'flex'; target.classList.add('active'); }
}

export function openModal(id) {
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
}

export function closeModal(id) {
    const target = document.getElementById(id);
    if(target) {
        target.classList.remove('active');
        // Reset defaults
        if(id === 'modal-pista') {
            document.getElementById('pista-caja-revelada').style.display = 'none';
            document.getElementById('pista-botones').style.display = 'flex';
        }
    }
}

// Renderiza posts para el estudiante
export function renderStudentPosts(postsData, submissionsData, studentId) {
    const container = document.getElementById('student-posts-container');
    if(!container) return;
    container.innerHTML = '';
    
    // Solo activos
    const activePosts = postsData.filter(p => p.isActive);

    if (activePosts.length === 0) {
        container.innerHTML = '<p class="hint-line">// NINGUNA SEÑAL DETECTADA EN LOS RADARES.</p>';
        return;
    }

    activePosts.forEach(p => {
        // Checking if user already submitted
        const mySub = submissionsData.find(s => s.postId === p.id && s.studentId === studentId);
        let statusHtml = '';
        let btnHtml = '';

        if(mySub) {
            if(mySub.isGraded) {
                statusHtml = `<span style="color:var(--cyan);">[ EVALUADO: ${mySub.score} / ${p.maxPoints} pts ]</span>`;
            } else {
                statusHtml = `<span style="color:var(--amber);">[ TRANSMITIDO: EN AUDITORÍA ]</span>`;
            }
            btnHtml = `<button class="btn-full" disabled style="opacity:0.3; padding:5px; font-size:11px;">Misión Completada</button>`;
        } else {
            statusHtml = `<span style="color:var(--green);">[ ESTATUS: DISPONIBLE ]</span>`;
            btnHtml = `
            <div style="display:flex; gap:10px; margin-top:15px;">
                <button class="btn-full solve-btn" data-id="${p.id}" data-title="${p.title}" style="padding:8px; font-size:11px;">EJECUTAR RESOLUCIÓN</button>
                ${p.hint ? `<button class="btn-full hint-btn" data-id="${p.id}" data-hint="${p.hint}" style="border-color:var(--amber); color:var(--amber); padding:8px; width:auto; font-size:11px;">[ ? ]</button>` : ''}
            </div>`;
        }

        const div = document.createElement('div');
        div.className = 'dossier';
        div.style.padding = '5px 10px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:5px; margin-bottom:10px;">
                <span style="font-weight:bold;">${p.title} <span style="font-size:10px; color:var(--green-dim);">(${p.maxPoints} PTS MAX)</span></span>
                <span style="font-size:10px;">${statusHtml}</span>
            </div>
            <div style="font-size:12px; color:#ddd; line-height:1.6;">${p.body.replace(/\n/g, '<br>')}</div>
            ${p.deadline ? `<p style="font-size:10px; color:var(--amber); margin-top:8px;">DEADLINE: ${p.deadline}</p>` : ''}
            ${btnHtml}
        `;
        container.appendChild(div);
    });
}

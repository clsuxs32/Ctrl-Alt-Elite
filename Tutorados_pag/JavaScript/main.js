import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from './firebase-config.js';
import { ROOT_ADMINS, generarCodigo, getRangoVisual } from './auth.js';
import { initMatrix, mostrarPantalla, openModal, closeModal, renderStudentPosts } from './ui.js';
import { registrarEstudiante, enviarResolucionLocal } from './student.js';
import { adminAgregarUsuarioLocal, adminEliminarUsuarioLocal, adminGuardarPostLocal, adminEliminarPostLocal, calificarSubmisionLocal } from './admin.js';

const APP_STATE = {
    students: {}, codesMap: {}, posts: [], submissions: [],
    currentUserCode: null, currentUserId: null
};

// INICIALIZACIÓN
initMatrix();
const sid = document.getElementById('session-id');
if(sid) sid.textContent = Math.random().toString(16).slice(2, 10).toUpperCase();

// --- RENDERIZADO ADMIN LOCAL ---
function refreshAdminUI() {
    if(!document.getElementById('screen-admin').classList.contains('active')) return;
    
    // 1. Usuarios Table
    const tbody = document.getElementById('admin-users-table');
    if(tbody) {
        tbody.innerHTML = '';
        Object.keys(APP_STATE.students).forEach(cedula => {
            const st = APP_STATE.students[cedula];
            const rank = getRangoVisual(st.score || 0);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color:${rank.color}">${cedula}</strong><br><span style="font-size:9px;">${st.code || '---'}</span></td>
                <td>${st.subject || 'N/A'}<br><span style="color:var(--amber); font-size:10px;">${st.group || 'N/A'}</span></td>
                <td style="color:var(--cyan); font-weight:bold;">${st.score || 0}</td>
                <td><button class="del-user-btn" data-cedula="${cedula}" style="padding:2px 5px; font-size:9px; background:transparent; color:var(--red); border:1px solid var(--red);">X</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 2. Posts Table
    const postList = document.getElementById('admin-list-posts');
    if(postList) {
        postList.innerHTML = '';
        APP_STATE.posts.forEach((p, i) => {
            const div = document.createElement('div');
            div.style = "border:1px solid var(--border); padding:10px; margin-bottom:10px; font-size:12px; display:flex; justify-content:space-between; align-items:center;";
            div.innerHTML = `
                <div>
                    <span style="color:var(--cyan); font-weight:bold;">${p.title}</span> <span style="font-size:10px; color:#888;">(MAX: ${p.maxPoints} pts)</span><br>
                    <span style="font-size:10px;">Submissions: ${APP_STATE.submissions.filter(s => s.postId === p.id).length}</span>
                </div>
                <div style="display:flex; gap:5px;">
                    <button class="edit-post-btn" data-id="${p.id}" style="padding:4px; font-size:10px; background:transparent; border:1px solid var(--cyan); color:var(--cyan); cursor:pointer;">EDIT</button>
                    <button class="del-post-btn" data-id="${p.id}" style="padding:4px; font-size:10px; background:transparent; border:1px solid var(--red); color:var(--red); cursor:pointer;">DEL</button>
                </div>
            `;
            postList.appendChild(div);
        });
    }

    // 3. Submissions Table (Evaluaciones)
    const subList = document.getElementById('admin-list-subs');
    if(subList) {
        subList.innerHTML = '';
        const pending = APP_STATE.submissions.filter(s => !s.isGraded);
        if(pending.length === 0) {
            subList.innerHTML = '<p style="font-size:11px; color:#888;">NO HAY SOLUCIONES PENDIENTES</p>';
        }
        pending.forEach(sub => {
            const p = APP_STATE.posts.find(x => x.id === sub.postId) || {title: 'Desconocido', maxPoints: 0};
            const div = document.createElement('div');
            div.style = "border:1px solid var(--border); padding:10px; margin-bottom:10px; font-size:12px; display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5);";
            div.innerHTML = `
                <div>
                    <span style="color:var(--amber); font-weight:bold;">DE: ${sub.studentId}</span><br>
                    <span style="font-size:10px;">ENIGMA: ${p.title}</span>
                </div>
                <button class="eval-btn" data-id="${sub.id}" data-pid="${sub.postId}" data-sid="${sub.studentId}" data-hint="${sub.usedHint}" style="padding:4px 8px; font-size:10px; background:var(--green); color:#000; border:none; cursor:pointer; font-weight:bold;">ABRIR</button>
            `;
            subList.appendChild(div);
        });
    }
}

// --- ACTUALIZAR UI ESTUDIANTE ---
function refreshStudentUI() {
    if(!document.getElementById('screen-student').classList.contains('active')) return;
    const st = APP_STATE.students[APP_STATE.currentUserId];
    if(st) {
        document.getElementById('student-score-display').textContent = st.score || 0;
        const rnk = getRangoVisual(st.score || 0);
        const rankEl = document.getElementById('student-rank-display');
        rankEl.textContent = rnk.title;
        rankEl.style.color = rnk.color;
    }
    renderStudentPosts(APP_STATE.posts, APP_STATE.submissions, APP_STATE.currentUserId);
}

// ================= FIREBASE LISTENERS =================
onSnapshot(collection(db, "students"), (snapshot) => {
    APP_STATE.students = {};
    APP_STATE.codesMap = {};
    ROOT_ADMINS.forEach(root => APP_STATE.codesMap[root] = generarCodigo(root));
    snapshot.forEach(doc => {
        const student = doc.data();
        APP_STATE.students[doc.id] = student;
        APP_STATE.codesMap[doc.id] = student.code;
    });
    refreshAdminUI();
    refreshStudentUI();
});

onSnapshot(collection(db, "posts"), (snapshot) => {
    APP_STATE.posts = [];
    snapshot.forEach(doc => APP_STATE.posts.push({ id: doc.id, ...doc.data() }));
    APP_STATE.posts.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    refreshAdminUI();
    refreshStudentUI();
});

onSnapshot(collection(db, "submissions"), (snapshot) => {
    APP_STATE.submissions = [];
    snapshot.forEach(doc => APP_STATE.submissions.push({ id: doc.id, ...doc.data() }));
    APP_STATE.submissions.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    refreshAdminUI();
    refreshStudentUI();
});

onSnapshot(collection(db, "logs"), (snapshot) => {
    const logs = [];
    snapshot.forEach(doc => logs.push({id: doc.id, ...doc.data()}));
    logs.sort((a,b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
    
    const box = document.getElementById('global-log-box');
    if(box) {
        box.innerHTML = logs.slice(0, 50).map(l => {
            const time = l.timestamp ? new Date(l.timestamp.toDate()).toLocaleTimeString() : '';
            const color = l.type === 'alert' ? 'var(--amber)' : (l.type === 'success' ? 'var(--green)' : 'var(--cyan)');
            return `<div style="margin-bottom:5px; color:${color};">[${time}] > ${l.message}</div>`;
        }).join('');
    }
});

// ================= EVENTOS DOM =================
document.addEventListener('DOMContentLoaded', () => {

    /* --- NAVEGACIÓN INICIAL --- */
    document.getElementById('go-to-login')?.addEventListener('click', () => mostrarPantalla('screen-login'));
    document.getElementById('go-to-registro')?.addEventListener('click', () => mostrarPantalla('screen-registro'));
    document.getElementById('btn-login-cancel')?.addEventListener('click', () => mostrarPantalla('screen-landing'));
    document.getElementById('btn-reg-cancel')?.addEventListener('click', () => mostrarPantalla('screen-landing'));

    /* --- LOGIN --- */
    document.getElementById('btn-login-submit')?.addEventListener('click', () => {
        const val = document.getElementById('login-input').value.trim();
        const hint = document.getElementById('login-feedback');
        
        if (ROOT_ADMINS.includes(val) || val === "ROOT_DEBUG" || (APP_STATE.students[val] && APP_STATE.students[val].role === 'admin')) {
            APP_STATE.currentUserId = val === "ROOT_DEBUG" ? ROOT_ADMINS[0] : val;
            mostrarPantalla('screen-admin');
            refreshAdminUI();
            return;
        }

        // ¿Es cédula o código?
        let cedula = null;
        if (APP_STATE.students[val]) cedula = val; // Entró con cédula
        else {
            // Buscar si es código
            const foundEntry = Object.entries(APP_STATE.codesMap).find(([k, v]) => v === val);
            if (foundEntry && APP_STATE.students[foundEntry[0]]) cedula = foundEntry[0];
        }

        if(cedula) {
            APP_STATE.currentUserId = cedula;
            APP_STATE.currentUserCode = APP_STATE.codesMap[cedula];
            document.getElementById('student-id-display').textContent = cedula;
            mostrarPantalla('screen-student');
            refreshStudentUI();
        } else {
            hint.textContent = '> ACCESO DENEGADO. CREDENCIAL INVÁLIDA.';
            hint.className = 'hint-line err';
        }
    });

    /* --- REGISTRO --- */
    document.getElementById('btn-reg-submit')?.addEventListener('click', async () => {
        const cedula = document.getElementById('reg-cedula').value.trim();
        const subject = document.getElementById('reg-subject').value;
        const group = document.getElementById('reg-group').value.trim();
        const hint = document.getElementById('reg-feedback');

        hint.textContent = "...PROCESANDO...";
        hint.className = 'hint-line';
        
        const res = await registrarEstudiante(cedula, subject, group, APP_STATE.students);
        if(res.success) {
            document.getElementById('generated-code-display').textContent = res.code;
            APP_STATE.currentUserId = cedula;
            APP_STATE.currentUserCode = res.code;
            mostrarPantalla('screen-codigo');
        } else {
            hint.textContent = `> ERROR: ${res.error}`;
            hint.className = 'hint-line err';
        }
    });

    document.getElementById('btn-code-continue')?.addEventListener('click', () => {
        document.getElementById('student-id-display').textContent = APP_STATE.currentUserId;
        mostrarPantalla('screen-student');
        refreshStudentUI();
    });

    document.getElementById('btn-copy-code')?.addEventListener('click', () => {
        const code = document.getElementById('generated-code-display').innerText;
        navigator.clipboard.writeText(code).then(() => alert("Copiado al portapapeles. Guarda esta llave."));
    });

    /* --- ESTUDIANTE: MODALES DE ENIGMAS --- */
    document.addEventListener('click', (e) => {
        // Abrir Modal de Resolver
        if(e.target.classList.contains('solve-btn')) {
            const pid = e.target.getAttribute('data-id');
            const ptitle = e.target.getAttribute('data-title');
            document.getElementById('modal-sol-title').textContent = `// MISIÓN: ${ptitle}`;
            document.getElementById('modal-sol-postid').value = pid;
            document.getElementById('modal-sol-enunciado').value = '';
            document.getElementById('modal-sol-codigo').value = '';
            document.getElementById('modal-sol-explicacion').value = '';
            document.getElementById('modal-sol-feedback').textContent = '';
            openModal('modal-solucion');
        }

        // Abrir Modal de Pista
        if(e.target.classList.contains('hint-btn')) {
            // Guardamos temporalmente el texto de la pista en un atributo global para no usar variable gobal
            const hint = e.target.getAttribute('data-hint');
            document.getElementById('pista-caja-revelada').textContent = hint;
            // Usamos dataset en el boton revelar para vincular
            document.getElementById('btn-reveal-pista').setAttribute('data-id', e.target.getAttribute('data-id'));
            openModal('modal-pista');
        }
        
        // ADMIN: Evaluar Solución Click
        if(e.target.classList.contains('eval-btn')) {
            const sid = e.target.getAttribute('data-sid');
            const pid = e.target.getAttribute('data-pid');
            const subId = e.target.getAttribute('data-id');
            const hintUsed = e.target.getAttribute('data-hint') === 'true';
            
            const p = APP_STATE.posts.find(x => x.id === pid);
            const sub = APP_STATE.submissions.find(s => s.id === subId);
            
            document.getElementById('eval-agent').textContent = sid;
            document.getElementById('eval-post').textContent = p ? p.title : 'N/A';
            document.getElementById('eval-maxpts').textContent = p ? p.maxPoints : '0';
            
            document.getElementById('eval-ans-enunciado').textContent = sub ? sub.enunciado : '';
            document.getElementById('eval-ans-codigo').textContent = sub ? sub.codigo : '';
            document.getElementById('eval-ans-explicacion').textContent = sub ? sub.explicacion : '';
            
            document.getElementById('eval-used-hint').textContent = hintUsed ? "⚠️ ESTE AGENTE UTILIZÓ UNA PISTA (-10%)" : "";
            
            document.getElementById('eval-sub-id').value = subId;
            document.getElementById('eval-stud-id').value = sid;
            document.getElementById('eval-score').value = '';
            
            openModal('modal-evaluar');
        }
    });

    // PISTA: Decodificar
    document.getElementById('btn-reveal-pista')?.addEventListener('click', () => {
        document.getElementById('pista-caja-revelada').style.display = 'block';
        document.getElementById('pista-botones').style.display = 'none';
        
        // Registrar en Firebase en background si se quiere (omitido para mantener simpleza)
        // La penalizacion se marca al Enviar la respuesta.
        // Guardamos en un atributo del modal para saber que se usó
        document.getElementById('modal-sol-postid').setAttribute('data-hintused', 'true');
    });

    // SOLUCIÓN: Enviar
    document.getElementById('btn-send-solucion')?.addEventListener('click', async () => {
        const pid = document.getElementById('modal-sol-postid').value;
        const enunciado = document.getElementById('modal-sol-enunciado').value.trim();
        const codigo = document.getElementById('modal-sol-codigo').value.trim();
        const expli = document.getElementById('modal-sol-explicacion').value.trim();
        const hintUsed = document.getElementById('modal-sol-postid').getAttribute('data-hintused') === 'true';
        const feed = document.getElementById('modal-sol-feedback');

        if(!enunciado && !codigo && !expli) {
            feed.textContent = "> ERROR_VACÍO: Ingresa al menos un dato.";
            feed.className = 'hint-line err';
            return;
        }

        feed.textContent = "> TRANSMITIENDO PAQUETES...";
        feed.className = 'hint-line';
        const btn = document.getElementById('btn-send-solucion');
        btn.disabled = true;

        const res = await enviarResolucionLocal(pid, APP_STATE.currentUserId, enunciado, codigo, expli, hintUsed);
        if(res) {
            document.getElementById('modal-sol-postid').setAttribute('data-hintused', 'false'); // reset
            closeModal('modal-solucion');
            refreshStudentUI(); // Refresca botones
        } else {
            feed.textContent = "> ERROR_DE_RED";
            feed.className = 'hint-line err';
        }
        btn.disabled = false;
    });

    // CERRAR MODALES (BOTONES ATRÁS)
    document.getElementById('btn-close-sol-modal')?.addEventListener('click', () => closeModal('modal-solucion'));
    document.getElementById('btn-close-pista-modal')?.addEventListener('click', () => closeModal('modal-pista'));
    document.getElementById('btn-close-eval-modal')?.addEventListener('click', () => closeModal('modal-evaluar'));

    /* --- ADMIN TABS --- */
    document.getElementById('tab-posts')?.addEventListener('click', (e) => {
        e.target.style.borderBottom = "2px solid var(--green)";
        e.target.style.color = "var(--green)";
        const tabSubs = document.getElementById('tab-subs');
        tabSubs.style.borderBottom = "none";
        tabSubs.style.color = "var(--green-dim)";
        
        document.getElementById('admin-list-posts').style.display = "block";
        document.getElementById('admin-list-subs').style.display = "none";
    });
    
    document.getElementById('tab-subs')?.addEventListener('click', (e) => {
        e.target.style.borderBottom = "2px solid var(--green)";
        e.target.style.color = "var(--green)";
        const tabList = document.getElementById('tab-posts');
        tabList.style.borderBottom = "none";
        tabList.style.color = "var(--green-dim)";
        
        document.getElementById('admin-list-posts').style.display = "none";
        document.getElementById('admin-list-subs').style.display = "block";
    });

    /* --- ADMIN PANEL: ACCIONES --- */
    document.getElementById('btn-admin-add-root')?.addEventListener('click', async () => {
        const val = document.getElementById('admin-new-user-input').value.trim();
        const role = document.getElementById('admin-new-user-role').value;
        await adminAgregarUsuarioLocal(val, role, APP_STATE.students);
        document.getElementById('admin-new-user-input').value = '';
    });

    document.getElementById('btn-admin-save-post')?.addEventListener('click', async () => {
        const title = document.getElementById('admin-post-title').value.trim();
        const body = document.getElementById('admin-post-body').value.trim();
        const pts = document.getElementById('admin-post-pts').value.trim();
        const hint = document.getElementById('admin-post-hint').value.trim();
        const deadline = document.getElementById('admin-post-deadline').value;
        const tags = document.getElementById('admin-post-tags').value.trim();
        const eid = document.getElementById('admin-post-id').value;

        if(!title || !body) return alert("El título y contenido son obligatorios.");

        const res = await adminGuardarPostLocal(title, body, tags, pts, hint, deadline, eid);
        if(res) {
            document.getElementById('admin-post-title').value = '';
            document.getElementById('admin-post-body').value = '';
            document.getElementById('admin-post-pts').value = '';
            document.getElementById('admin-post-hint').value = '';
            document.getElementById('admin-post-deadline').value = '';
            document.getElementById('admin-post-tags').value = '';
            document.getElementById('admin-post-id').value = '-1';
            document.getElementById('editor-title-label').textContent = "// REDACTAR NUEVA MISIÓN (POST)";
            document.getElementById('btn-admin-cancel-post').style.display = "none";
        }
    });

     document.getElementById('btn-admin-cancel-post')?.addEventListener('click', () => {
        document.getElementById('admin-post-title').value = '';
        document.getElementById('admin-post-body').value = '';
        document.getElementById('admin-post-pts').value = '';
        document.getElementById('admin-post-hint').value = '';
        document.getElementById('admin-post-deadline').value = '';
        document.getElementById('admin-post-tags').value = '';
        document.getElementById('admin-post-id').value = '-1';
        document.getElementById('editor-title-label').textContent = "// REDACTAR NUEVA MISIÓN (POST)";
        document.getElementById('btn-admin-cancel-post').style.display = "none";
    });

    // ADMIN DELEGACIONES (Borrar / Editar Post via tabla)
    document.addEventListener('click', async (e) => {
        if(e.target.classList.contains('del-user-btn')) {
            await adminEliminarUsuarioLocal(e.target.getAttribute('data-cedula'));
        }
        if(e.target.classList.contains('del-post-btn')) {
            await adminEliminarPostLocal(e.target.getAttribute('data-id'));
        }
        if(e.target.classList.contains('edit-post-btn')) {
            const p = APP_STATE.posts.find(x => x.id === e.target.getAttribute('data-id'));
            if(p) {
                document.getElementById('admin-post-title').value = p.title || '';
                document.getElementById('admin-post-body').value = p.body || '';
                document.getElementById('admin-post-pts').value = p.maxPoints || '';
                document.getElementById('admin-post-hint').value = p.hint || '';
                document.getElementById('admin-post-deadline').value = p.deadline || '';
                document.getElementById('admin-post-tags').value = p.hl || '';
                document.getElementById('admin-post-id').value = p.id;
                document.getElementById('editor-title-label').textContent = "// EDITANDO MISIÓN EXISTENTE";
                document.getElementById('btn-admin-cancel-post').style.display = "block";
            }
        }
    });

    // ADMIN: CALIFICAR
    document.getElementById('btn-send-eval')?.addEventListener('click', async () => {
        const subId = document.getElementById('eval-sub-id').value;
        const studId = document.getElementById('eval-stud-id').value;
        const score = document.getElementById('eval-score').value;

        if(!score) return alert("Debes asignar puntos.");

        const res = await calificarSubmisionLocal(subId, studId, score);
        if(res) {
            closeModal('modal-evaluar');
        } else {
            alert("Error al guardar la calificación en red.");
        }
    });

    // LOGOUT GENERAL
    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', () => location.reload());
    });
});

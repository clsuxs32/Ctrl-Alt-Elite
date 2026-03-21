/* MATRIX RAIN */
        (function () {
            const cv = document.getElementById('matrix-canvas');
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
            setInterval(draw, 50);
        })();

        /* PERSISTENCIA DE DATOS (PRODUCCIÓN) */
        let CEDULAS_AUTORIZADAS = JSON.parse(localStorage.getItem('NB_CEDULAS')) || ['31711870', '31197589', '31787090'];
        let POSTS_DATA = JSON.parse(localStorage.getItem('NB_POSTS')) || [
            { title: 'NODO-01', body: 'Infiltración exitosa en NEXUS CORP. El ghost_protocol.enc espera.', hl: 'NEXUS CORP, ghost_protocol' }
        ];
        let MAPA_CODIGOS = {};

        function actualizarStorage() {
            localStorage.setItem('NB_CEDULAS', JSON.stringify(CEDULAS_AUTORIZADAS));
            localStorage.setItem('NB_POSTS', JSON.stringify(POSTS_DATA));
        }

        function actualizarMapa() {
            MAPA_CODIGOS = {};
            CEDULAS_AUTORIZADAS.forEach(c => {
                MAPA_CODIGOS[c] = generarCodigo(c);
            });
        }

        function generarCodigo(cedula) {
            const digits = cedula.replace(/\D/g, '').split('').map(Number);
            let seed = 0;
            digits.forEach((d, i) => { seed += d * (i + 3) * 7; });
            seed = seed % 97;
            const transformed = digits.map((d, i) => (d + (seed + i * 13 + d * 3) % 10) % 10);
            return transformed.join('');
        }

        /* FUNCIONES ADMIN - USUARIOS */
        function adminAgregarUsuario() {
            const inp = document.getElementById('admin-new-cedula');
            const val = inp.value.trim();
            if (val.length > 5 && !CEDULAS_AUTORIZADAS.includes(val)) {
                CEDULAS_AUTORIZADAS.push(val);
                actualizarMapa();
                actualizarStorage();
                inp.value = '';
                renderAdminTable();
            }
        }

        function adminEliminarUsuario(cedula) {
            CEDULAS_AUTORIZADAS = CEDULAS_AUTORIZADAS.filter(c => c !== cedula);
            actualizarMapa();
            actualizarStorage();
            renderAdminTable();
        }

        function renderAdminTable() {
            const tbody = document.getElementById('admin-user-body');
            tbody.innerHTML = '';
            CEDULAS_AUTORIZADAS.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
            <td>${c}</td>
            <td style="color:var(--cyan)">${MAPA_CODIGOS[c]}</td>
            <td><button class="del-btn" onclick="adminEliminarUsuario('${c}')">ELIMINAR</button></td>
        `;
                tbody.appendChild(tr);
            });
        }

        /* FUNCIONES ADMIN - POSTS (ENIGMAS) */
        function adminGuardarPost() {
            const title = document.getElementById('post-title').value.trim();
            const body = document.getElementById('post-body').value.trim();
            const hl = document.getElementById('post-hl').value.trim();
            const editIndex = parseInt(document.getElementById('edit-post-index').value);

            if (!title || !body) return alert("ERROR: Faltan campos.");

            const postObj = { title, body, hl };

            if (editIndex === -1) {
                POSTS_DATA.push(postObj);
            } else {
                POSTS_DATA[editIndex] = postObj;
            }

            actualizarStorage();
            adminResetPostForm();
            renderAdminPosts();
        }

        function adminEditarPost(index) {
            const p = POSTS_DATA[index];
            document.getElementById('post-title').value = p.title;
            document.getElementById('post-body').value = p.body;
            document.getElementById('post-hl').value = p.hl;
            document.getElementById('edit-post-index').value = index;

            document.getElementById('post-editor-label').textContent = "// EDITANDO ENIGMA SELECCIONADO";
            document.getElementById('btn-save-post').textContent = "[ GUARDAR CAMBIOS ]";
            document.getElementById('btn-cancel-edit').style.display = "block";
        }

        function adminEliminarPost(index) {
            if (confirm("¿Confirmar eliminación permanente de este dossier?")) {
                POSTS_DATA.splice(index, 1);
                actualizarStorage();
                renderAdminPosts();
            }
        }

        function adminResetPostForm() {
            document.getElementById('post-title').value = '';
            document.getElementById('post-body').value = '';
            document.getElementById('post-hl').value = '';
            document.getElementById('edit-post-index').value = '-1';
            document.getElementById('post-editor-label').textContent = "// CREAR NUEVO ENIGMA (DOSSIER)";
            document.getElementById('btn-save-post').textContent = "[ PUBLICAR ENIGMA ]";
            document.getElementById('btn-cancel-edit').style.display = "none";
        }

        function renderAdminPosts() {
            const list = document.getElementById('admin-posts-list');
            list.innerHTML = '';
            POSTS_DATA.forEach((p, i) => {
                const div = document.createElement('div');
                div.className = 'dossier';
                div.style.padding = "5px 10px";
                div.style.fontSize = "12px";
                div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>#${i + 1} [ ${p.title} ]</span>
                <div>
                    <button class="edit-btn" onclick="adminEditarPost(${i})">EDITAR</button>
                    <button class="del-btn" onclick="adminEliminarPost(${i})">BORRAR</button>
                </div>
            </div>
        `;
                list.appendChild(div);
            });
        }

        /* NAVEGACION Y SESION */
        let agenteCodigo = '';
        document.getElementById('session-id').textContent = Math.random().toString(16).slice(2, 10).toUpperCase();

        function mostrar(id) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        }

        function validarCedula() {
            const val = document.getElementById('cedula-input').value.trim();
            actualizarMapa();
            if (CEDULAS_AUTORIZADAS.includes(val)) {
                agenteCodigo = MAPA_CODIGOS[val];
                // Si es una de las cedulas originales, entra a Admin
                if (['31711870', '31197589', '31787090'].includes(val)) {
                    mostrar('screen-admin');
                    renderAdminTable();
                    renderAdminPosts();
                } else {
                    mostrar('screen-codigo');
                    document.getElementById('codigo-display').textContent = agenteCodigo;
                }
            } else {
                const hint = document.getElementById('cedula-hint');
                hint.textContent = '> ERROR: ACCESO DENEGADO.';
                hint.className = 'hint-line err';
            }
        }

        function irAlLanding() { mostrar('screen-landing'); }

        function verificarAcceso() {
            const val = document.getElementById('access-input').value.trim();
            if (Object.values(MAPA_CODIGOS).includes(val) || val === "ROOT_DEBUG") {
                mostrar('screen-enigma');
                document.getElementById('agent-id-display').textContent = 'ID: ' + val;
                renderPublicPosts();
                setTimeout(() => document.getElementById('progress-fill').style.width = '100%', 500);
            }
        }

        function renderPublicPosts() {
            const container = document.getElementById('posts-container');
            container.innerHTML = '';
            POSTS_DATA.forEach(p => {
                const div = document.createElement('div');
                div.className = 'dossier';
                div.innerHTML = `
            <div class="dossier-header"><span>// DOSSIER: ${p.title}</span> <span>${new Date().toLocaleTimeString()}</span></div>
            <div class="dossier-body">
                <p>${p.body.replace(/\n/g, '<br>')}</p>
                ${p.hl ? `<br><p>TAGS: <span class="hl-cyan">${p.hl}</span></p>` : ''}
            </div>
        `;
                container.appendChild(div);
            });
        }

        function copiarCodigo() {
            const code = document.getElementById('codigo-display').innerText;
            navigator.clipboard.writeText(code).then(() => alert("Código copiado."));
        }

        actualizarMapa();

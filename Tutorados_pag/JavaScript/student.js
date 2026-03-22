import { collection, addDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from './firebase-config.js';
import { generarCodigo, ROOT_ADMINS } from './auth.js';

// Auto-Registro de Nuevos Estudiantes
export async function registrarEstudiante(cedula, subject, group, studentsData) {
    // Validaciones
    if (cedula.length < 6 || !subject || !group) {
        return { success: false, error: "Datos incompletos o inválidos." };
    }
    if (studentsData[cedula] || ROOT_ADMINS.includes(cedula)) {
        return { success: false, error: "Esta cédula ya se encuentra registrada en la red." };
    }

    const newCode = generarCodigo(cedula);
    try {
        await setDoc(doc(db, "students", cedula), {
            code: newCode,
            subject: subject,
            group: group,
            role: 'agente',
            score: 0,
            createdAt: new Date()
        });
        return { success: true, code: newCode };
    } catch (err) {
        console.error(err);
        return { success: false, error: "Error de red al establecer conexión." };
    }
}

// Enviar una resolución a un enigma
export async function enviarResolucionLocal(postId, studentId, enunciado, codigo, explicacion, usedHint) {
    try {
        const subData = {
            postId,
            studentId,
            enunciado: enunciado || '',
            codigo: codigo || '',
            explicacion: explicacion || '',
            usedHint: usedHint || false,
            score: 0,
            isGraded: false,
            createdAt: new Date()
        };
        await addDoc(collection(db, "submissions"), subData);
        
        // Disparar log de actividad
        const logData = {
            message: `Agente <${studentId.slice(0,4)}***> ha enviado una transmisión hacia el NODO-${postId.slice(0,5)}.`,
            type: 'info',
            timestamp: new Date()
        };
        await addDoc(collection(db, "logs"), logData);

        return true;
    } catch (error) {
        console.error("Error al enviar solución:", error);
        return false;
    }
}

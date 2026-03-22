import { collection, doc, setDoc, deleteDoc, addDoc, increment } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db } from './firebase-config.js';
import { generarCodigo, ROOT_ADMINS } from './auth.js';

/* ----- GESTIÓN DE USUARIOS ----- */
export async function adminAgregarUsuarioLocal(val, role, studentsData) {
    if (val.length > 5 && !studentsData[val] && !ROOT_ADMINS.includes(val)) {
        try {
            await setDoc(doc(db, "students", val), {
                code: generarCodigo(val),
                role: role || 'agente',
                score: 0,
                subject: role === 'admin' ? 'SYSTEM' : 'Manual',
                group: role === 'admin' ? 'ROOT' : 'Admin',
                createdAt: new Date()
            });
            return true;
        } catch (error) {
            console.error(error);
            alert("Error al guardar en Firebase. Revisa permisos.");
            return false;
        }
    } else {
        alert("Cédula inválida o el Agente ya existe.");
        return false;
    }
}

export async function adminEliminarUsuarioLocal(cedula) {
    if(confirm(`¿Eliminar al Agente con cédula ${cedula} permanentemente?`)) {
        try {
            await deleteDoc(doc(db, "students", cedula));
        } catch (error) {
            console.error(error);
            alert("Error al eliminar.");
        }
    }
}

/* ----- GESTIÓN DE POSTS ----- */
export async function adminGuardarPostLocal(title, body, hl, maxPoints, hint, deadline, editId) {
    const postObj = { 
        title, 
        body, 
        hl, 
        maxPoints: Number(maxPoints) || 0,
        hint: hint || "",
        deadline: deadline || "",
        isActive: true,
        updatedAt: new Date() 
    };
    try {
        if (editId === '-1' || !editId) {
            postObj.createdAt = new Date();
            await addDoc(collection(db, "posts"), postObj);
            
            // Log
            await addDoc(collection(db, "logs"), {
                message: `El Administrador ha desclasificado el sumario [ ${title} ].`,
                type: 'alert',
                timestamp: new Date()
            });
            
        } else {
            await setDoc(doc(db, "posts", editId), postObj, { merge: true });
        }
        return true;
    } catch (error) {
        console.error("Error al guardar post:", error);
        alert("Error de conexión con la base de datos.");
        return false;
    }
}

export async function adminEliminarPostLocal(id) {
    if (confirm("¿Confirmar eliminación permanente de este dossier?")) {
        try {
            await deleteDoc(doc(db, "posts", id));
        } catch (error) {
            console.error("Error al eliminar post:", error);
            alert("Error al eliminar.");
        }
    }
}

/* ----- CALIFICACIÓN DE RESPUESTAS (SUBMISSIONS) ----- */
export async function calificarSubmisionLocal(subId, studentId, earnedPoints) {
    try {
        // Actualizamos la solucion
        await setDoc(doc(db, "submissions", subId), { 
            score: Number(earnedPoints), 
            isGraded: true 
        }, { merge: true });
        
        // Sumamos los puntos al estudiante atomically
        await setDoc(doc(db, "students", studentId), {
            score: increment(Number(earnedPoints))
        }, { merge: true });

        // Enviar al log
        await addDoc(collection(db, "logs"), {
            message: `Evaluación completada. Agente <${studentId.slice(0,4)}***> recibe +${earnedPoints} pts.`,
            type: 'success',
            timestamp: new Date()
        });
        
        return true;
    } catch (err) {
        console.error("Error al calificar:", err);
        return false;
    }
}


    // ——————————————
    // 1) Inicializa Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyDbWwu1EBlawEvHwfGE6DFB2fdGx7g6pRo",
      authDomain: "web-cites.firebaseapp.com",
      projectId: "web-cites",
      storageBucket: "web-cites.appspot.com",
      messagingSenderId: "504262865128",
      appId: "1:504262865128:web:46b52d110e97215c75595d",
      measurementId: "G-ZPX2CR43P9"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db   = firebase.firestore();

    // ——————————————
    // 2) Control de UI & rol al autenticar
    auth.onAuthStateChanged(async user => {
      if (!user) {
        // Mostrar login, ocultar app
        loginDiv.style.display = 'block';
        appDiv.style.display   = 'none';
        return;
      }
      // Usuario logueado: ocultar login, mostrar app
      loginDiv.style.display = 'none';
      appDiv.style.display   = 'block';

      // Leer rol desde /users/{uid}
      const perfilSnap = await db.collection('users').doc(user.uid).get();
      window.ROLE = perfilSnap.exists
        ? perfilSnap.data().role
        : 'user';

      // Guardar email para mostrarlo
      window.USER_EMAIL = user.email;

      // Cargar CITES según rol
      cargarUltimos();
    });

    // ——————————————
    // 3) Login y Logout
    loginBtn.addEventListener('click', async () => {
      loginError.innerText = '';
      try {
        await auth.signInWithEmailAndPassword(
          email.value.trim(),
          password.value
        );
      } catch(e) {
        loginError.innerText = 'Error: ' + e.message;
      }
    });
    logoutBtn.addEventListener('click', () => auth.signOut());

    // ——————————————
    // 4) Generar un nuevo CITE
    generateBtn.addEventListener('click', async () => {
      const nombre = docName.value.trim();
      if (!nombre) return alert('Ingresa el nombre del documento.');

      // Transacción para contador
      const counterRef = db.collection('counters').doc('cites');
      let newNumber;
      await db.runTransaction(async tx => {
        const doc = await tx.get(counterRef);
        if (!doc.exists) {
          tx.set(counterRef, { current: 1 });
          newNumber = 1;
        } else {
          newNumber = doc.data().current + 1;
          tx.update(counterRef, { current: newNumber });
        }
      });

      // Formateo y guardado
      const padded = String(newNumber).padStart(3,'0');
      const year   = new Date().getFullYear();
      const codigo = `GAMT/D.OO.PP. Nº ${padded}/${year}`;

      await db.collection('cites').add({
        numero: padded,
        codigo,
        nombreDocumento: nombre,
        creadoPorEmail:  USER_EMAIL,
        creadoPorUID:    auth.currentUser.uid,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
      });

      result.innerText = '✅ ' + codigo;
      docName.value = '';
      cargarUltimos();
    });

    // ——————————————
    // 5) Cargar y mostrar CITES según rol
async function cargarUltimos() {
  let q = db.collection('cites').orderBy('fecha','desc');
  if (window.ROLE !== 'admin') {
    q = q.where('creadoPorUID','==', auth.currentUser.uid);
  }
  const snapshot = await q.limit(10).get();
  lastList.innerHTML = '';

  snapshot.forEach(doc => {
    const d = doc.data();

    // 1) Convierte el timestamp de Firestore a Date de JS
    const ts = d.fecha ? d.fecha.toDate() : new Date();
    // 2) Dale formato local (fecha + hora)
    const fechaHora = ts.toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <strong>${d.codigo}</strong><br>
      Documento: ${d.nombreDocumento}<br>
      Creado por: ${d.creadoPorEmail}<br>
      Fecha: ${fechaHora}<br>
      Perfil: <em>${window.ROLE}</em>
      <div style="margin-top:0.5rem; text-align:right;">
        <button data-id="${doc.id}" data-nombre="${d.nombreDocumento}"
                class="btn-edit">✏️ Editar</button>
        <button data-id="${doc.id}" 
                class="btn-delete">🗑️ Eliminar</button>
      </div>
    `;
    lastList.appendChild(div);
  });

}

    // ——————————————
// 6) Eliminar un CITE
async function eliminarCite(citeId) {
  if (!confirm('¿Seguro que quieres eliminar este CITE?')) return;
  try {
    await db.collection('cites').doc(citeId).delete();
    alert('CITE eliminado.');
    cargarUltimos();
  } catch(e) {
    alert('Error al eliminar: ' + e.message);
  }
}

// 7) Editar el nombre del documento de un CITE
async function editarCite(citeId, currentNombre) {
  const nuevoNombre = prompt('Nuevo nombre de documento:', currentNombre);
  if (nuevoNombre == null) return;            // Canceló
  if (!nuevoNombre.trim()) {
    return alert('El nombre no puede estar vacío.');
  }
  try {
    await db.collection('cites').doc(citeId).update({
      nombreDocumento: nuevoNombre.trim()
    });
    alert('CITE actualizado.');
    cargarUltimos();
  } catch(e) {
    alert('Error al editar: ' + e.message);
  }
}

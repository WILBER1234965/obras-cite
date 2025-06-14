document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const loginDiv      = document.getElementById('loginDiv');
  const appDiv        = document.getElementById('appDiv');
  const loginBtn      = document.getElementById('loginBtn');
  const logoutBtn     = document.getElementById('logoutBtn');
  const email         = document.getElementById('email');
  const password      = document.getElementById('password');
  const docName       = document.getElementById('docName');
  const generateBtn   = document.getElementById('generateBtn');
  const tableBody     = document.querySelector('#citesTable tbody');
  const exportBtn     = document.getElementById('exportBtn');

  // Contador global para validación de borrado
  let currentCounterGlobal = 0;

  // Firebase
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

  // Toast
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true
  });

  // Observador de auth
  auth.onAuthStateChanged(async user => {
    if (!user) {
      loginDiv.style.display = 'block';
      appDiv.classList.add('hidden');
      return;
    }
    loginDiv.style.display = 'none';
    appDiv.classList.remove('hidden');

    // Leer rol
    const perfilSnap = await db.collection('users').doc(user.uid).get();
    const roleFromDb = perfilSnap.exists
      ? perfilSnap.data().role.toLowerCase()
      : 'user';

    window.ROLE       = (roleFromDb === 'superadmin') ? 'superadmin' : 'user';
    window.USER_EMAIL = user.email;

    // Mostrar/ocultar exportBtn
    if (window.ROLE === 'superadmin') {
      exportBtn.classList.remove('hidden');
      exportBtn.addEventListener('click', exportToExcel);
    } else {
      exportBtn.classList.add('hidden');
    }

    cargarUltimos();
  });

  // Login
  loginBtn.addEventListener('click', async () => {
    try {
      await auth.signInWithEmailAndPassword(email.value.trim(), password.value);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error al iniciar sesión', text: e.message });
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => auth.signOut());

  // Generar CITE
  generateBtn.addEventListener('click', async () => {
    const nombre = docName.value.trim();
    if (!nombre) {
      Toast.fire({ icon: 'warning', title: 'Ingresa el nombre del documento.' });
      return;
    }

    const counterRef = db.collection('counters').doc('cites');
    let newNumber;
    await db.runTransaction(async tx => {
      const ctr = await tx.get(counterRef);
      if (!ctr.exists) {
        tx.set(counterRef, { current: 1 });
        newNumber = 1;
      } else {
        newNumber = ctr.data().current + 1;
        tx.update(counterRef, { current: newNumber });
      }
    });

    const padded = String(newNumber).padStart(3,'0');
    const year   = new Date().getFullYear();
    const codigo = `GAMT/D.OO.PP. Nº ${padded}/${year}`;

    await db.collection('cites').add({
      numero: padded,
      codigo,
      nombreDocumento: nombre,
      creadoPorEmail:  window.USER_EMAIL,
      creadoPorUID:    auth.currentUser.uid,
      fecha: firebase.firestore.FieldValue.serverTimestamp()
    });

    Toast.fire({ icon: 'success', title: `CITE ${codigo} generado` });
    docName.value = '';
    cargarUltimos();
  });

  // Función corregida:
  async function cargarUltimos() {
    // Leer contador actual
    const ctrSnap            = await db.collection('counters').doc('cites').get();
    const currentCounter     = ctrSnap.exists ? ctrSnap.data().current : 0;
    currentCounterGlobal     = currentCounter;

    // Traer todos los CITES
    const allSnap = await db.collection('cites').get();

    // Mapear, filtrar, ordenar y limitar a 10
    const docs = allSnap.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          codigo: data.codigo,
          nombreDocumento: data.nombreDocumento,
          creadoPorEmail: data.creadoPorEmail,
          creadoPorUID: data.creadoPorUID,
          numero: data.numero,
          fechaObj: data.fecha?.toDate()
        };
      })
      .filter(d => window.ROLE === 'superadmin' || d.creadoPorUID === auth.currentUser.uid)
      .sort((a, b) => (b.fechaObj?.getTime() || 0) - (a.fechaObj?.getTime() || 0))
      .slice(0, 10);

    // Renderizar en la tabla
    tableBody.innerHTML = '';
    docs.forEach(d => {
      const fechaHora = d.fechaObj
        ? d.fechaObj.toLocaleString('es-ES', { dateStyle:'short', timeStyle:'short' })
        : '';

      // Sólo permitir eliminar el CITE cuyo número coincide con el contador actual
      const puedeEliminar = parseInt(d.numero, 10) === currentCounterGlobal;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-700';
      tr.innerHTML = `
        <td class="px-4 py-2">${d.codigo}</td>
        <td class="px-4 py-2">${d.nombreDocumento}</td>
        <td class="px-4 py-2">${d.creadoPorEmail}</td>
        <td class="px-4 py-2">${fechaHora}</td>
        <td class="px-4 py-2 text-right">
          <button data-id="${d.id}" data-nombre="${d.nombreDocumento}" class="btn-edit">✏️</button>
          <button data-id="${d.id}" data-numero="${d.numero}" class="btn-delete" ${puedeEliminar ? '' : 'disabled'}>🗑️</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Editar / Eliminar delegado
  tableBody.addEventListener('click', async e => {
    const btn = e.target;
    if (btn.classList.contains('btn-delete')) {
      // Validación extra para evitar bypass
      const numeroCite = parseInt(btn.dataset.numero, 10);
      if (numeroCite !== currentCounterGlobal) {
        return Toast.fire({ icon: 'warning', title: 'Solo puedes eliminar el último CITE.' });
      }

      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar este CITE?',
        text: 'Se actualizará el contador.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar'
      });
      if (!isConfirmed) return;

      const counterRef = db.collection('counters').doc('cites');
      try {
        await db.runTransaction(async tx => {
          const ctr     = await tx.get(counterRef);
          const current = ctr.data().current;
          if (current <= 1) tx.delete(counterRef);
          else             tx.update(counterRef, { current: current - 1 });
          tx.delete(db.collection('cites').doc(btn.dataset.id));
        });
        Toast.fire({ icon: 'success', title: 'CITE eliminado y contador ajustado.' });
        cargarUltimos();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      }
    }

    if (btn.classList.contains('btn-edit')) {
      const { value: nuevoNombre } = await Swal.fire({
        title: 'Editar nombre de documento',
        input: 'text',
        inputValue: btn.dataset.nombre,
        showCancelButton: true,
        confirmButtonText: 'Guardar'
      });
      if (!nuevoNombre?.trim()) return;
      try {
        await db.collection('cites').doc(btn.dataset.id)
                .update({ nombreDocumento: nuevoNombre.trim() });
        Toast.fire({ icon: 'success', title: 'CITE actualizado.' });
        cargarUltimos();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      }
    }
  });

  // Exportar todos los CITES a CSV
  async function exportToExcel() {
    const snap = await db.collection('cites').get();
    const rows = [['Código','Documento','Creado por','Fecha']];
    snap.forEach(d => {
      const { codigo, nombreDocumento, creadoPorEmail, fecha } = d.data();
      const fechaStr = fecha ? fecha.toDate().toLocaleString('es-ES') : '';
      rows.push([codigo, nombreDocumento, creadoPorEmail, fechaStr]);
    });
    const csv = rows
      .map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'cites_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
});

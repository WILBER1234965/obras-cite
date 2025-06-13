
        // Data storage
        let cites = JSON.parse(localStorage.getItem('cites')) || [];
        let users = JSON.parse(localStorage.getItem('users')) || [];
        let currentUser = null;
        let isSuperadmin = false;

        // Initialize with superadmin user if doesn't exist
        if (users.length === 0) {
            users = [{
                username: 'willan',
                password: 'willan',
                name: 'Superadmin',
                isSuperadmin: true,
                id: generateId()
            }];
            localStorage.setItem('users', JSON.stringify(users));
        }

        // DOM elements
        const loginContainer = document.getElementById('login-container');
        const appContainer = document.getElementById('app-container');
        const loginForm = document.getElementById('login-form');
        const loginError = document.getElementById('login-error');
        const logoutBtn = document.getElementById('logout-btn');

        // Sidebar and menu
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menu-toggle');
        const closeSidebar = document.getElementById('close-sidebar');

        // Navigation
        const navDashboard = document.getElementById('nav-dashboard');
        const navGenerate = document.getElementById('nav-generate');
        const navMyCites = document.getElementById('nav-my-cites');
        const navAllCites = document.getElementById('nav-all-cites');
        const navUsers = document.getElementById('nav-users');
        const navGenerateContainer = document.getElementById('nav-generate-container');
        const navMyCitesContainer = document.getElementById('nav-my-cites-container');
        const navAllCitesContainer = document.getElementById('nav-all-cites-container');
        const navUsersContainer = document.getElementById('nav-users-container');

        // Pages
        const dashboardPage = document.getElementById('dashboard-page');
        const myCitesPage = document.getElementById('my-cites-page');
        const allCitesPage = document.getElementById('all-cites-page');
        const usersPage = document.getElementById('users-page');
        const pageTitle = document.getElementById('page-title');
        const viewAllCites = document.getElementById('view-all-cites');

        // Dashboard elements
        const totalCites = document.getElementById('total-cites');
        const userCites = document.getElementById('user-cites');
        const lastDate = document.getElementById('last-date');
        const recentCites = document.getElementById('recent-cites');
        const noRecentCites = document.getElementById('no-recent-cites');
        const citeForm = document.getElementById('cite-form');
        const documentName = document.getElementById('document-name');
        const generatedCite = document.getElementById('generated-cite');
        const citeInfo = document.getElementById('cite-info');
        const citeUser = document.getElementById('cite-user');
        const citeDate = document.getElementById('cite-date');

        // My CITES page
        const myCitesList = document.getElementById('my-cites-list');
        const noMyCites = document.getElementById('no-my-cites');
        const refreshMyCites = document.getElementById('refresh-my-cites');
        const generateFromMyCites = document.getElementById('generate-from-my-cites');

        // All CITES page
        const allCitesList = document.getElementById('all-cites-list');
        const noCites = document.getElementById('no-cites');
        const refreshAllCites = document.getElementById('refresh-all-cites');
        const exportCites = document.getElementById('export-cites');

        // Users page
        const usersList = document.getElementById('users-list');
        const addUserBtn = document.getElementById('add-user-btn');

        // Modals
        const addUserModal = document.getElementById('add-user-modal');
        const closeAddUserModal = document.getElementById('close-add-user-modal');
        const cancelAddUser = document.getElementById('cancel-add-user');
        const addUserForm = document.getElementById('add-user-form');
        const newUsername = document.getElementById('new-username');
        const newName = document.getElementById('new-name');
        const newPassword = document.getElementById('new-password');
        const newPasswordConfirm = document.getElementById('new-password-confirm');
        const addUserError = document.getElementById('add-user-error');

        const editCiteModal = document.getElementById('edit-cite-modal');
        const closeEditCiteModal = document.getElementById('close-edit-cite-modal');
        const cancelEditCite = document.getElementById('cancel-edit-cite');
        const editCiteForm = document.getElementById('edit-cite-form');
        const editCiteId = document.getElementById('edit-cite-id');
        const editCiteNumber = document.getElementById('edit-cite-number');
        const editDocumentName = document.getElementById('edit-document-name');
        const editCiteError = document.getElementById('edit-cite-error');

        const deleteConfirmModal = document.getElementById('delete-confirm-modal');
        const closeDeleteModal = document.getElementById('close-delete-modal');
        const cancelDelete = document.getElementById('cancel-delete');
        const confirmDelete = document.getElementById('confirm-delete');
        const deleteModalTitle = document.getElementById('delete-modal-title');
        const deleteModalMessage = document.getElementById('delete-modal-message');

        // Other UI elements
        const profileBtn = document.getElementById('profile-btn');
        const usernameDisplay = document.getElementById('username-display');
        const profileName = document.getElementById('profile-name');

        // Helper functions
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substring(2);
        }

        function formatDate(date) {
            const d = new Date(date);
            return d.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function showPage(page) {
            dashboardPage.classList.add('hidden');
            myCitesPage.classList.add('hidden');
            allCitesPage.classList.add('hidden');
            usersPage.classList.add('hidden');
            
            page.classList.remove('hidden');
            pageTitle.textContent = page.querySelector('h2') ? page.querySelector('h2').textContent : 'Inicio';
        }

        function updateDashboardStats() {
            totalCites.textContent = cites.length;
            
            if (currentUser) {
                const userCitesCount = cites.filter(cite => cite.userId === currentUser.id).length;
                userCites.textContent = userCitesCount;
                
                if (cites.length > 0) {
                    const lastCite = cites.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                    lastDate.textContent = formatDate(lastCite.date);
                } else {
                    lastDate.textContent = 'No hay CITES';
                }
            }
        }

        function displayRecentCites() {
            recentCites.innerHTML = '';
            
            if (cites.length === 0) {
                noRecentCites.classList.remove('hidden');
                return;
            }
            
            noRecentCites.classList.add('hidden');
            
            const recent = isSuperadmin 
                ? [...cites].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
                : [...cites].filter(c => c.userId === currentUser.id).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
            
            if (recent.length === 0) {
                noRecentCites.classList.remove('hidden');
                return;
            }
            
            recent.forEach(cite => {
                const user = users.find(u => u.id === cite.userId) || { name: 'Usuario desconocido' };
                
                const row = document.createElement('tr');
                row.className = 'border-b border-white/20 hover:bg-white/10';
                row.innerHTML = `
                    <td class="py-3">${cite.citeNumber}</td>
                    <td class="py-3">${cite.documentName}</td>
                    <td class="py-3">${isSuperadmin ? user.name : 'Tú'}</td>
                    <td class="py-3">${formatDate(cite.date)}</td>
                    <td class="py-3">
                        <button class="edit-cite-btn mr-2 text-blue-300 hover:text-blue-400" data-id="${cite.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-cite-btn text-red-300 hover:text-red-400" data-id="${cite.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                recentCites.appendChild(row);
            });
        }

        function displayMyCites() {
            myCitesList.innerHTML = '';
            
            const userCites = cites.filter(cite => cite.userId === currentUser.id).sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (userCites.length === 0) {
                noMyCites.classList.remove('hidden');
                return;
            }
            
            noMyCites.classList.add('hidden');
            
            userCites.forEach(cite => {
                const row = document.createElement('tr');
                row.className = 'border-b border-white/20 hover:bg-white/10';
                row.innerHTML = `
                    <td class="py-3">${cite.citeNumber}</td>
                    <td class="py-3">${cite.documentName}</td>
                    <td class="py-3">${formatDate(cite.date)}</td>
                    <td class="py-3">
                        <button class="edit-cite-btn mr-2 text-blue-300 hover:text-blue-400" data-id="${cite.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-cite-btn text-red-300 hover:text-red-400" data-id="${cite.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                myCitesList.appendChild(row);
            });
        }

        function displayAllCites() {
            allCitesList.innerHTML = '';
            
            if (cites.length === 0) {
                noCites.classList.remove('hidden');
                return;
            }
            
            noCites.classList.add('hidden');
            
            cites.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(cite => {
                const user = users.find(u => u.id === cite.userId) || { name: 'Usuario desconocido' };
                
                const row = document.createElement('tr');
                row.className = 'border-b border-white/20 hover:bg-white/10';
                row.innerHTML = `
                    <td class="py-3">${cite.citeNumber}</td>
                    <td class="py-3">${cite.documentName}</td>
                    <td class="py-3">${user.name}</td>
                    <td class="py-3">${formatDate(cite.date)}</td>
                    <td class="py-3">
                        <button class="edit-cite-btn mr-2 text-blue-300 hover:text-blue-400" data-id="${cite.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-cite-btn text-red-300 hover:text-red-400" data-id="${cite.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                allCitesList.appendChild(row);
            });
        }

        function displayUsers() {
            usersList.innerHTML = '';
            
            users.forEach(user => {
                if (user.username === currentUser.username) return; // Skip current user
                
                const userCitesCount = cites.filter(cite => cite.userId === user.id).length;
                
                const row = document.createElement('tr');
                row.className = 'border-b border-white/20 hover:bg-white/10';
                row.innerHTML = `
                    <td class="py-3">${user.username}</td>
                    <td class="py-3">${user.name}</td>
                    <td class="py-3">${userCitesCount}</td>
                    <td class="py-3">
                        <button class="delete-user-btn text-red-300 hover:text-red-400" data-id="${user.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                usersList.appendChild(row);
            });
        }

function generateCiteNumber() {
  const currentYear = new Date().getFullYear();
  let seq = 1;

  if (cites.length > 0) {
    // si falta citeNumber, lo convertimos en ''
    const lastCiteStr = String(cites[cites.length - 1].citeNumber || '');
    const match = lastCiteStr.match(/Nº\s*(\d{1,3})/);
    seq = match ? parseInt(match[1], 10) + 1 : cites.length + 1;
  }

  return `GAMT/D.OO.PP. Nº ${String(seq).padStart(3,'0')}/${currentYear}`;
}


        function exportToExcel() {
            // Convert cites to worksheet
            const data = cites.map(cite => {
                const user = users.find(u => u.id === cite.userId) || { name: 'Desconocido' };
                return {
                    'N° CITE': cite.citeNumber,
                    'Documento': cite.documentName,
                    'Usuario': user.name,
                    'Fecha': formatDate(cite.date)
                };
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "CITES");
            XLSX.writeFile(wb, `CITES_${new Date().toISOString().slice(0,10)}.xlsx`);
        }

        // Event Listeners
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const user = users.find(u => u.username === username && u.password === password);
            
            if (user) {
                currentUser = user;
                isSuperadmin = user.isSuperadmin || false;
                
                // Update UI for user type
                if (isSuperadmin) {
                    navAllCitesContainer.classList.remove('hidden');
                    navUsersContainer.classList.remove('hidden');
                } else {
                    navAllCitesContainer.classList.add('hidden');
                    navUsersContainer.classList.add('hidden');
                }
                
                // Set user info
                profileName.textContent = user.name;
                usernameDisplay.textContent = user.name;
                
                // Show app and hide login
                loginContainer.classList.add('hidden');
                appContainer.classList.remove('hidden');
                
                // Initialize dashboard
                updateDashboardStats();
                displayRecentCites();
                
                // Clear form
                loginForm.reset();
                loginError.classList.add('hidden');
            } else {
                loginError.textContent = 'Usuario o contraseña incorrectos';
                loginError.classList.remove('hidden');
            }
        });

        logoutBtn.addEventListener('click', function() {
            currentUser = null;
            appContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        });

        // Navigation
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('-translate-x-full');
        });

        closeSidebar.addEventListener('click', function() {
            sidebar.classList.add('-translate-x-full');
        });

        navDashboard.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(dashboardPage);
            sidebar.classList.add('-translate-x-full');
        });

        navGenerate.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(dashboardPage);
            documentName.focus();
            sidebar.classList.add('-translate-x-full');
        });

        navMyCites.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(myCitesPage);
            displayMyCites();
            sidebar.classList.add('-translate-x-full');
        });

        navAllCites.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(allCitesPage);
            displayAllCites();
            sidebar.classList.add('-translate-x-full');
        });

        navUsers.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(usersPage);
            displayUsers();
            sidebar.classList.add('-translate-x-full');
        });

        viewAllCites.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(allCitesPage);
            displayAllCites();
        });

        // Generate CITE
citeForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const docName = documentName.value.trim();
    if (!docName) return;
    
    const citeNumber = generateCiteNumber();
    const newCite = {
        id: generateId(),
        citeNumber,
        documentName: docName,
        userId: currentUser.id,
        date: new Date().toISOString()
    };
    
    cites.push(newCite);
    localStorage.setItem('cites', JSON.stringify(cites));
    
    // Actualiza UI
    generatedCite.textContent = citeNumber;
    citeUser.textContent = currentUser.name;
    citeDate.textContent = formatDate(newCite.date);
    citeInfo.classList.remove('hidden');
    
    updateDashboardStats();
    displayRecentCites();
    
    documentName.value = '';
    documentName.focus();
});


        // Refresh functions
        refreshMyCites.addEventListener('click', function() {
            displayMyCites();
        });

        refreshAllCites.addEventListener('click', function() {
            displayAllCites();
        });

        // Generate from My CITES page
        generateFromMyCites.addEventListener('click', function() {
            showPage(dashboardPage);
            documentName.focus();
        });

        // Export cites
        exportCites.addEventListener('click', function() {
            exportToExcel();
        });

        // Users management
        addUserBtn.addEventListener('click', function() {
            addUserModal.classList.remove('hidden');
            addUserForm.reset();
            addUserError.classList.add('hidden');
        });

        closeAddUserModal.addEventListener('click', function() {
            addUserModal.classList.add('hidden');
        });

        cancelAddUser.addEventListener('click', function() {
            addUserModal.classList.add('hidden');
        });

        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = newUsername.value.trim();
            const name = newName.value.trim();
            const password = newPassword.value;
            const passwordConfirm = newPasswordConfirm.value;
            
            if (password !== passwordConfirm) {
                addUserError.textContent = 'Las contraseñas no coinciden';
                addUserError.classList.remove('hidden');
                return;
            }
            
            if (users.some(u => u.username === username)) {
                addUserError.textContent = 'El nombre de usuario ya existe';
                addUserError.classList.remove('hidden');
                return;
            }
            
            const newUser = {
                id: generateId(),
                username,
                name,
                password,
                isSuperadmin: false
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            displayUsers();
            addUserModal.classList.add('hidden');
        });

        // Users list event delegation
        usersList.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-user-btn') || e.target.parentElement.classList.contains('delete-user-btn')) {
                const btn = e.target.classList.contains('delete-user-btn') ? e.target : e.target.parentElement;
                const userId = btn.getAttribute('data-id');
                const user = users.find(u => u.id === userId);
                
                deleteModalTitle.textContent = `Eliminar Usuario`;
                deleteModalMessage.textContent = `¿Estás seguro que deseas eliminar al usuario "${user.name}"? Esta acción no se puede deshacer.`;
                
                deleteConfirmModal.classList.remove('hidden');
                
                confirmDelete.onclick = function() {
                    // Check if user has cites
                    const userCites = cites.filter(cite => cite.userId === userId);
                    
                    if (userCites.length > 0) {
                        // Remove user's cites
                        cites = cites.filter(cite => cite.userId !== userId);
                        localStorage.setItem('cites', JSON.stringify(cites));
                    }
                    
                    // Remove user
                    users = users.filter(u => u.id !== userId);
                    localStorage.setItem('users', JSON.stringify(users));
                    
                    displayUsers();
                    updateDashboardStats();
                    displayRecentCites();
                    
                    deleteConfirmModal.classList.add('hidden');
                };
            }
        });

        // Close delete modal
        closeDeleteModal.addEventListener('click', function() {
            deleteConfirmModal.classList.add('hidden');
        });

        cancelDelete.addEventListener('click', function() {
            deleteConfirmModal.classList.add('hidden');
        });

        // Edit cite modal
        function openEditCiteModal(citeId) {
            const cite = cites.find(c => c.id === citeId);
            if (!cite) return;
            
            editCiteId.value = cite.id;
            editCiteNumber.value = cite.citeNumber;
            editDocumentName.value = cite.documentName;
            editCiteError.classList.add('hidden');
            
            editCiteModal.classList.remove('hidden');
        }

        closeEditCiteModal.addEventListener('click', function() {
            editCiteModal.classList.add('hidden');
        });

        cancelEditCite.addEventListener('click', function() {
            editCiteModal.classList.add('hidden');
        });

        editCiteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const citeId = editCiteId.value;
            const newDocumentName = editDocumentName.value.trim();
            
            if (!newDocumentName) {
                editCiteError.textContent = 'El nombre del documento no puede estar vacío';
                editCiteError.classList.remove('hidden');
                return;
            }
            
            const citeIndex = cites.findIndex(c => c.id === citeId);
            if (citeIndex === -1) {
                editCiteError.textContent = 'No se encontró el CITE a editar';
                editCiteError.classList.remove('hidden');
                return;
            }
            
            // Check permissions
            const cite = cites[citeIndex];
            if (!isSuperadmin && cite.userId !== currentUser.id) {
                editCiteError.textContent = 'No tienes permiso para editar este CITE';
                editCiteError.classList.remove('hidden');
                return;
            }
            
            // Update cite
            cites[citeIndex] = {
                ...cite,
                documentName: newDocumentName
            };
            
            localStorage.setItem('cites', JSON.stringify(cites));
            
            // Update UI
            if (!dashboardPage.classList.contains('hidden')) {
                updateDashboardStats();
                displayRecentCites();
            }
            
            if (!myCitesPage.classList.contains('hidden')) {
                displayMyCites();
            }
            
            if (!allCitesPage.classList.contains('hidden')) {
                displayAllCites();
            }
            
            editCiteModal.classList.add('hidden');
        });

        // Delete cite modal
     function prepareDeleteCite(citeId) {
    const cite = cites.find(c => c.id === citeId);
    if (!cite) return;
    
    deleteModalTitle.textContent = `Eliminar CITE`;
    deleteModalMessage.textContent = `¿Estás seguro de eliminar "${cite.citeNumber}"?`;
    
    // Asigna el handler al botón de confirmar
    confirmDelete.onclick = function() {
        // Permisos
        if (!isSuperadmin && cite.userId !== currentUser.id) {
            alert('No tienes permiso para eliminar este CITE');
            deleteConfirmModal.classList.add('hidden');
            return;
        }
        
        // Elimina y guarda
        cites = cites.filter(c => c.id !== citeId);
        localStorage.setItem('cites', JSON.stringify(cites));
        
        // Refresca vistas
        updateDashboardStats();
        displayRecentCites();
        if (myCitesPage.classList.contains('hidden') === false) displayMyCites();
        if (allCitesPage.classList.contains('hidden') === false) displayAllCites();
        
        deleteConfirmModal.classList.add('hidden');
    };
    
    deleteConfirmModal.classList.remove('hidden');
}


        // Event delegation for edit and delete buttons
// Delegación de eventos: usa closest() para buscar el botón aunque pinches en el icono <i>
document.addEventListener('click', function(e) {
    const editBtn = e.target.closest('.edit-cite-btn');
    if (editBtn) {
        openEditCiteModal(editBtn.dataset.id);
        return;
    }

    const delBtn = e.target.closest('.delete-cite-btn');
    if (delBtn) {
        prepareDeleteCite(delBtn.dataset.id);
        return;
    }
});


        // Initialize UI
        if (users.length === 0) {
            users = [{
                username: 'willan',
                password: 'willan',
                name: 'Superadmin',
                isSuperadmin: true,
                id: generateId()
            }];
            localStorage.setItem('users', JSON.stringify(users));
        }

/**
 * MIRA E-Commerce - Admin Panel JavaScript
 * Integrato con API PHP Backend
 */

// ============================================================================
// CONFIGURAZIONE
// ============================================================================
const API_BASE = '/api';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
let currentProducts = [];
let allProducts = [];
let currentCategories = [];
let currentTags = [];
let currentPage = 1;
const itemsPerPage = 10;
let editingProductId = null;

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 MIRA Admin Panel inizializzato');
    
    // Verifica autenticazione admin
    checkAdminAuth();
    
    // Inizializza componenti UI
    initNavigation();
    initModals();
    initProductForm();
    initFilters();
    initPagination();
    
    // Carica dati iniziali
    loadProducts();
    loadCategories();
    loadTags();
});

// ============================================================================
// AUTHENTICATION
// ============================================================================
function checkAdminAuth() {
    const token = localStorage.getItem('miraToken');
    const user = localStorage.getItem('miraUser');
    
    if (!token || !user) {
        alert('⚠️ Accesso non autorizzato. Effettua il login.');
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        const userData = JSON.parse(user);
        
        // Verifica permessi admin
        if (!userData.is_admin && userData.email !== 'francminu08@gmail.com') {
            alert('⚠️ Non hai i permessi necessari per accedere al pannello admin');
            window.location.href = 'index.html';
            return;
        }
        
        // Mostra info utente nella UI
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = `${userData.first_name} ${userData.last_name}`;
        }
        
        console.log('✅ Autenticazione admin verificata:', userData.email);
        
    } catch (error) {
        console.error('❌ Errore parsing user data:', error);
        logout();
    }
}

function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        localStorage.removeItem('miraToken');
        localStorage.removeItem('miraUser');
        window.location.href = 'auth.html';
    }
}

// ============================================================================
// API HELPERS
// ============================================================================
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('miraToken');
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        // Gestione errori API
        if (!data.success) {
            throw new Error(data.message || 'Errore sconosciuto');
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ API Error:', error);
        
        // Se token scaduto, redirect al login
        if (error.message.includes('Token') || error.message.includes('401')) {
            alert('⚠️ Sessione scaduta. Effettua nuovamente il login.');
            logout();
        }
        
        throw error;
    }
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadProducts() {
    showLoading();
    
    try {
        const response = await apiRequest('/products.php?limit=1000'); // Carica tutti i prodotti
        
        if (response.success && response.data.products) {
            allProducts = response.data.products;
            applyFilters(); // Applica filtri e mostra prodotti
            console.log('✅ Prodotti caricati:', allProducts.length);
        } else {
            throw new Error('Formato risposta non valido');
        }
        
    } catch (error) {
        console.error('❌ Errore caricamento prodotti:', error);
        showToast('Errore nel caricamento dei prodotti', 'error');
    } finally {
        hideLoading();
    }
}

async function loadCategories() {
    try {
        // La tua API non ha endpoint categories separato, carichiamo da products
        const uniqueCategories = [...new Set(allProducts
            .filter(p => p.category_name)
            .map(p => ({
                id: p.category_id,
                name: p.category_name,
                slug: p.category_slug
            })))
        ];
        
        currentCategories = uniqueCategories;
        populateCategorySelects();
        populateCategoryFilter();
        
        console.log('✅ Categorie caricate:', currentCategories.length);
        
    } catch (error) {
        console.error('❌ Errore caricamento categorie:', error);
    }
}

async function loadTags() {
    try {
        // Estrai tags univoci dai prodotti
        const allTags = new Set();
        allProducts.forEach(product => {
            if (product.tags && Array.isArray(product.tags)) {
                product.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        currentTags = Array.from(allTags).map(tag => ({ slug: tag, name: tag }));
        populateTagsCheckboxes();
        
        console.log('✅ Tags caricati:', currentTags.length);
        
    } catch (error) {
        console.error('❌ Errore caricamento tags:', error);
    }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================
async function createProduct(formData) {
    try {
        showLoading();
        
        const response = await apiRequest('/products.php', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response.success) {
            showToast('✅ Prodotto creato con successo!', 'success');
            closeModal('productModal');
            loadProducts(); // Ricarica lista
        }
        
    } catch (error) {
        console.error('❌ Errore creazione prodotto:', error);
        showToast(`Errore: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function updateProduct(productId, formData) {
    try {
        showLoading();
        
        const response = await apiRequest(`/products.php?id=${productId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        if (response.success) {
            showToast('✅ Prodotto aggiornato con successo!', 'success');
            closeModal('productModal');
            loadProducts();
        }
        
    } catch (error) {
        console.error('❌ Errore aggiornamento prodotto:', error);
        showToast(`Errore: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteProduct(productId) {
    if (!confirm('⚠️ Sei sicuro di voler eliminare questo prodotto?')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await apiRequest(`/products.php?id=${productId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast('✅ Prodotto eliminato con successo', 'success');
            loadProducts();
        }
        
    } catch (error) {
        console.error('❌ Errore eliminazione prodotto:', error);
        showToast(`Errore: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// ============================================================================
// UI RENDERING
// ============================================================================
function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (currentProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    Nessun prodotto trovato
                </td>
            </tr>
        `;
        return;
    }
    
    currentProducts.forEach(product => {
        const row = document.createElement('tr');
        
        const price = product.is_discount && product.discount_price 
            ? product.discount_price 
            : product.price;
        
        const priceDisplay = product.is_discount && product.discount_price
            ? `<span style="text-decoration: line-through; color: #999;">€${parseFloat(product.price).toFixed(2)}</span><br>
               <strong style="color: #e74c3c;">€${parseFloat(product.discount_price).toFixed(2)}</strong>`
            : `€${parseFloat(product.price).toFixed(2)}`;
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="product-checkbox" data-id="${product.id}">
            </td>
            <td>
                <img src="${product.image_url}" alt="${product.name}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
            </td>
            <td><strong>${product.name}</strong></td>
            <td>${product.category_name || '-'}</td>
            <td>${priceDisplay}</td>
            <td>
                <span class="badge ${product.stock > 0 ? 'badge-success' : 'badge-danger'}">
                    ${product.stock} unità
                </span>
            </td>
            <td>
                <span class="badge ${product.is_active ? 'badge-success' : 'badge-danger'}">
                    ${product.is_active ? 'Attivo' : 'Inattivo'}
                </span>
            </td>
            <td>
                <button class="btn-icon" onclick="editProduct(${product.id})" title="Modifica">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                    </svg>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteProduct(${product.id})" title="Elimina">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Aggiorna contatori
    updateStats();
}

function updateStats() {
    const totalEl = document.getElementById('totalProducts');
    const activeEl = document.getElementById('activeProducts');
    const lowStockEl = document.getElementById('lowStockProducts');
    
    if (totalEl) totalEl.textContent = allProducts.length;
    if (activeEl) activeEl.textContent = allProducts.filter(p => p.is_active).length;
    if (lowStockEl) lowStockEl.textContent = allProducts.filter(p => p.stock < 10).length;
}

// ============================================================================
// FILTERS & SEARCH
// ============================================================================
function initFilters() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    let filtered = [...allProducts];
    
    // Search
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Category
    const category = document.getElementById('categoryFilter')?.value;
    if (category) {
        filtered = filtered.filter(p => p.category_slug === category);
    }
    
    // Status
    const status = document.getElementById('statusFilter')?.value;
    if (status === 'active') {
        filtered = filtered.filter(p => p.is_active);
    } else if (status === 'inactive') {
        filtered = filtered.filter(p => !p.is_active);
    }
    
    // Reset to page 1
    currentPage = 1;
    
    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    currentProducts = filtered.slice(startIndex, endIndex);
    
    renderProducts();
    renderPagination(filtered.length);
}

// ============================================================================
// PAGINATION
// ============================================================================
function initPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                applyFilters();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(allProducts.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                applyFilters();
            }
        });
    }
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationEl = document.getElementById('paginationNumbers');
    
    if (!paginationEl) return;
    
    paginationEl.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-number ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => {
            currentPage = i;
            applyFilters();
        };
        paginationEl.appendChild(btn);
    }
    
    // Update prev/next buttons state
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// ============================================================================
// PRODUCT FORM
// ============================================================================
function initProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('productName').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            discount_price: document.getElementById('productDiscountPrice').value 
                ? parseFloat(document.getElementById('productDiscountPrice').value) 
                : null,
            is_discount: document.getElementById('productIsDiscount').checked ? 1 : 0,
            stock: parseInt(document.getElementById('productStock').value),
            image_url: document.getElementById('productImage').value.trim(),
            category_id: document.getElementById('productCategory').value || null,
            is_featured: document.getElementById('productIsFeatured').checked ? 1 : 0,
            is_active: document.getElementById('productIsActive').checked ? 1 : 0,
            tags: getSelectedTags(),
            specs: getSpecifications()
        };
        
        // Validazione
        if (!formData.name || !formData.description || !formData.price || !formData.image_url) {
            showToast('⚠️ Compila tutti i campi obbligatori', 'error');
            return;
        }
        
        if (editingProductId) {
            await updateProduct(editingProductId, formData);
        } else {
            await createProduct(formData);
        }
    });
    
    // Add spec row button
    const addSpecBtn = document.getElementById('addSpecRow');
    if (addSpecBtn) {
        addSpecBtn.addEventListener('click', addSpecificationRow);
    }
}

function openProductModal(productId = null) {
    editingProductId = productId;
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');
    
    if (!modal || !form) return;
    
    if (productId) {
        // Edit mode
        title.textContent = 'Modifica Prodotto';
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            populateProductForm(product);
        }
    } else {
        // Create mode
        title.textContent = 'Nuovo Prodotto';
        form.reset();
        clearSpecifications();
        editingProductId = null;
    }
    
    modal.classList.add('active');
}

function populateProductForm(product) {
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDiscountPrice').value = product.discount_price || '';
    document.getElementById('productIsDiscount').checked = product.is_discount;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productImage').value = product.image_url;
    document.getElementById('productCategory').value = product.category_id || '';
    document.getElementById('productIsFeatured').checked = product.is_featured;
    document.getElementById('productIsActive').checked = product.is_active;
    
    // Set tags
    if (product.tags && Array.isArray(product.tags)) {
        document.querySelectorAll('.tag-checkbox').forEach(checkbox => {
            checkbox.checked = product.tags.includes(checkbox.value);
        });
    }
    
    // Set specs
    clearSpecifications();
    if (product.specs && typeof product.specs === 'object') {
        Object.entries(product.specs).forEach(([key, value]) => {
            addSpecificationRow(key, value);
        });
    }
}

function editProduct(productId) {
    openProductModal(productId);
}

function addSpecificationRow(key = '', value = '') {
    const container = document.getElementById('specificationsContainer');
    if (!container) return;
    
    const row = document.createElement('div');
    row.className = 'spec-row';
    row.innerHTML = `
        <input type="text" class="spec-key" placeholder="Nome (es: CPU)" value="${key}">
        <input type="text" class="spec-value" placeholder="Valore (es: Intel i7)" value="${value}">
        <button type="button" class="btn-icon btn-danger" onclick="this.parentElement.remove()">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
        </button>
    `;
    container.appendChild(row);
}

function clearSpecifications() {
    const container = document.getElementById('specificationsContainer');
    if (container) {
        container.innerHTML = '';
    }
}

function getSpecifications() {
    const specs = {};
    document.querySelectorAll('.spec-row').forEach(row => {
        const key = row.querySelector('.spec-key').value.trim();
        const value = row.querySelector('.spec-value').value.trim();
        if (key && value) {
            specs[key] = value;
        }
    });
    return specs;
}

function getSelectedTags() {
    const tags = [];
    document.querySelectorAll('.tag-checkbox:checked').forEach(checkbox => {
        tags.push(checkbox.value);
    });
    return tags;
}

function populateCategorySelects() {
    const select = document.getElementById('productCategory');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Seleziona Categoria --</option>';
    currentCategories.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
}

function populateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    if (!select) return;
    
    select.innerHTML = '<option value="">Tutte le categorie</option>';
    currentCategories.forEach(cat => {
        select.innerHTML += `<option value="${cat.slug}">${cat.name}</option>`;
    });
}

function populateTagsCheckboxes() {
    const container = document.getElementById('tagsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    currentTags.forEach(tag => {
        const label = document.createElement('label');
        label.className = 'tag-label';
        label.innerHTML = `
            <input type="checkbox" class="tag-checkbox" value="${tag.slug}">
            ${tag.name}
        `;
        container.appendChild(label);
    });
}

// ============================================================================
// MODALS
// ============================================================================
function initModals() {
    // Close buttons
    document.querySelectorAll('.modal-close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal').id);
        });
    });
    
    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================
function initNavigation() {
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Switch sections (future implementation)
            const section = link.getAttribute('href').substring(1);
            console.log('Navigating to:', section);
        });
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    loader.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 8px; text-align: center;">
            <div class="spinner"></div>
            <p style="margin-top: 15px; color: #333;">Caricamento...</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.remove();
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================================
// BULK ACTIONS
// ============================================================================
function selectAllProducts() {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    const selectAllCheckbox = document.getElementById('selectAll');
    checkboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
    });
}

function getSelectedProductIds() {
    const selected = [];
    document.querySelectorAll('.product-checkbox:checked').forEach(cb => {
        selected.push(parseInt(cb.dataset.id));
    });
    return selected;
}

// ============================================================================
// CSS ANIMATIONS (injected dynamically)
// ============================================================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #9b59b6;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log('✅ Admin Panel completamente caricato');
// ================================
// Search.js completo MISUSTECH
// ================================

// Funzione per collegare il form di ricerca
function initSearchForm() {
    const searchForm = document.getElementById('searchForm');
    if(!searchForm) return;
    const searchInput = searchForm.querySelector('input');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if(!query) return;

        // Salva query su localStorage
        localStorage.setItem('searchQuery', query.toLowerCase());

        // Reindirizza a risultati
        window.location.href = 'risultati.html';
    });
}

// ================================
// Collegamento form dopo caricamento header
// ================================
fetch('header.html')
.then(res => res.text())
.then(data => {
    document.getElementById('header-placeholder').innerHTML = data;

    // Inizializza il form
    initSearchForm();
})
.catch(err => console.error("Errore nel caricamento header:", err));

// ================================
// Caricamento prodotti su risultati.html
// ================================
document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('productsContainer');
    if(!productsContainer) return;

    const searchQuery = localStorage.getItem('searchQuery')?.toLowerCase() || "";

    fetch('products.json')
    .then(res => res.json())
    .then(data => {
        const filtered = data.filter(p =>
            p.name.toLowerCase().includes(searchQuery) ||
            p.desc.toLowerCase().includes(searchQuery)
        );

        if(filtered.length === 0){
            // Nessun prodotto trovato -> notfound.html
            window.location.href = 'notfound.html';
            return;
        }

        // Mostra i prodotti filtrati
        filtered.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product';
            div.dataset.name = p.name;
            div.dataset.price = p.price;
            div.dataset.desc = p.desc;

            div.innerHTML = `
                <img src="${p.img}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p class="product-desc">${p.desc.substring(0,50)}...</p>
                <button class="add-to-cart">Aggiungi al carrello</button>
            `;

            productsContainer.appendChild(div);

            // Aggiungi al carrello
            div.querySelector('.add-to-cart').addEventListener('click', () => {
                const existing = cart.find(item => item.name === p.name);
                if(existing) existing.qty += 1;
                else cart.push({...p, qty:1});
                updateCart();
            });
        });
    })
    .catch(err => console.error("Errore nel caricamento prodotti:", err));
});

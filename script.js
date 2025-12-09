// ========================= CREA CARRELLO DINAMICAMENTE =========================
function createCart() {
    const cartSidebar = document.createElement('aside');
    cartSidebar.id = 'cartSidebar';
    cartSidebar.className = 'cart-sidebar';
    cartSidebar.innerHTML = `
        <h2 class="cart-title">Carrello</h2>
        <div id="cartItems">
            <p>Il carrello è vuoto</p>
        </div>
        <div class="cart-total">
            <p>Totale: € <span id="cartTotal">0.00</span></p>
        </div>
        <div class="cart-buttons">
            <button id="closeCart">Chiudi</button>
            <button id="navigateHome">Continua Shopping</button>
        </div>
    `;
    document.body.appendChild(cartSidebar);
}

createCart();

// ========================= CONTACT WIDGET - LINK A PAGINA =========================
function createContactWidget() {
    const widget = document.createElement('div');
    widget.className = 'contact-widget';
    widget.innerHTML = `
        <a href="contattaci.html" class="contact-btn">CONTATTACI</a>
    `;
    document.body.appendChild(widget);
}

createContactWidget();

// ========================= CART MANAGEMENT =========================
let cartObj = {};

function initCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    const navigateHome = document.getElementById('navigateHome');
    
    let cart = [];
    
    function updateCart(){
        const cartItems = document.getElementById('cartItems');
        const cartTotalEl = document.getElementById('cartTotal');
        if(!cartItems || !cartTotalEl) return;

        cartItems.innerHTML = "";
        if(cart.length === 0){
            cartItems.innerHTML = "<p style='text-align:center; color:#aaa;'>Il carrello è vuoto</p>";
        } else {
            cart.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>€ ${item.price.toFixed(2)}</p>
                        <div class="cart-item-quantity">
                            <button class="decrease">−</button>
                            <span>${item.qty}</span>
                            <button class="increase">+</button>
                            <button class="remove">✕</button>
                        </div>
                    </div>
                `;
                cartItems.appendChild(div);

                div.querySelector('.increase').addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.qty += 1;
                    updateCart();
                });
                
                div.querySelector('.decrease').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(item.qty > 1) {
                        item.qty -= 1;
                        updateCart();
                    }
                });
                
                div.querySelector('.remove').addEventListener('click', (e) => {
                    e.stopPropagation();
                    cart.splice(index, 1);
                    updateCart();
                });
            });
        }

        const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        cartTotalEl.textContent = total.toFixed(2);
    }

    updateCart();

    if(cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.toggle('active');
        });
    }
    
    if(closeCart) {
        closeCart.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
        });
    }

    if(navigateHome) {
        navigateHome.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    return { cart, updateCart, cartSidebar };
}

cartObj = initCart();

// ========================= PRODUCTS LOADING (con PAGINAZIONE) =========================
document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('productsContainer');
    if(!productsContainer) return;

    const PRODUCTS_PER_PAGE = 12;
    let allProducts = [];
    let currentPage = 1;
    let filteredProducts = [];

    fetch('products.json')
        .then(res => res.json())
        .then(products => {
            allProducts = products;
            filteredProducts = products;
            displayPage(1);
            setupPagination();
        })
        .catch(err => console.error('Errore caricamento prodotti:', err));

    function displayProducts(products) {
        productsContainer.innerHTML = '';
        
        products.forEach(prod => {
            const div = document.createElement('div');
            div.className = 'product';
            
            if(prod.discount) {
                div.classList.add('discount');
            }
            
            div.dataset.name = prod.name;
            div.dataset.price = prod.discount ? prod.discountPrice : prod.price;
            div.dataset.desc = prod.desc;
            div.dataset.img = prod.img;
            div.dataset.category = prod.category || 'all';

            let priceHTML = '';
            if(prod.discount) {
                priceHTML = `
                    <p>
                        <span class="original-price">€ ${prod.price.toFixed(2)}</span>
                        <span style="color:#9b59b6; font-weight:700; margin:10px 0;">€ ${prod.discountPrice.toFixed(2)}</span>
                    </p>
                `;
            } else {
                priceHTML = `<p style="color:#9b59b6; font-weight:700; margin:10px 0;">€ ${prod.price.toFixed(2)}</p>`;
            }

            div.innerHTML = `
                <img src="${prod.img}" alt="${prod.name}">
                <h3>${prod.name}</h3>
                <p>${prod.desc}</p>
                ${priceHTML}
                <button class="add-to-cart">Aggiungi al carrello</button>
            `;

            div.addEventListener('click', e => {
                if(!e.target.classList.contains('add-to-cart')){
                    window.location.href = `product.html?name=${encodeURIComponent(prod.name)}`;
                }
            });

            productsContainer.appendChild(div);
        });

        // Event listeners per add to cart
        const addButtons = document.querySelectorAll('.add-to-cart');
        addButtons.forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const productEl = btn.closest('.product');
                if(!productEl) return;

                const name = productEl.dataset.name;
                const price = parseFloat(productEl.dataset.price);
                const img = productEl.dataset.img;
                const desc = productEl.dataset.desc;

                const existing = cartObj.cart.find(p => p.name === name);
                if(existing) {
                    existing.qty += 1;
                } else {
                    cartObj.cart.push({name, desc, price, img, qty: 1});
                }
                
                cartObj.updateCart();
                
                const cartSidebar = document.getElementById('cartSidebar');
                if(cartSidebar) {
                    cartSidebar.classList.add('active');
                }
                
                btn.textContent = '✓ Aggiunto';
                btn.style.background = '#27ae60';
                setTimeout(() => {
                    btn.textContent = 'Aggiungi al carrello';
                    btn.style.background = '';
                }, 1500);
            });
        });
    }

    function displayPage(pageNum) {
        const start = (pageNum - 1) * PRODUCTS_PER_PAGE;
        const end = start + PRODUCTS_PER_PAGE;
        const pageProducts = filteredProducts.slice(start, end);
        
        displayProducts(pageProducts);
        currentPage = pageNum;
    }

    function setupPagination() {
        const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
        
        let paginationDiv = document.querySelector('.pagination');
        if(!paginationDiv) {
            paginationDiv = document.createElement('div');
            paginationDiv.className = 'pagination';
            productsContainer.parentElement.appendChild(paginationDiv);
        }

        paginationDiv.innerHTML = '';

        if(totalPages <= 1) return;

        if(currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn prev-btn';
            prevBtn.innerHTML = '← Indietro';
            prevBtn.addEventListener('click', () => {
                displayPage(currentPage - 1);
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
            paginationDiv.appendChild(prevBtn);
        }

        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Pagina ${currentPage} di ${totalPages}`;
        paginationDiv.appendChild(pageInfo);

        if(currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn next-btn';
            nextBtn.innerHTML = 'Avanti →';
            nextBtn.addEventListener('click', () => {
                displayPage(currentPage + 1);
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
            paginationDiv.appendChild(nextBtn);
        }
    }

    // Esponi funzioni globalmente per i filtri
    window.filterProducts = function(category) {
        if(category === 'all') {
            filteredProducts = allProducts;
        } else {
            filteredProducts = allProducts.filter(p => p.category === category);
        }
        displayPage(1);
        setupPagination();
    };
});

// ========================= PRODUCT DETAIL PAGE =========================
document.addEventListener('DOMContentLoaded', () => {
    const productAddBtn = document.querySelector('#addToCartBtn');
    
    if(productAddBtn){
        productAddBtn.addEventListener('click', () => {
            const productEl = document.querySelector('.product-detail-main');
            if(!productEl) return;

            const name = productEl.dataset.name;
            const price = parseFloat(productEl.dataset.price);
            const img = productEl.dataset.img;
            const desc = productEl.dataset.desc;
            const qtyInput = document.querySelector('#productQty');
            const qty = qtyInput ? parseInt(qtyInput.value) : 1;

            if(qty < 1) {
                alert('Inserisci una quantità valida');
                return;
            }

            const existing = cartObj.cart.find(p => p.name === name);
            if(existing) {
                existing.qty += qty;
            } else {
                cartObj.cart.push({name, desc, price, img, qty});
            }

            cartObj.updateCart();
            
            const cartSidebar = document.getElementById('cartSidebar');
            if(cartSidebar) {
                cartSidebar.classList.add('active');
            }
            
            productAddBtn.textContent = '✓ Aggiunto al carrello';
            productAddBtn.style.background = '#27ae60';
            
            setTimeout(() => {
                productAddBtn.textContent = 'Aggiungi al carrello';
                productAddBtn.style.background = '';
            }, 1500);
        });
    }
});

// ========================= SEARCH =========================
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    if(searchForm){
        searchForm.addEventListener('submit', e => {
            e.preventDefault();
            const searchInput = searchForm.querySelector('input[name="search"]');
            const query = searchInput ? searchInput.value.trim() : '';
            if(query){
                sessionStorage.setItem('searchQuery', query.toLowerCase());
                window.location.href = 'risultati.html';
            } else {
                window.location.href = 'notfound.html';
            }
        });
    }
});

// ========================= LANGUAGE =========================
document.addEventListener('DOMContentLoaded', () => {
    const languageDropdown = document.getElementById('languageDropdown');
    if(languageDropdown){
        languageDropdown.addEventListener('change', e => {
            console.log('Lingua:', e.target.value);
        });
    }
});

// ========================= FILTERS (PC GAMING PAGE) =========================
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            
            if(typeof window.filterProducts !== 'undefined') {
                window.filterProducts(category);
            }
        });
    });
});

// ========================= HAMBURGER MENU (MOBILE) =========================
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const searchLangCart = document.querySelector('.search-language-cart');
    
    if(hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            if(navMenu) {
                navMenu.classList.toggle('active');
            }
            if(searchLangCart) {
                searchLangCart.classList.toggle('active');
            }
        });

        // Chiudi menu quando clicchi su un link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                if(navMenu) navMenu.classList.remove('active');
                if(searchLangCart) searchLangCart.classList.remove('active');
            });
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('productsContainer');
    if(!productsContainer) return;

    const searchQuery = sessionStorage.getItem('searchQuery')?.toLowerCase() || "";
    const PRODUCTS_PER_PAGE = 12;
    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;

    if(!searchQuery) {
        window.location.href = 'notfound.html';
        return;
    }

    fetch('products.json')
        .then(res => res.json())
        .then(products => {
            allProducts = products;
            filteredProducts = products.filter(p =>
                p.name.toLowerCase().includes(searchQuery) ||
                p.desc.toLowerCase().includes(searchQuery) ||
                (p.components && p.components.toLowerCase().includes(searchQuery))
            );

            if(filteredProducts.length === 0){
                window.location.href = 'notfound.html';
                return;
            }

            displayPage(1);
            setupPagination();
        })
        .catch(err => {
            console.error("Errore caricamento prodotti:", err);
            window.location.href = 'notfound.html';
        });

    function displayProducts(products) {
        productsContainer.innerHTML = '';
        
        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product';
            
            if(p.discount) {
                div.classList.add('discount');
            }
            
            const displayPrice = p.discount ? p.discountPrice : p.price;
            
            div.dataset.name = p.name;
            div.dataset.price = displayPrice;
            div.dataset.desc = p.desc;
            div.dataset.img = p.img;

            let priceHTML = '';
            if(p.discount) {
                priceHTML = `
                    <p>
                        <span class="original-price">€ ${p.price.toFixed(2)}</span>
                        <span style="color:#9b59b6; font-weight:700; margin:10px 0;">€ ${p.discountPrice.toFixed(2)}</span>
                    </p>
                `;
            } else {
                priceHTML = `<p style="color:#9b59b6; font-weight:700; margin:10px 0;">€ ${p.price.toFixed(2)}</p>`;
            }

            div.innerHTML = `
                <img src="${p.img}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p>${p.desc}</p>
                ${priceHTML}
                <button class="add-to-cart">Aggiungi al carrello</button>
            `;

            div.addEventListener('click', e => {
                if(!e.target.classList.contains('add-to-cart')){
                    window.location.href = `product.html?name=${encodeURIComponent(p.name)}`;
                }
            });

            productsContainer.appendChild(div);
        });

        const addButtons = document.querySelectorAll('.add-to-cart');
        addButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productEl = btn.closest('.product');
                if(!productEl) return;

                const name = productEl.dataset.name;
                const price = parseFloat(productEl.dataset.price);
                const img = productEl.dataset.img;
                const desc = productEl.dataset.desc;

                if(typeof cartObj !== 'undefined'){
                    const existing = cartObj.cart.find(item => item.name === name);
                    if(existing){
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
                }
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
});
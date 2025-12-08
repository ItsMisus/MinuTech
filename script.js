// ------------------------- CART -------------------------
function initCart() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function updateCart(){
        const cartItems = document.getElementById('cartItems');
        const cartTotalEl = document.getElementById('cartTotal');
        if(!cartItems || !cartTotalEl) return;

        cartItems.innerHTML = "";
        if(cart.length === 0){
            cartItems.innerHTML = "<p>Il carrello è vuoto</p>";
        } else {
            cart.forEach((item,index)=>{
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>${item.desc}</p>
                        <span>€ ${item.price}</span>
                        <div class="cart-item-quantity">
                            <button class="decrease">-</button>
                            <span>${item.qty}</span>
                            <button class="increase">+</button>
                            <button class="remove" style="margin-left:10px;">✕</button>
                        </div>
                    </div>
                `;
                cartItems.appendChild(div);

                div.querySelector('.increase').addEventListener('click', ()=>{item.qty+=1; saveAndUpdate();});
                div.querySelector('.decrease').addEventListener('click', ()=>{if(item.qty>1){item.qty-=1; saveAndUpdate();}});
                div.querySelector('.remove').addEventListener('click', ()=>{cart.splice(index,1); saveAndUpdate();});
            });
        }

        const total = cart.reduce((sum,item)=>sum + item.price * item.qty,0);
        cartTotalEl.textContent = total.toFixed(2);
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function saveAndUpdate(){updateCart();}
    updateCart();

    if(cartBtn) cartBtn.addEventListener('click', ()=>cartSidebar.classList.toggle('active'));
    if(closeCart) closeCart.addEventListener('click', ()=>cartSidebar.classList.remove('active'));

    return { cart, updateCart, saveAndUpdate };
}

// Inizializziamo subito il carrello
const cartObj = initCart();

// ------------------------- CARICAMENTO PRODOTTI -------------------------
document.addEventListener('DOMContentLoaded', ()=>{
    const productsContainer = document.getElementById('productsContainer');
    if(!productsContainer) return;

    fetch('products.json')
    .then(res => res.json())
    .then(products => {
        products.forEach(prod => {
            const div = document.createElement('div');
            div.className = 'product';
            div.dataset.name = prod.name;
            div.dataset.price = prod.price;
            div.dataset.desc = prod.desc;

            div.innerHTML = `
                <img src="${prod.img}" alt="${prod.name}">
                <h3>${prod.name}</h3>
                <p>${prod.desc}</p>
                <button class="add-to-cart">Aggiungi al carrello</button>
            `;

            div.addEventListener('click', e => {
                if(!e.target.classList.contains('add-to-cart')){
                    window.location.href = `product.html?name=${encodeURIComponent(prod.name)}`;
                }
            });

            productsContainer.appendChild(div);
        });

        // Collegamento bottoni "add to cart"
        const addButtons = document.querySelectorAll('.add-to-cart');
        addButtons.forEach(btn=>{
            btn.addEventListener('click', e=>{
                e.stopPropagation();
                const productEl = btn.closest('.product');
                if(!productEl) return;

                const name = productEl.dataset.name;
                const desc = productEl.dataset.desc;
                const price = parseFloat(productEl.dataset.price);
                const img = productEl.querySelector('img').src;

                const existing = cartObj.cart.find(p=>p.name===name);
                if(existing) existing.qty +=1;
                else cartObj.cart.push({name, desc, price, img, qty:1});

                cartObj.updateCart();
            
            });
        });
    })
    .catch(err=>console.error('Errore caricamento prodotti:', err));
});

// ------------------------- ADD TO CART SU PRODUCT.HTML -------------------------
const productAddBtn = document.querySelector('.product-detail-main #addToCartBtn');
if(productAddBtn){
    productAddBtn.addEventListener('click', ()=>{
        const productEl = document.querySelector('.product-detail-main');
        if(!productEl) return;

        const name = productEl.dataset.name || productEl.querySelector('h1')?.textContent;
        const desc = productEl.dataset.desc || productEl.querySelector('p')?.textContent;
        const price = parseFloat(productEl.dataset.price || productEl.querySelector('p span')?.textContent?.replace('€','') || 0);
        const img = productEl.querySelector('img')?.src;
        const qtyInput = productEl.querySelector('#productQty');
        const qty = qtyInput ? parseInt(qtyInput.value) : 1;

        const existing = cartObj.cart.find(p=>p.name===name);
        if(existing) existing.qty += qty;
        else cartObj.cart.push({name, desc, price, img, qty});

        cartObj.updateCart();
        alert(`${name} aggiunto al carrello!`);
    });
}

// ------------------------- RICERCA -------------------------
const searchForm = document.getElementById('searchForm');
if(searchForm){
    searchForm.addEventListener('submit', e=>{
        e.preventDefault();
        const query = searchForm.search.value.trim();
        if(query){
            localStorage.setItem('searchQuery', query);
            window.location.href = 'risultati.html';
        }
    });
}

// ------------------------- LINGUA -------------------------
const languageDropdown = document.getElementById('languageDropdown');
if(languageDropdown){
    languageDropdown.addEventListener('change', e=>{
        console.log('Lingua cambiata in: '+e.target.value);
        // Qui puoi aggiungere funzionalità di cambio lingua
    });
}

// ------------------------- PULSANTE "NAVIGA ADESSO" -------------------------
const navigateHome = document.getElementById('navigateHome');
if(navigateHome){
    navigateHome.addEventListener('click', ()=> window.location.href = 'index.html');
}

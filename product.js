fetch('products.json')
.then(res => res.json())
.then(products => {
    
    const params = new URLSearchParams(window.location.search);
    const productName = params.get('name');
    const product = products.find(p => p.name === productName);

    const detailContainer = document.querySelector('.product-detail');

    if(product){
        detailContainer.innerHTML = `
            <div class="product-detail-main">
                <div class="product-image">
                    <img src="${product.img}" alt="${product.name}">
                    <div class="product-rating"></div>
                </div>
                <div class="product-info">
                    <h1>${product.name}</h1>
                    <p class="desc">${product.desc}</p>
                    <p>Componentistica: ${product.components || 'Non disponibile'}</p>
                    <p class="price">€ ${product.price}</p>
                    <div class="quantity-section">
                        <label>Quantità: </label>
                        <input type="number" id="productQty" value="1" min="1">
                        <button id="addToCartBtn">Aggiungi al carrello</button>
                    </div>
                </div>
            </div>
            <div class="also-like">
                <h2>Potrebbe piacerti anche:</h2>
                <div class="also-products"></div>
            </div>
        `;

        // Stelle cliccabili
        const ratingContainer = detailContainer.querySelector('.product-rating');
        for(let i=1; i<=5; i++){
            const star = document.createElement('span');
            star.className = 'star';
            star.innerHTML = '★';
            star.addEventListener('click', ()=>{
                window.location.href = `reviews.html?name=${encodeURIComponent(product.name)}`;
            });
            ratingContainer.appendChild(star);
        }

        // Suggerimenti prodotti
        const suggestionsContainer = detailContainer.querySelector('.also-products');
        products.filter(p => p.name !== productName).forEach(p => {
            const div = document.createElement('div');
            div.className = 'also-product';
            div.innerHTML = `
                <img src="${p.img}" alt="${p.name}">
                <h4>${p.name}</h4>
                <p>${p.desc.substring(0,50)}...</p>
            `;
            div.addEventListener('click', ()=> {
                window.location.href = `product.html?name=${encodeURIComponent(p.name)}`;
            });
            suggestionsContainer.appendChild(div);
        });

        // Carrello
        const addToCartBtn = document.getElementById('addToCartBtn');
        addToCartBtn.addEventListener('click', () => {
            const qty = parseInt(document.getElementById('productQty').value);
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existing = cart.find(p => p.name === product.name);
            if(existing){
                existing.qty += qty;
            } else {
                cart.push({...product, qty});
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            alert(`${product.name} aggiunto al carrello!`);
        });
    }

}).catch(err => console.error(err));

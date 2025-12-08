// Ottieni il prodotto dall'URL
const params = new URLSearchParams(window.location.search);
const productName = params.get('name');

// Aggiorna il titolo
document.getElementById('productTitle').textContent = `Recensioni: ${productName}`;

// Recupera recensioni dal localStorage
let allReviews = JSON.parse(localStorage.getItem('reviews')) || {};
let productReviews = allReviews[productName] || [];

// Container recensioni
const reviewsContainer = document.getElementById('reviewsContainer');

function renderReviews() {
    reviewsContainer.innerHTML = '';
    if(productReviews.length === 0){
        reviewsContainer.innerHTML = '<p>Nessuna recensione ancora. Sii il primo a recensire!</p>';
    } else {
        productReviews.forEach(r => {
            const div = document.createElement('div');
            div.className = 'single-review';
            div.innerHTML = `<strong>${r.author}</strong>: <p>${r.text}</p>`;
            reviewsContainer.appendChild(div);
        });
    }
}

renderReviews();

// Aggiungi recensione
document.getElementById('addReviewBtn').addEventListener('click', ()=>{
    const author = document.getElementById('reviewAuthor').value.trim();
    const text = document.getElementById('reviewText').value.trim();
    if(!author || !text) return alert('Compila tutti i campi!');
    
    const review = {author, text};
    productReviews.push(review);

    // Salva nel localStorage
    allReviews[productName] = productReviews;
    localStorage.setItem('reviews', JSON.stringify(allReviews));

    // Pulisci campi
    document.getElementById('reviewAuthor').value = '';
    document.getElementById('reviewText').value = '';

    renderReviews();
});

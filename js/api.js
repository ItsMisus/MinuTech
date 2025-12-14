/**
 * MIRA E-Commerce Frontend API Client
 * Gestisce tutte le chiamate al backend
 */

const API_BASE_URL = 'http://localhost/mira_ecommerce/api';

// ==================== API CLIENT CLASS ====================
class MiraAPI {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('miraToken');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Errore nella richiesta');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ==================== PRODUCTS ====================
    
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`products.php?${params}`);
    }

    async getProduct(id) {
        return this.request(`products.php?id=${id}`);
    }

    async getProductBySlug(slug) {
        return this.request(`products.php?slug=${slug}`);
    }

    async searchProducts(query, filters = {}) {
        return this.getProducts({ ...filters, search: query });
    }

    // ==================== REVIEWS ====================
    
    async getReviews(productId) {
        return this.request(`reviews.php?product_id=${productId}`);
    }

    async submitReview(productId, data) {
        return this.request('reviews.php', {
            method: 'POST',
            body: JSON.stringify({
                product_id: productId,
                ...data
            })
        });
    }

    // ==================== CART ====================
    
    async getCart() {
        return this.request('cart.php');
    }

    async addToCart(productId, quantity = 1) {
        return this.request('cart.php', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity })
        });
    }

    async updateCartItem(itemId, quantity) {
        return this.request(`cart.php?id=${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    async removeFromCart(itemId) {
        return this.request(`cart.php?id=${itemId}`, {
            method: 'DELETE'
        });
    }

    async clearCart() {
        return this.request('cart.php?clear=1', {
            method: 'DELETE'
        });
    }

    // ==================== ORDERS ====================
    
    async createOrder(orderData) {
        return this.request('orders.php', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrders() {
        return this.request('orders.php');
    }

    async getOrder(orderId) {
        return this.request(`orders.php?id=${orderId}`);
    }

    // ==================== AUTH ====================
    
    async login(email, password) {
        const response = await this.request('auth.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'login', email, password })
        });
        
        if (response.data.token) {
            this.token = response.data.token;
            localStorage.setItem('miraToken', this.token);
            localStorage.setItem('miraUser', JSON.stringify(response.data.user));
        }
        
        return response;
    }

    async register(userData) {
        return this.request('auth.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'register', ...userData })
        });
    }

    logout() {
        this.token = null;
        localStorage.removeItem('miraToken');
        localStorage.removeItem('miraUser');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        const user = localStorage.getItem('miraUser');
        return user ? JSON.parse(user) : null;
    }

    // ==================== CONTACT ====================
    
    async sendContactMessage(data) {
        return this.request('contact.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// ==================== EXPORT ====================
const api = new MiraAPI();

if (typeof window !== 'undefined') {
    window.MiraAPI = api;
}

// ==================== HELPER FUNCTIONS ====================


function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const finalPrice = product.is_discount ? product.discount_price : product.price;
    const hasDiscount = product.is_discount && product.discount_price < product.price;

    card.innerHTML = `
        ${hasDiscount ? '<span class="discount-badge">OFFERTA</span>' : ''}
        <div class="product-image">
            <img src="${product.image_url}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-desc">${product.description.substring(0, 80)}...</p>
            <div class="product-rating">
                <div class="stars">
                    ${[1, 2, 3, 4, 5].map(star => 
                        `<span class="star ${star <= Math.round(product.avg_rating) ? 'filled' : ''}">★</span>`
                    ).join('')}
                </div>
                <span class="rating-count">(${product.review_count})</span>
            </div>
            <div class="product-price">
                ${hasDiscount ? `
                    <span class="original-price">€${parseFloat(product.price).toFixed(2)}</span>
                    <span class="current-price">€${parseFloat(finalPrice).toFixed(2)}</span>
                ` : `
                    <span class="current-price">€${parseFloat(finalPrice).toFixed(2)}</span>
                `}
            </div>
        </div>
    `;

    const productIdToUse = product.id;
    
    card.addEventListener('click', () => {
        console.log('Navigating to product:', productIdToUse);
         window.location.href = `product.html?id=${product.id}`;
    });

    return card;
}


// ==================== AUTO-INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeHeader();
    
  // TEMPORANEAMENTE DISABILITATO - USA product.js
    /*
    const homeGrid = document.getElementById('homeProductsGrid');
    if (homeGrid) {
        displayProductsFromAPI('homeProductsGrid', { featured: 'true', limit: 4 });
    }
    */
    }
    

    
);
window.updateCartQuantity = async (itemId, quantity) => {
    try {
        await api.updateCartItem(itemId, quantity);
        await loadCartItems();
    } catch (error) {
        console.error('Error updating cart:', error);
    }
};

window.removeFromCart = async (itemId) => {
    try {
        await api.removeFromCart(itemId);
        await loadCartItems();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MiraAPI, api, displayProductsFromAPI, loadProductFromAPI };
}
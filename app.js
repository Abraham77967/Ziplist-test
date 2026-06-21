// PackPerfect application controller

// --- STATE MANAGEMENT ---
let items = [];

const INITIAL_ITEMS = [
    { id: 'item_1', name: 'Lightweight Jacket', qty: 1, category: 'Clothing', bag: 'carry-on', packed: false },
    { id: 'item_2', name: 'Noise Cancelling Headphones', qty: 1, category: 'Electronics', bag: 'carry-on', packed: true },
    { id: 'item_3', name: 'Travel Adapter', qty: 1, category: 'Electronics', bag: 'carry-on', packed: true },
    { id: 'item_4', name: 'T-shirts', qty: 5, category: 'Clothing', bag: 'none', packed: false },
    { id: 'item_5', name: 'Jeans', qty: 2, category: 'Clothing', bag: 'none', packed: false },
    { id: 'item_6', name: 'Toothbrush', qty: 1, category: 'Toiletries', bag: 'none', packed: false },
    { id: 'item_7', name: 'Hiking Boots', qty: 1, category: 'Footwear', bag: 'none', packed: false },
    { id: 'item_8', name: 'External Battery Pack', qty: 1, category: 'Electronics', bag: 'none', packed: false },
    { id: 'item_9', name: 'Passport & Travel Docs', qty: 1, category: 'Documents', bag: 'personal', packed: false },
    { id: 'item_10', name: 'Refillable Water Bottle', qty: 1, category: 'Essentials', bag: 'personal', packed: false },
    { id: 'item_11', name: 'Running Shoes', qty: 1, category: 'Footwear', bag: 'checked', packed: true },
    { id: 'item_12', name: 'Socks', qty: 7, category: 'Clothing', bag: 'checked', packed: true },
    { id: 'item_13', name: 'Toothbrush & Paste', qty: 1, category: 'Toiletries', bag: 'checked', packed: true }
];

const SUGGESTIONS = [
    { name: 'Passport', category: 'Documents' },
    { name: 'Phone Charger', category: 'Electronics' },
    { name: 'Socks', category: 'Clothing' },
    { name: 'Sunscreen 90ml', category: 'Toiletries' },
    { name: 'Sunglasses', category: 'Essentials' },
    { name: 'Swimwear', category: 'Clothing' },
    { name: 'Medication', category: 'Essentials' },
    { name: 'First Aid Kit', category: 'Essentials' },
    { name: 'Shampoo 250ml', category: 'Toiletries' },
    { name: 'Powerbank 20k', category: 'Electronics' }
];

// Load items from local storage or defaults
function loadItems() {
    const data = localStorage.getItem('ziplist_items');
    if (data) {
        try {
            items = JSON.parse(data);
        } catch (e) {
            console.error('Error parsing localStorage items, resetting...', e);
            items = [...INITIAL_ITEMS];
            saveItems();
        }
    } else {
        items = [...INITIAL_ITEMS];
        saveItems();
    }
}

function saveItems() {
    localStorage.setItem('ziplist_items', JSON.stringify(items));
    syncToFirebase();
}

// Reset app
function resetApp() {
    if (confirm('Are you sure you want to reset all items and bag allocations to defaults?')) {
        items = JSON.parse(JSON.stringify(INITIAL_ITEMS)); // Deep clone
        saveItems();
        renderAll();
        switchView('inventory');
        hideTsaAlert();
    }
}

// --- DYNAMIC CATEGORY ICONS ---
function getCategoryIcon(category, name = '') {
    const text = name.toLowerCase();
    
    // Exact name matches override category defaults
    if (text.includes('battery') || text.includes('powerbank') || text.includes('power bank')) return 'battery_charging_full';
    if (text.includes('laptop') || text.includes('computer')) return 'laptop_mac';
    if (text.includes('phone') || text.includes('charger')) return 'smartphone';
    if (text.includes('passport') || text.includes('doc') || text.includes('id')) return 'badge';
    if (text.includes('toothbrush') || text.includes('paste') || text.includes('soap')) return 'soap';
    if (text.includes('sunscreen') || text.includes('shampoo') || text.includes('lotion')) return 'clean_hands';
    if (text.includes('jacket') || text.includes('coat') || text.includes('t-shirt') || text.includes('shirt') || text.includes('jeans') || text.includes('socks')) return 'checkroom';
    if (text.includes('shoe') || text.includes('boot') || text.includes('sneaker')) return 'steps';
    if (text.includes('water') || text.includes('bottle')) return 'water_drop';
    if (text.includes('adapter') || text.includes('plug')) return 'power';
    
    // Category defaults
    switch (category) {
        case 'Clothing': return 'checkroom';
        case 'Electronics': return 'devices';
        case 'Toiletries': return 'soap';
        case 'Footwear': return 'steps';
        case 'Essentials': return 'wb_sunny';
        case 'Documents': return 'description';
        default: return 'package';
    }
}

// --- VIEW NAVIGATION CONTROLLER ---
let activeView = 'inventory';

function switchView(viewName) {
    activeView = viewName;
    
    // Toggle hidden class on sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update active nav button styles
    const navButtons = {
        inventory: document.getElementById('nav-inventory'),
        organize: document.getElementById('nav-organize'),
        review: document.getElementById('nav-review')
    };
    
    Object.keys(navButtons).forEach(key => {
        const btn = navButtons[key];
        if (!btn) return;
        if (key === viewName) {
            btn.className = 'flex-1 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1 bg-surface-container-lowest text-primary shadow-sm h-full scale-100';
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
        } else {
            btn.className = 'flex-1 rounded-full text-[11px] font-semibold text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-1 active-tap h-full';
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 0";
        }
    });

    // Update floating add button visibility (only show on Review page)
    const addFab = document.getElementById('floating-add-fab');
    if (addFab) {
        if (viewName === 'review') {
            addFab.classList.remove('hidden');
        } else {
            addFab.classList.add('hidden');
        }
    }
    
    // Update inventory floating input panel visibility
    const floatingInput = document.getElementById('inventory-floating-input');
    if (floatingInput) {
        if (viewName === 'inventory') {
            floatingInput.classList.remove('hidden');
        } else {
            floatingInput.classList.add('hidden');
        }
    }
    
    // Render specific view components
    renderAll();
}

// --- INVENTORY CONTROLLER ---
function renderInventory() {
    const list = document.getElementById('item-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (items.length === 0) {
        list.innerHTML = `
            <div class="text-center p-5 bg-surface-container-lowest rounded-lg border border-outline-variant/30 card-shadow">
                <span class="material-symbols-outlined text-outline/30 text-3xl mb-1">inventory</span>
                <p class="font-semibold text-sm text-on-surface-variant">No items in your inventory yet</p>
                <p class="text-xs text-outline mt-0.5">Use quick suggestions below or add manually.</p>
            </div>
        `;
        return;
    }
    
    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'bg-surface-container-lowest rounded-xl p-3 flex items-center justify-between border border-outline-variant/10 shadow-sm active-tap';
        
        // Icon and details
        const icon = getCategoryIcon(item.category, item.name);
        
        let allocationChip = '';
        if (item.bag && item.bag !== 'none') {
            const bagNames = { 'carry-on': 'Carry-On', 'checked': 'Checked', 'personal': 'Personal' };
            const bagColors = {
                'carry-on': 'bg-primary-container/10 text-primary border border-primary-container/20',
                'checked': 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20',
                'personal': 'bg-secondary-container/20 text-secondary border border-secondary-container/30'
            };
            allocationChip = `<span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${bagColors[item.bag]}">${bagNames[item.bag]}</span>`;
        }

        const qtySuffix = item.qty > 1 ? `<span class="text-outline font-normal text-xs ml-1.5">×${item.qty}</span>` : '';

        itemEl.innerHTML = `
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <span class="material-symbols-outlined text-primary/60 text-xl flex-shrink-0">${icon}</span>
                <div class="flex items-center min-w-0 flex-1 justify-between">
                    <div class="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                        <span class="font-semibold text-on-surface text-sm truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">${item.name}</span>
                        ${qtySuffix}
                        ${allocationChip}
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-1.5 ml-2">
                <button onclick="event.stopPropagation(); openEditModal('${item.id}')" class="material-symbols-outlined text-outline text-[18px] hover:text-primary p-1 rounded-full hover:bg-surface-container/50 transition-colors">edit</button>
                <button onclick="event.stopPropagation(); deleteItem('${item.id}')" class="material-symbols-outlined text-outline text-[18px] hover:text-error p-1 rounded-full hover:bg-surface-container/50 transition-colors">delete</button>
            </div>
        `;
        
        list.appendChild(itemEl);
    });
    
    renderInventorySuggestions();
}

function renderInventorySuggestions() {
    const container = document.getElementById('suggestions-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Filter out suggestions that are already in the items list to prevent duplicates
    const currentNames = items.map(i => i.name.toLowerCase());
    const filtered = SUGGESTIONS.filter(s => !currentNames.includes(s.name.toLowerCase()));
    
    if (filtered.length === 0) {
        container.innerHTML = `<span class="text-xs text-outline py-2 px-1">All suggestions added!</span>`;
        return;
    }
    
    filtered.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'whitespace-nowrap flex-shrink-0 bg-secondary-container/20 text-on-secondary-container hover:bg-secondary-container/35 px-4 h-10 rounded-full font-semibold text-xs flex items-center gap-1 active-tap border border-secondary-container/30 transition-all';
        btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">add</span> ${s.name}`;
        btn.onclick = () => quickAddItem(s.name, s.category);
        container.appendChild(btn);
    });
}

function quickAddItem(name, category) {
    const newItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        name: name,
        qty: 1,
        category: category,
        bag: 'none',
        packed: false
    };
    items.push(newItem);
    saveItems();
    renderAll();
    
    // Scroll list to bottom
    const list = document.getElementById('item-list');
    if (list) {
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
}

function addManualItem() {
    const input = document.getElementById('add-input');
    const val = input.value.trim();
    if (!val) return;
    
    // Guess category from name
    let guessedCategory = 'Essentials';
    const text = val.toLowerCase();
    if (text.includes('shirt') || text.includes('pants') || text.includes('jeans') || text.includes('jacket') || text.includes('socks') || text.includes('coat') || text.includes('sweater')) {
        guessedCategory = 'Clothing';
    } else if (text.includes('battery') || text.includes('powerbank') || text.includes('charger') || text.includes('laptop') || text.includes('phone') || text.includes('cable') || text.includes('headphones')) {
        guessedCategory = 'Electronics';
    } else if (text.includes('toothpaste') || text.includes('toothbrush') || text.includes('soap') || text.includes('shampoo') || text.includes('sunscreen') || text.includes('shave')) {
        guessedCategory = 'Toiletries';
    } else if (text.includes('shoe') || text.includes('boot') || text.includes('sandal') || text.includes('sneaker')) {
        guessedCategory = 'Footwear';
    } else if (text.includes('passport') || text.includes('visa') || text.includes('ticket') || text.includes('document')) {
        guessedCategory = 'Documents';
    }
    
    quickAddItem(val, guessedCategory);
    input.value = '';
}

function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    saveItems();
    renderAll();
}

// --- ITEM MODAL CONTROLLER (ADD / EDIT) ---
let editingItemId = null;

function openAddModal() {
    editingItemId = null;
    document.getElementById('modal-title').innerText = 'Add Item';
    document.getElementById('modal-item-name').value = '';
    document.getElementById('modal-item-qty').value = '1';
    document.getElementById('modal-item-category').value = 'Essentials';
    document.getElementById('modal-item-bag').value = 'none';
    
    const modal = document.getElementById('item-modal');
    modal.classList.remove('pointer-events-none');
    
    // Force a reflow for transition to take effect
    modal.offsetHeight;
    
    modal.classList.remove('opacity-0');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('translate-y-8', 'opacity-0');
    content.classList.add('translate-y-0', 'opacity-100');
}

function openEditModal(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    editingItemId = id;
    document.getElementById('modal-title').innerText = 'Edit Item';
    document.getElementById('modal-item-name').value = item.name;
    document.getElementById('modal-item-qty').value = item.qty;
    document.getElementById('modal-item-category').value = item.category;
    document.getElementById('modal-item-bag').value = item.bag;
    
    const modal = document.getElementById('item-modal');
    modal.classList.remove('pointer-events-none');
    
    // Force a reflow for transition to take effect
    modal.offsetHeight;
    
    modal.classList.remove('opacity-0');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('translate-y-8', 'opacity-0');
    content.classList.add('translate-y-0', 'opacity-100');
}

function closeItemModal() {
    const modal = document.getElementById('item-modal');
    modal.classList.add('opacity-0');
    
    const content = modal.querySelector('.modal-content');
    content.classList.remove('translate-y-0', 'opacity-100');
    content.classList.add('translate-y-8', 'opacity-0');
    
    // Defer pointer-events-none until transition completes
    setTimeout(() => {
        modal.classList.add('pointer-events-none');
        editingItemId = null;
    }, 250);
}

function adjustModalQty(delta) {
    const input = document.getElementById('modal-item-qty');
    let currentVal = parseInt(input.value) || 1;
    currentVal += delta;
    if (currentVal < 1) currentVal = 1;
    if (currentVal > 99) currentVal = 99;
    input.value = currentVal;
}

function saveItem(e) {
    e.preventDefault();
    const name = document.getElementById('modal-item-name').value.trim();
    const qty = parseInt(document.getElementById('modal-item-qty').value) || 1;
    const category = document.getElementById('modal-item-category').value;
    const bag = document.getElementById('modal-item-bag').value;
    
    if (!name) return;
    
    if (editingItemId) {
        // Edit existing
        const itemIndex = items.findIndex(i => i.id === editingItemId);
        if (itemIndex > -1) {
            // TSA Validation check if changing bag allocation
            const prevBag = items[itemIndex].bag;
            if (prevBag !== bag && bag !== 'none') {
                const validation = checkTsaRules({ name, category }, bag);
                if (!validation.valid) {
                    alert(`${validation.title}: ${validation.message}`);
                    return;
                }
            }
            
            items[itemIndex].name = name;
            items[itemIndex].qty = qty;
            items[itemIndex].category = category;
            items[itemIndex].bag = bag;
            // reset packed status if moved to unsorted
            if (bag === 'none') items[itemIndex].packed = false;
        }
    } else {
        // Create new
        if (bag !== 'none') {
            const validation = checkTsaRules({ name, category }, bag);
            if (!validation.valid) {
                alert(`${validation.title}: ${validation.message}`);
                return;
            }
        }
        
        const newItem = {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            name: name,
            qty: qty,
            category: category,
            bag: bag,
            packed: false
        };
        items.push(newItem);
    }
    
    saveItems();
    renderAll();
    closeItemModal();
}

// --- TSA COMPLIANCE CHECKER ---
function checkTsaRules(item, targetBag) {
    const textName = item.name.toLowerCase();
    const cat = item.category;
    
    // 1. Batteries must not be checked (must be carry-on or personal)
    const isBattery = textName.includes('battery') || textName.includes('powerbank') || textName.includes('power bank') || textName.includes('lithium');
    if (isBattery && targetBag === 'checked') {
        return {
            valid: false,
            title: 'TSA BATTERY COMPLIANCE WARNING',
            message: 'Spare lithium batteries and power banks are prohibited in checked baggage. They must be placed in your Carry-on or Personal item.',
            icon: 'battery_alert'
        };
    }
    
    // 2. Liquids over 100ml / 3.4oz must be checked (cannot be carry-on or personal)
    // Identify liquids: shampoo, conditioner, gel, lotion, sunscreen, liquid, cologne, perfume, mouthwash, toothpaste
    const isLiquid = cat === 'Toiletries' || textName.includes('shampoo') || textName.includes('conditioner') || textName.includes('lotion') || textName.includes('sunscreen') || textName.includes('liquid') || textName.includes('toothpaste') || textName.includes('gel') || textName.includes('perfume') || textName.includes('cologne') || textName.includes('mouthwash');
    
    if (isLiquid && (targetBag === 'carry-on' || targetBag === 'personal')) {
        // Regex to search for numbers exceeding 100 before 'ml' or 3.4 before 'oz'
        const mlMatch = textName.match(/(\d+)\s*ml/);
        const ozMatch = textName.match(/(\d+(\.\d+)?)\s*oz/);
        
        let exceedsLimit = false;
        let volumeStr = '';
        
        if (mlMatch) {
            const ml = parseInt(mlMatch[1]);
            if (ml > 100) {
                exceedsLimit = true;
                volumeStr = `${ml}ml`;
            }
        } else if (ozMatch) {
            const oz = parseFloat(ozMatch[1]);
            if (oz > 3.4) {
                exceedsLimit = true;
                volumeStr = `${oz}oz`;
            }
        } else if (textName.includes('large') || textName.includes('big') || textName.includes('full size') || textName.includes('250ml') || textName.includes('500ml') || textName.includes('200ml')) {
            // General keywords
            exceedsLimit = true;
            volumeStr = 'large bottle';
        }
        
        if (exceedsLimit) {
            return {
                valid: false,
                title: 'TSA LIQUIDS WARNING (3-1-1 RULE)',
                message: `Liquids, gels, and aerosols exceeding 100ml (${volumeStr}) cannot be packed in carry-on or personal items. Please pack this in your Checked bag.`,
                icon: 'warning'
            };
        }
    }
    
    return { valid: true };
}

// --- ORGANIZE DESK CONTROLLER ---
function getActiveSortingItem() {
    // Return first item in items list where bag === 'none'
    return items.find(item => item.bag === 'none' || !item.bag);
}

function getNextOrganizeItems() {
    // Return top 3 unsorted items
    return items.filter(item => item.bag === 'none' || !item.bag).slice(0, 3);
}

function renderOrganizeDesk() {
    const unsorted = getNextOrganizeItems();
    const activeCard = document.getElementById('active-card');
    const decoy1 = document.getElementById('decoy-stack-1');
    const decoy2 = document.getElementById('decoy-stack-2');
    
    // Update Bag Counter Tabs on Sorting Desk
    const countCarryOn = items.filter(i => i.bag === 'carry-on').length;
    const countChecked = items.filter(i => i.bag === 'checked').length;
    const countPersonal = items.filter(i => i.bag === 'personal').length;
    
    document.getElementById('tab-count-carryon').innerText = countCarryOn;
    document.getElementById('tab-count-checked').innerText = countChecked;
    document.getElementById('tab-count-personal').innerText = countPersonal;

    if (unsorted.length === 0) {
        // No items to sort
        activeCard.classList.add('hidden');
        decoy1.classList.add('hidden');
        decoy2.classList.add('hidden');
        return;
    }
    
    // Show active card
    activeCard.classList.remove('hidden');
    
    // Active card values
    const current = unsorted[0];
    document.getElementById('card-name').innerText = current.name;
    document.getElementById('card-qty').innerText = `${current.qty} Unit${current.qty > 1 ? 's' : ''}`;
    document.getElementById('card-category').innerText = current.category;
    
    // Icon set
    const icon = getCategoryIcon(current.category, current.name);
    document.getElementById('card-icon').innerText = icon;
    
    // Background and text color adjustments based on category
    const iconContainer = document.getElementById('card-icon-container');
    const iconEl = document.getElementById('card-icon');
    
    iconContainer.className = 'w-28 h-28 rounded-full flex items-center justify-center animate-float';
    iconEl.className = 'material-symbols-outlined text-[56px]';
    
    if (current.category === 'Clothing') {
        iconContainer.classList.add('bg-primary-container/10');
        iconEl.classList.add('text-primary');
    } else if (current.category === 'Electronics') {
        iconContainer.classList.add('bg-secondary-container');
        iconEl.classList.add('text-secondary');
    } else if (current.category === 'Toiletries') {
        iconContainer.classList.add('bg-amber-100');
        iconEl.classList.add('text-amber-800');
    } else if (current.category === 'Footwear') {
        iconContainer.classList.add('bg-stone-100');
        iconEl.classList.add('text-stone-700');
    } else if (current.category === 'Documents') {
        iconContainer.classList.add('bg-blue-100');
        iconEl.classList.add('text-blue-800');
    } else {
        iconContainer.classList.add('bg-surface-container-high');
        iconEl.classList.add('text-on-surface-variant');
    }
    
    // Decoys representation
    if (unsorted.length > 1) {
        decoy1.classList.remove('hidden');
    } else {
        decoy1.classList.add('hidden');
    }
    
    if (unsorted.length > 2) {
        decoy2.classList.remove('hidden');
    } else {
        decoy2.classList.add('hidden');
    }
    
    // Bouncy Entry animation for active card
    activeCard.classList.remove('entering');
    activeCard.offsetHeight; // trigger reflow
    activeCard.classList.add('entering');
    
    // Re-initialize event handlers for swipe
    initSwipeEvents();
}

function allocateBag(itemId, bagType) {
    const idx = items.findIndex(i => i.id === itemId);
    if (idx > -1) {
        items[idx].bag = bagType;
        items[idx].packed = false; // Reset packed state just in case
        saveItems();
        renderAll();
    }
}

// Fallback click sorting function for buttons
function sortActiveCard(bagType) {
    const activeItem = getActiveSortingItem();
    if (!activeItem) return;
    
    const validation = checkTsaRules(activeItem, bagType);
    if (!validation.valid) {
        showTsaAlert(validation.title, validation.message, validation.icon);
        return;
    }
    
    const card = document.getElementById('active-card');
    let transformStr = '';
    
    if (bagType === 'checked') transformStr = 'translateX(-500px) rotate(-30deg)';
    else if (bagType === 'carry-on') transformStr = 'translateX(500px) rotate(30deg)';
    else if (bagType === 'personal') transformStr = 'translateY(-500px) scale(0.8)';
    
    card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s';
    card.style.transform = transformStr;
    card.style.opacity = '0';
    
    setTimeout(() => {
        allocateBag(activeItem.id, bagType);
    }, 250);
}

// TSA Alerts Banner logic
function showTsaAlert(title, message, icon) {
    const alertBox = document.getElementById('tsa-alert');
    document.getElementById('tsa-alert-title').innerText = title;
    document.getElementById('tsa-alert-message').innerText = message;
    
    const iconEl = document.getElementById('tsa-alert-icon');
    iconEl.innerText = icon;
    
    alertBox.classList.remove('hidden');
    alertBox.classList.remove('tsa-alert-active');
    alertBox.offsetHeight; // trigger reflow
    alertBox.classList.add('tsa-alert-active');
    
    // Vibrate device if supported
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
    
    // Clear previous timeout if any
    if (window.tsaTimeout) clearTimeout(window.tsaTimeout);
    
    // Auto-hide alert after 8 seconds
    window.tsaTimeout = setTimeout(() => {
        hideTsaAlert();
    }, 8000);
}

function hideTsaAlert() {
    const alertBox = document.getElementById('tsa-alert');
    if (alertBox) {
        alertBox.classList.remove('tsa-alert-active');
        alertBox.classList.add('hidden');
    }
}

// --- CARD SWIPING MECHANICS (TOUCH & MOUSE) ---
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;
let isDragging = false;

function initSwipeEvents() {
    const card = document.getElementById('active-card');
    if (!card) return;

    // Reset styles
    card.style.transform = '';
    card.style.opacity = '1';
    card.style.transition = '';

    const dragStart = (x, y) => {
        isDragging = true;
        startX = x;
        startY = y;
        card.style.transition = 'none';
        hideTsaAlert();
    };

    const dragMove = (x, y) => {
        if (!isDragging) return;
        currentX = x - startX;
        currentY = y - startY;

        // Visual tilt & slide
        const rotation = currentX / 15;
        const opacity = Math.max(0.3, 1 - Math.abs(currentX) / 600);

        card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;
        card.style.opacity = opacity;
    };

    const dragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        
        card.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s';

        // Evaluate drag threshold rules
        if (currentX > 100) {
            // Swipe Right -> Carry-On
            handleSwipeRelease('carry-on', 1, 0);
        } else if (currentX < -100) {
            // Swipe Left -> Checked
            handleSwipeRelease('checked', -1, 0);
        } else if (currentY < -100) {
            // Swipe Up -> Personal
            handleSwipeRelease('personal', 0, -1);
        } else {
            // Return back
            card.style.transform = 'translate(0, 0) rotate(0)';
            card.style.opacity = '1';
        }
        currentX = 0;
        currentY = 0;
    };

    // Card Touch events
    card.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        dragStart(touch.clientX, touch.clientY);
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        dragMove(touch.clientX, touch.clientY);
    }, { passive: true });

    card.addEventListener('touchend', dragEnd);

    // Card Mouse events
    card.addEventListener('mousedown', (e) => {
        dragStart(e.clientX, e.clientY);
        e.preventDefault();
    });

    const onMouseMove = (e) => {
        if (isDragging) {
            dragMove(e.clientX, e.clientY);
        }
    };

    const onMouseUp = () => {
        if (isDragging) {
            dragEnd();
        }
    };

    // Remove window events first to avoid memory leaks/multiple attaches
    window.removeEventListener('mousemove', window._onMouseMove);
    window.removeEventListener('mouseup', window._onMouseUp);

    window._onMouseMove = onMouseMove;
    window._onMouseUp = onMouseUp;

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

function handleSwipeRelease(bagType, dirX, dirY) {
    const activeItem = getActiveSortingItem();
    if (!activeItem) return;

    const validation = checkTsaRules(activeItem, bagType);
    if (!validation.valid) {
        showTsaAlert(validation.title, validation.message, validation.icon);
        // snap back
        const card = document.getElementById('active-card');
        card.style.transform = 'translate(0, 0) rotate(0)';
        card.style.opacity = '1';
        return;
    }

    // Sort valid item
    const card = document.getElementById('active-card');
    card.style.transform = `translate(${dirX * 500}px, ${dirY * 500}px) rotate(${dirX * 30}deg)`;
    card.style.opacity = '0';

    setTimeout(() => {
        allocateBag(activeItem.id, bagType);
    }, 250);
}

// --- PACKING RUNWAY CONTROLLER ---
function calculateProgressRings() {
    const bags = ['carry-on', 'checked', 'personal'];
    
    bags.forEach(bag => {
        const bagItems = items.filter(i => i.bag === bag);
        const total = bagItems.length;
        const packed = bagItems.filter(i => i.packed).length;
        
        let percent = 0;
        if (total > 0) {
            percent = Math.round((packed / total) * 100);
        }
        
        // Update SVG circle stroke offset
        // Circumference = 2 * PI * r = 2 * 3.14159 * 28 = 175.92
        const circle = document.getElementById(`progress-${bag.replace('-', '')}`);
        const textPercent = document.getElementById(`percent-${bag.replace('-', '')}`);
        
        if (circle && textPercent) {
            textPercent.innerText = `${percent}%`;
            
            const circumference = 175.9;
            const offset = circumference - (percent / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
    });
}

function toggleCheck(itemId) {
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    
    const isPacking = !items[idx].packed;
    
    if (isPacking) {
        const cardEl = document.getElementById(`runway-card-${itemId}`);
        if (cardEl) {
            // Disable pointer interactions to avoid double-triggers
            cardEl.style.pointerEvents = 'none';
            
            // 1. Instantly toggle icon to checked and add strikethrough class
            const checkboxIcon = cardEl.querySelector('.material-symbols-outlined');
            if (checkboxIcon) {
                checkboxIcon.innerText = 'check_box';
                checkboxIcon.classList.remove('text-outline');
                checkboxIcon.classList.add('text-primary');
            }
            
            const nameSpan = cardEl.querySelector('.font-semibold');
            if (nameSpan) {
                nameSpan.classList.add('strikethrough');
            }
            
            // 2. Play collapsing animation
            cardEl.classList.add('collapsing-out');
            
            // 3. Update state and re-render after collapse completes (400ms)
            setTimeout(() => {
                items[idx].packed = true;
                saveItems();
                
                const packedList = document.getElementById('packed-list');
                const packedHeaderButton = packedList ? packedList.previousElementSibling : null;
                const isCollapsed = packedList ? packedList.classList.contains('hidden') : false;
                
                renderAll();
                
                // If the packed list accordion is collapsed, trigger a subtle indicator pulse
                if (isCollapsed && packedHeaderButton) {
                    packedHeaderButton.classList.add('header-glow-active');
                    setTimeout(() => {
                        packedHeaderButton.classList.remove('header-glow-active');
                    }, 800);
                }
                
                // Add entering animation class on the newly packed card
                const packedCard = document.getElementById(`packed-card-${itemId}`);
                if (packedCard) {
                    packedCard.classList.add('packed-entering');
                    setTimeout(() => {
                        packedCard.classList.remove('packed-entering');
                    }, 450);
                }
            }, 400);
        } else {
            // Fallback if card isn't visible in DOM
            items[idx].packed = true;
            saveItems();
            renderAll();
        }
    } else {
        // Unpacking
        const packedCard = document.getElementById(`packed-card-${itemId}`);
        if (packedCard) {
            packedCard.style.pointerEvents = 'none';
            
            // 1. Instantly uncheck box visually
            const checkboxIcon = packedCard.querySelector('.material-symbols-outlined');
            if (checkboxIcon) {
                checkboxIcon.innerText = 'check_box_outline_blank';
            }
            
            // 2. Play collapsing animation
            packedCard.classList.add('packed-collapsing-out');
            
            // 3. Update state and re-render after collapse completes (400ms)
            setTimeout(() => {
                items[idx].packed = false;
                saveItems();
                renderAll();
                
                // Add unpack entering animation to the runway list card
                const runwayCard = document.getElementById(`runway-card-${itemId}`);
                if (runwayCard) {
                    runwayCard.classList.add('unpack-entering');
                    setTimeout(() => {
                        runwayCard.classList.remove('unpack-entering');
                    }, 450);
                }
            }, 400);
        } else {
            // Fallback
            items[idx].packed = false;
            saveItems();
            renderAll();
        }
    }
}

function changeBag(itemId, newBag) {
    const idx = items.findIndex(i => i.id === itemId);
    if (idx > -1) {
        // TSA check
        if (newBag !== 'none') {
            const validation = checkTsaRules(items[idx], newBag);
            if (!validation.valid) {
                alert(`${validation.title}: ${validation.message}`);
                return;
            }
        }
        
        items[idx].bag = newBag;
        if (newBag === 'none') items[idx].packed = false;
        
        saveItems();
        renderAll();
    }
}

function renderReviewPanel() {
    const checklists = document.getElementById('runway-checklists');
    const packedList = document.getElementById('packed-list');
    const packedHeader = document.getElementById('packed-items-header');
    
    if (!checklists || !packedList) return;
    
    checklists.innerHTML = '';
    packedList.innerHTML = '';
    
    // Sort items by bags
    const carryOnItems = items.filter(i => i.bag === 'carry-on' && !i.packed);
    const personalItems = items.filter(i => i.bag === 'personal' && !i.packed);
    const checkedItems = items.filter(i => i.bag === 'checked' && !i.packed);
    const packedItems = items.filter(i => i.bag !== 'none' && i.packed);
    
    // Update packed count header
    packedHeader.innerText = `Packed Items (${packedItems.length})`;
    
    // Helper to generate group HTML
    const renderGroupHtml = (title, icon, bagKey, bagGroupItems) => {
        const bagTotal = items.filter(i => i.bag === bagKey).length;
        const bagPacked = items.filter(i => i.bag === bagKey && i.packed).length;
        
        let itemsHtml = '';
        if (bagGroupItems.length === 0) {
            if (bagTotal === 0) {
                itemsHtml = `
                    <div class="p-4 text-center bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-lg text-outline text-xs">
                        No items added to this bag. Go to <button onclick="switchView('organize')" class="text-primary font-bold hover:underline">Organize</button> to add items.
                    </div>
                `;
            } else {
                itemsHtml = `
                    <div class="p-4 text-center bg-surface-container-lowest border border-dashed border-outline-variant/40 rounded-lg text-outline text-xs">
                        All items in this bag are packed! 🎉
                    </div>
                `;
            }
        } else {
            bagGroupItems.forEach(item => {
                const categoryIcon = getCategoryIcon(item.category, item.name);
                const isEssential = item.name.toLowerCase().includes('passport') || item.name.toLowerCase().includes('essential') || item.category === 'Documents';
                const pillHtml = isEssential 
                    ? `<span class="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase">Essential</span>`
                    : `<span class="bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full text-[10px] font-semibold">${item.qty}x</span>`;
                
                itemsHtml += `
                    <div id="runway-card-${item.id}" class="bg-surface-container-lowest p-4 rounded-lg custom-shadow flex items-center justify-between touch-target transition-all active:scale-[0.98] border border-outline-variant/10 select-none cursor-pointer" onclick="toggleCheck('${item.id}')">
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                            <span class="material-symbols-outlined text-outline text-xl">check_box_outline_blank</span>
                            <span class="material-symbols-outlined text-primary/70 text-lg flex-shrink-0">${categoryIcon}</span>
                            <span class="font-semibold text-on-surface truncate pr-2">${item.name}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            ${pillHtml}
                            <button onclick="event.stopPropagation(); changeBag('${item.id}', 'none')" class="material-symbols-outlined text-outline hover:text-error text-base p-1" title="Unsort item">close</button>
                        </div>
                    </div>
                `;
            });
        }
        
        return `
            <div class="category-group">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-primary">${icon}</span>
                        <h3 class="font-bold text-headline-md text-on-background">${title}</h3>
                    </div>
                    <span class="bg-primary-container text-on-primary-container px-3 py-0.5 rounded-full text-label-sm font-bold border border-primary/20">${bagPacked}/${bagTotal} Items</span>
                </div>
                <div class="flex flex-col gap-2">
                    ${itemsHtml}
                </div>
            </div>
        `;
    };
    
    // Render bag checklists
    checklists.innerHTML += renderGroupHtml('Carry-On Bag', 'luggage', 'carry-on', carryOnItems);
    checklists.innerHTML += renderGroupHtml('Checked Bag', 'inventory_2', 'checked', checkedItems);
    checklists.innerHTML += renderGroupHtml('Personal Item', 'backpack', 'personal', personalItems);
    
    // Render Packed items (collapsed section)
    if (packedItems.length === 0) {
        packedList.innerHTML = `
            <div class="bg-surface-container-lowest p-4 rounded-lg opacity-60 text-center text-xs text-outline italic">
                No items packed yet. Tap items in the lists above to pack them.
            </div>
        `;
    } else {
        packedItems.forEach(item => {
            const categoryIcon = getCategoryIcon(item.category, item.name);
            const bagNames = { 'carry-on': 'Carry-On', 'checked': 'Checked', 'personal': 'Personal' };
            const bagName = bagNames[item.bag] || 'Sorted';
            
            const div = document.createElement('div');
            div.id = `packed-card-${item.id}`;
            div.className = 'bg-surface-container-lowest p-3.5 rounded-lg opacity-65 flex items-center justify-between border border-outline-variant/10 cursor-pointer select-none active:scale-[0.98] transition-all';
            div.onclick = () => toggleCheck(item.id);
            
            div.innerHTML = `
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <span class="material-symbols-outlined text-primary">check_circle</span>
                    <span class="material-symbols-outlined text-primary/50 text-base">${categoryIcon}</span>
                    <span class="font-semibold text-on-surface strikethrough truncate pr-2">${item.name}</span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-[9px] uppercase tracking-wide border border-outline-variant/30 text-outline px-2 py-0.5 rounded">${bagName}</span>
                    <span class="bg-surface-container-high px-2 py-0.5 rounded text-[10px] text-outline font-semibold">${item.qty}x</span>
                </div>
            `;
            packedList.appendChild(div);
        });
    }
    
    // Recalculate progress rings percentages
    calculateProgressRings();
}

function toggleCollapse(contentId, arrowId) {
    const content = document.getElementById(contentId);
    const arrow = document.getElementById(arrowId);
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        arrow.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        arrow.style.transform = 'rotate(0deg)';
    }
}

// --- RENDER ALL VIEWS ---
function renderAll() {
    if (activeView === 'inventory') {
        renderInventory();
    } else if (activeView === 'organize') {
        renderOrganizeDesk();
    } else if (activeView === 'review') {
        renderReviewPanel();
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
    loadItems();
    
    // Check if a list was shared via URL query string
    checkForUrlImport();
    
    // Listen for enter key in the Inventory quick input
    const input = document.getElementById('add-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addManualItem();
        });
    }
    
    // Switch to default view
    switchView('inventory');
});

// --- SHARE, EXPORT, AND IMPORT FUNCTIONS ---

let pendingImportItems = null;

function openShareModal() {
    const modal = document.getElementById('share-modal');
    if (!modal) return;
    modal.classList.remove('pointer-events-none');
    modal.offsetHeight; // force reflow
    modal.classList.remove('opacity-0');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('translate-y-8', 'opacity-0', 'scale-95');
    content.classList.add('translate-y-0', 'opacity-100', 'scale-100');
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('translate-y-0', 'opacity-100', 'scale-100');
    content.classList.add('translate-y-8', 'opacity-0', 'scale-95');
    setTimeout(() => {
        modal.classList.add('pointer-events-none');
    }, 250);
}

function clearAllItems() {
    if (confirm('Are you sure you want to clear your current list and start fresh? This cannot be undone.')) {
        items = [];
        saveItems();
        renderAll();
        showTsaAlert('INVENTORY CLEARED', 'All items have been removed. You can now build your own list!', 'delete_sweep');
    }
}

function copyShareLink() {
    try {
        if (items.length === 0) {
            alert('Cannot share an empty list. Add some items first!');
            return;
        }
        const dataStr = JSON.stringify(items);
        const base64 = btoa(unescape(encodeURIComponent(dataStr)));
        const shareUrl = window.location.origin + window.location.pathname + '?list=' + base64;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            showTsaAlert('LINK COPIED', 'Shareable link copied to clipboard. Share it with friends!', 'link');
            closeShareModal();
        }).catch(err => {
            console.error('Failed to copy share link: ', err);
            alert('Could not copy link automatically. Here is the URL:\n\n' + shareUrl);
        });
    } catch (e) {
        console.error(e);
        alert('Error creating share link.');
    }
}

function copyTextChecklist() {
    try {
        if (items.length === 0) {
            alert('Cannot copy an empty checklist. Add some items first!');
            return;
        }
        
        let txt = `🧳 ZipList Travel Checklist\n\n`;
        const carryOn = items.filter(i => i.bag === 'carry-on');
        const checked = items.filter(i => i.bag === 'checked');
        const personal = items.filter(i => i.bag === 'personal');
        const unsorted = items.filter(i => i.bag === 'none' || !i.bag);
        
        if (carryOn.length > 0) {
            txt += `[Carry-On Bag]\n`;
            carryOn.forEach(i => txt += `${i.packed ? '✓' : '[ ]'} ${i.name} (${i.qty}x)\n`);
            txt += `\n`;
        }
        if (checked.length > 0) {
            txt += `[Checked Bag]\n`;
            checked.forEach(i => txt += `${i.packed ? '✓' : '[ ]'} ${i.name} (${i.qty}x)\n`);
            txt += `\n`;
        }
        if (personal.length > 0) {
            txt += `[Personal Item]\n`;
            personal.forEach(i => txt += `${i.packed ? '✓' : '[ ]'} ${i.name} (${i.qty}x)\n`);
            txt += `\n`;
        }
        if (unsorted.length > 0) {
            txt += `[Unsorted Desk Stack]\n`;
            unsorted.forEach(i => txt += `[ ] ${i.name} (${i.qty}x)\n`);
            txt += `\n`;
        }
        
        navigator.clipboard.writeText(txt.trim()).then(() => {
            showTsaAlert('CHECKLIST COPIED', 'Text checklist copied to clipboard. Ready to paste in chats!', 'assignment_turned_in');
            closeShareModal();
        }).catch(err => {
            console.error('Failed to copy checklist: ', err);
            alert('Could not copy checklist text automatically.');
        });
    } catch (e) {
        console.error(e);
        alert('Error copying checklist text.');
    }
}

function downloadJsonExport() {
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "ziplist_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showTsaAlert('BACKUP DOWNLOADED', 'Your checklist backup file has been saved.', 'file_download');
        closeShareModal();
    } catch (e) {
        console.error(e);
        alert('Error downloading backup file.');
    }
}

function importJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                const valid = imported.every(item => typeof item.name === 'string');
                if (valid) {
                    const processed = imported.map(item => ({
                        id: item.id || 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
                        name: item.name,
                        qty: item.qty || 1,
                        category: item.category || 'Other',
                        bag: item.bag || 'none',
                        packed: !!item.packed
                    }));
                    
                    if (confirm(`Do you want to import this list of ${processed.length} items? This will replace your current list.`)) {
                        items = processed;
                        saveItems();
                        renderAll();
                        showTsaAlert('IMPORT SUCCESS', `${processed.length} items successfully loaded.`, 'cloud_done');
                        closeShareModal();
                    }
                } else {
                    alert('Invalid file format: items must contain names.');
                }
            } else {
                alert('Invalid file format: must be a JSON array of items.');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to parse JSON file.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function checkForUrlImport() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('list');
        if (!encodedData) return;
        
        const dataStr = decodeURIComponent(escape(atob(encodedData)));
        const imported = JSON.parse(dataStr);
        
        if (Array.isArray(imported) && imported.length > 0) {
            pendingImportItems = imported.map(item => ({
                id: item.id || 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
                name: item.name,
                qty: item.qty || 1,
                category: item.category || 'Other',
                bag: item.bag || 'none',
                packed: !!item.packed
            }));
            
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            setTimeout(() => {
                const modal = document.getElementById('import-confirm-modal');
                if (!modal) return;
                
                document.getElementById('import-modal-message').innerText = `A shared travel checklist of ${pendingImportItems.length} items has been sent to you. Would you like to import it? This will overwrite your current list.`;
                
                modal.classList.remove('pointer-events-none');
                modal.offsetHeight;
                modal.classList.remove('opacity-0');
                const content = modal.querySelector('.modal-content');
                content.classList.remove('translate-y-8', 'opacity-0', 'scale-95');
                content.classList.add('translate-y-0', 'opacity-100', 'scale-100');
            }, 400);
        }
    } catch (e) {
        console.error('Failed to parse URL import: ', e);
    }
}

function acceptImport() {
    if (pendingImportItems) {
        items = pendingImportItems;
        saveItems();
        renderAll();
        showTsaAlert('IMPORT COMPLETE', `${items.length} items imported successfully!`, 'cloud_done');
    }
    rejectImport();
}

function rejectImport() {
    const modal = document.getElementById('import-confirm-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    const content = modal.querySelector('.modal-content');
    content.classList.remove('translate-y-0', 'opacity-100', 'scale-100');
    content.classList.add('translate-y-8', 'opacity-0', 'scale-95');
    setTimeout(() => {
        modal.classList.add('pointer-events-none');
        pendingImportItems = null;
    }, 250);
}

// --- FIREBASE SYNC & AUTHENTICATION ENGINE ---

let db = null;
let auth = null;
let currentUser = null;
let isFirebaseInitialized = false;
let syncTimeout = null;

function initFirebase() {
    if (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
        try {
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            isFirebaseInitialized = true;
            console.log("Firebase initialized successfully!");
            
            auth.onAuthStateChanged(user => {
                handleAuthStateChanged(user);
            });
        } catch (e) {
            console.error("Error initializing Firebase: ", e);
        }
    } else {
        console.log("Firebase config not set or placeholder detected. Operating in LocalStorage mode.");
    }
}

function handleAuthStateChanged(user) {
    currentUser = user;
    
    const signedOutSection = document.getElementById('profile-signed-out');
    const signedInSection = document.getElementById('profile-signed-in');
    const avatarIcon = document.getElementById('profile-avatar-icon');
    const avatarImg = document.getElementById('profile-avatar-img');
    const dropdownAvatarImg = document.getElementById('dropdown-avatar-img');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    
    if (user) {
        if (avatarIcon) avatarIcon.classList.add('hidden');
        if (avatarImg) {
            avatarImg.src = user.photoURL || '';
            avatarImg.classList.remove('hidden');
        }
        
        if (signedOutSection) signedOutSection.classList.add('hidden');
        if (signedInSection) signedInSection.classList.remove('hidden');
        
        if (dropdownAvatarImg) dropdownAvatarImg.src = user.photoURL || '';
        if (profileName) profileName.innerText = user.displayName || 'Traveler';
        if (profileEmail) profileEmail.innerText = user.email || '';
        
        syncFromFirebase();
    } else {
        if (avatarIcon) avatarIcon.classList.remove('hidden');
        if (avatarImg) {
            avatarImg.src = '';
            avatarImg.classList.add('hidden');
        }
        
        if (signedInSection) signedInSection.classList.add('hidden');
        if (signedOutSection) signedOutSection.classList.remove('hidden');
        
        loadItems();
        renderAll();
    }
}

function signInWithGoogle() {
    if (!isFirebaseInitialized) {
        alert("Firebase is not configured yet. Please configure firebase-config.js with your project credentials.");
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        closeProfileDropdown();
        showTsaAlert('SIGNED IN', `Welcome, ${result.user.displayName}! Syncing your list...`, 'cloud_done');
    }).catch(error => {
        console.error("Sign-in failed: ", error);
        alert(`Google Sign-In failed: ${error.message}`);
    });
}

function signOut() {
    if (!isFirebaseInitialized) return;
    if (confirm("Are you sure you want to sign out? Your items will be saved locally on this browser.")) {
        auth.signOut().then(() => {
            closeProfileDropdown();
            showTsaAlert('SIGNED OUT', 'You have signed out. List edits will save to local storage.', 'cloud_off');
        }).catch(error => {
            console.error("Sign-out failed: ", error);
        });
    }
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) return;
    
    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
        dropdown.classList.remove('hidden');
        dropdown.offsetHeight; // trigger reflow
        dropdown.classList.remove('opacity-0', 'translate-y-2');
        dropdown.classList.add('opacity-100', 'translate-y-0');
        
        setTimeout(() => {
            window.addEventListener('click', closeDropdownOnOutsideClick);
        }, 50);
    } else {
        closeProfileDropdown();
    }
}

function closeProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) return;
    
    dropdown.classList.remove('opacity-100', 'translate-y-0');
    dropdown.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
        dropdown.classList.add('hidden');
    }, 200);
    
    window.removeEventListener('click', closeDropdownOnOutsideClick);
}

function closeDropdownOnOutsideClick(e) {
    const btn = document.getElementById('profile-btn');
    const dropdown = document.getElementById('profile-dropdown');
    if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        closeProfileDropdown();
    }
}

function syncFromFirebase() {
    if (!isFirebaseInitialized || !currentUser) return;
    
    const docRef = db.collection('users').doc(currentUser.uid);
    docRef.get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data && Array.isArray(data.items)) {
                items = data.items;
                localStorage.setItem('ziplist_items', JSON.stringify(items));
                renderAll();
                console.log("Checklist loaded and synced from Firestore.");
            }
        } else {
            docRef.set({
                items: items,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log("Initial local checklist uploaded to Firestore.");
            }).catch(err => {
                console.error("Error setting initial document: ", err);
            });
        }
    }).catch(err => {
        console.error("Error loading checklist from Firestore: ", err);
    });
}

function syncToFirebase() {
    if (!isFirebaseInitialized || !currentUser) return;
    
    if (syncTimeout) clearTimeout(syncTimeout);
    
    syncTimeout = setTimeout(() => {
        db.collection('users').doc(currentUser.uid).set({
            items: items,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log("Checklist synced to Firestore successfully.");
        }).catch(err => {
            console.error("Error syncing checklist to Firestore: ", err);
        });
    }, 500);
}

// ==================== GAME STATE ====================
const gameState = {
    plants: [],
    selectedPlant: null,
    stats: {
        nurtured: 0,
        neglected: 0,
        doorsEntered: 0,
        interactions: 0
    },
    timeOfDay: 'day',
    audioContext: null,
    sounds: {}
};

// ==================== PLANT DATA ====================
const plantTypes = [
    {
        name: 'Fern of Childhood',
        memory: 'A summer afternoon when time moved slowly, and every discovery felt infinite.',
        leaves: 6,
        flowerColor: '#B4D4A5'
    },
    {
        name: 'Vine of Lost Chances',
        memory: 'The path not taken whispers through the leaves, showing glimpses of what might have been.',
        leaves: 4,
        flowerColor: '#D4B4C8'
    },
    {
        name: 'Bloom of First Love',
        memory: 'Petals of memory unfold, fragrant with the sweetness and ache of beginning.',
        leaves: 5,
        flowerColor: '#E8B4C8'
    },
    {
        name: 'Thistle of Regret',
        memory: 'Sharp edges soften with time, but the shape of the wound remains.',
        leaves: 7,
        flowerColor: '#C4A5B8'
    },
    {
        name: 'Moss of Quiet Moments',
        memory: 'The small, overlooked joys that accumulated into a life well-lived.',
        leaves: 8,
        flowerColor: '#A5B8A5'
    },
    {
        name: 'Rose of Transformation',
        memory: 'The day you became someone new, thorns and all, beautiful and dangerous.',
        leaves: 5,
        flowerColor: '#D4A5A5'
    }
];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeAudio();
    setupEventListeners();
    createFloatingParticles();
});

function setupEventListeners() {
    document.getElementById('start-btn').addEventListener('click', startGarden);
    document.getElementById('return-btn').addEventListener('click', returnToGarden);
    document.getElementById('restart-btn').addEventListener('click', restartGarden);
}

function startGarden() {
    switchScreen('intro-screen', 'garden-screen');
    initializePlants();
    playAmbientSound();
    updateStats();
}

function switchScreen(fromId, toId) {
    const fromScreen = document.getElementById(fromId);
    const toScreen = document.getElementById(toId);

    fromScreen.classList.remove('active');
    setTimeout(() => {
        toScreen.classList.add('active');
    }, 300);
}

// ==================== PLANT GENERATION ====================
function initializePlants() {
    const container = document.getElementById('plants-container');
    container.innerHTML = '';
    gameState.plants = [];

    // Create 6 plants
    plantTypes.forEach((type, index) => {
        const plant = createPlant(type, index);
        gameState.plants.push(plant);
        container.appendChild(plant.element);
    });
}

function createPlant(type, index) {
    const plantData = {
        id: `plant-${index}`,
        type: type,
        state: 'initial', // initial, watered, nurtured, neglected, has-door
        growth: 0,
        lastInteraction: null,
        hasBeenWatered: false,
        hasBeenPruned: false,
        doorEntered: false
    };

    const plantElement = document.createElement('div');
    plantElement.className = 'plant interactive';
    plantElement.id = plantData.id;
    plantElement.innerHTML = `
        <div class="plant-glow"></div>
        <div class="plant-pot"></div>
        <div class="plant-stem" style="height: 60px;"></div>
        <div class="plant-leaves"></div>
        <div class="plant-flower"></div>
        <div class="plant-door">
            <div class="door-knob"></div>
            <div class="door-vines"></div>
        </div>
    `;

    // Add event listeners
    plantElement.addEventListener('click', () => selectPlant(plantData));
    plantElement.addEventListener('mouseenter', (e) => showTooltip(e, type.name));
    plantElement.addEventListener('mouseleave', hideTooltip);

    // Generate initial leaves
    setTimeout(() => {
        generateLeaves(plantElement, type.leaves);
    }, index * 200);

    plantData.element = plantElement;
    return plantData;
}

function generateLeaves(plantElement, count) {
    const leavesContainer = plantElement.querySelector('.plant-leaves');
    leavesContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf';

        // Position leaves around stem
        const angle = (360 / count) * i;
        const radius = 30 + (i % 2) * 10;
        const x = Math.cos(angle * Math.PI / 180) * radius;
        const y = Math.sin(angle * Math.PI / 180) * radius;

        leaf.style.left = `calc(50% + ${x}px)`;
        leaf.style.bottom = `${60 + Math.abs(y)}px`;
        leaf.style.transform = `rotate(${angle}deg)`;
        leaf.style.animationDelay = `${i * 0.1}s`;

        leavesContainer.appendChild(leaf);
    }
}

function generateFlower(plantElement, color) {
    const flowerContainer = plantElement.querySelector('.plant-flower');
    flowerContainer.innerHTML = '';

    // Create flower petals
    for (let i = 0; i < 6; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.background = `radial-gradient(ellipse at center, ${color} 0%, ${adjustColor(color, -20)} 100%)`;

        const angle = (360 / 6) * i;
        petal.style.transform = `rotate(${angle}deg) translateY(-15px)`;

        flowerContainer.appendChild(petal);
    }

    // Center of flower
    const center = document.createElement('div');
    center.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 15px;
        height: 15px;
        background: #F4E8C1;
        border-radius: 50%;
    `;
    flowerContainer.appendChild(center);
}

function adjustColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// ==================== PLANT INTERACTIONS ====================
function selectPlant(plant) {
    // Deselect previous
    if (gameState.selectedPlant) {
        gameState.selectedPlant.element.classList.remove('selected');
    }

    gameState.selectedPlant = plant;
    plant.element.classList.add('selected');

    // Update interaction panel
    updateInteractionPanel(plant);
    playSound('select');
}

function updateInteractionPanel(plant) {
    const panel = document.getElementById('interaction-panel');
    const title = document.getElementById('panel-title');
    const description = document.getElementById('panel-description');
    const buttonsContainer = document.getElementById('action-buttons');

    title.textContent = plant.type.name;
    description.textContent = 'Choose how to interact with this plant';

    buttonsContainer.innerHTML = '';

    // Water button
    const waterBtn = createActionButton('💧 Water', () => waterPlant(plant));
    if (plant.hasBeenWatered) {
        waterBtn.disabled = true;
        waterBtn.textContent = '💧 Watered';
    }
    buttonsContainer.appendChild(waterBtn);

    // Prune button
    const pruneBtn = createActionButton('✂️ Prune', () => prunePlant(plant));
    if (plant.hasBeenPruned) {
        pruneBtn.disabled = true;
        pruneBtn.textContent = '✂️ Pruned';
    }
    buttonsContainer.appendChild(pruneBtn);

    // Door button (if available)
    if (plant.state === 'has-door') {
        const doorBtn = createActionButton('🚪 Enter Door', () => enterDoor(plant));
        if (plant.doorEntered) {
            doorBtn.disabled = true;
            doorBtn.textContent = '🚪 Entered';
        }
        buttonsContainer.appendChild(doorBtn);
    }

    // Neglect button
    const neglectBtn = createActionButton('🍂 Neglect', () => neglectPlant(plant));
    buttonsContainer.appendChild(neglectBtn);
}

function createActionButton(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
}

function waterPlant(plant) {
    if (plant.hasBeenWatered) return;

    plant.hasBeenWatered = true;
    plant.state = 'watered';
    plant.growth += 30;
    plant.lastInteraction = 'watered';

    // Visual feedback
    const stem = plant.element.querySelector('.plant-stem');
    stem.style.height = `${60 + plant.growth}px`;

    // Add more leaves
    generateLeaves(plant.element, plant.type.leaves + 2);

    playSound('water');
    createWaterParticles(plant.element);

    // After watering, check if door should appear
    setTimeout(() => {
        if (plant.hasBeenWatered && plant.hasBeenPruned) {
            showDoor(plant);
        }
    }, 1000);

    updateInteractionPanel(plant);
    gameState.stats.interactions++;
    advanceTime();
}

function prunePlant(plant) {
    if (plant.hasBeenPruned) return;

    plant.hasBeenPruned = true;
    plant.growth += 20;
    plant.lastInteraction = 'pruned';

    // Visual feedback - make plant more defined
    plant.element.classList.add('nurtured');

    const stem = plant.element.querySelector('.plant-stem');
    stem.style.height = `${60 + plant.growth}px`;

    playSound('prune');

    // After pruning, check if door should appear
    setTimeout(() => {
        if (plant.hasBeenWatered && plant.hasBeenPruned) {
            showDoor(plant);
        }
    }, 1000);

    updateInteractionPanel(plant);
    gameState.stats.interactions++;
    advanceTime();
}

function neglectPlant(plant) {
    plant.state = 'neglected';
    plant.lastInteraction = 'neglected';
    plant.element.classList.add('neglected');

    gameState.stats.neglected++;
    playSound('neglect');
    updateStats();
    updateInteractionPanel(plant);
    gameState.stats.interactions++;
    advanceTime();
}

function showDoor(plant) {
    plant.state = 'has-door';
    plant.element.classList.add('has-door');

    gameState.stats.nurtured++;

    // Generate flower
    generateFlower(plant.element, plant.type.flowerColor);
    plant.element.classList.add('blooming');

    // Add door vines
    const doorVinesContainer = plant.element.querySelector('.door-vines');
    for (let i = 0; i < 4; i++) {
        const vine = document.createElement('div');
        vine.className = 'door-vine';
        vine.style.left = `${Math.random() * 100}%`;
        vine.style.animationDelay = `${i * 0.2}s`;
        doorVinesContainer.appendChild(vine);
    }

    playSound('door-appear');
    updateStats();
    updateInteractionPanel(plant);
}

function enterDoor(plant) {
    if (plant.doorEntered) return;

    plant.doorEntered = true;
    gameState.stats.doorsEntered++;

    // Show memory screen
    showMemory(plant);
    playSound('enter-door');
    updateStats();
}

function showMemory(plant) {
    const memoryTitle = document.getElementById('memory-title');
    const memoryDescription = document.getElementById('memory-description');
    const portal = document.getElementById('door-portal');

    memoryTitle.textContent = plant.type.name;
    memoryDescription.textContent = plant.type.memory;

    // Create portal effect
    portal.style.background = `radial-gradient(circle, ${plant.type.flowerColor}, var(--olive-green))`;

    switchScreen('garden-screen', 'memory-screen');
    playSound('memory');

    gameState.stats.interactions++;
    advanceTime();
}

function returnToGarden() {
    switchScreen('memory-screen', 'garden-screen');

    if (gameState.selectedPlant) {
        updateInteractionPanel(gameState.selectedPlant);
    }

    // Check if game should end
    checkGameEnd();
}

// ==================== GAME PROGRESSION ====================
function advanceTime() {
    const times = ['dawn', 'day', 'dusk', 'night'];
    const currentIndex = times.indexOf(gameState.timeOfDay);
    const nextIndex = (currentIndex + 1) % times.length;
    gameState.timeOfDay = times[nextIndex];

    const overlay = document.getElementById('time-overlay');
    overlay.className = `time-overlay ${gameState.timeOfDay}`;

    updateGardenMood();
}

function updateGardenMood() {
    const area = document.getElementById('garden-area');
    const { nurtured, neglected, doorsEntered } = gameState.stats;

    // Remove existing mood classes
    area.classList.remove('lush', 'barren', 'fragmented');

    // Determine mood
    if (doorsEntered > 3) {
        area.classList.add('fragmented');
    } else if (nurtured > neglected * 2) {
        area.classList.add('lush');
    } else if (neglected > nurtured * 2) {
        area.classList.add('barren');
    }
}

function updateStats() {
    document.getElementById('nurtured-count').textContent = gameState.stats.nurtured;
    document.getElementById('neglected-count').textContent = gameState.stats.neglected;
    document.getElementById('doors-count').textContent = gameState.stats.doorsEntered;
}

function checkGameEnd() {
    // End game if all plants have been interacted with significantly
    const allPlantsInteracted = gameState.plants.every(plant =>
        plant.hasBeenWatered || plant.hasBeenPruned || plant.state === 'neglected'
    );

    if (allPlantsInteracted && gameState.stats.interactions >= 12) {
        setTimeout(() => showOutcome(), 1500);
    }
}

function showOutcome() {
    const { nurtured, neglected, doorsEntered } = gameState.stats;

    // Update final stats
    document.getElementById('final-nurtured').textContent = nurtured;
    document.getElementById('final-neglected').textContent = neglected;
    document.getElementById('final-doors').textContent = doorsEntered;

    // Determine outcome
    let title, description, visualContent;

    if (doorsEntered > 4) {
        title = 'A Garden of Fragments';
        description = 'You wandered too deep into memory\'s doorways. Your garden is a beautiful chaos of overlapping timelines, strange and otherworldly. Each door opened brought wonder, but scattered the coherence of your present.';
        visualContent = '🌀🚪🌿';
    } else if (nurtured > neglected * 2) {
        title = 'A Lush Garden of Remembrance';
        description = 'Through patient care and attention, you\'ve cultivated a garden that blooms with life. Every plant tells a story you chose to honor and nurture. Your memories flourish here, vibrant and alive.';
        visualContent = '🌸🌿🌺';
    } else if (neglected > nurtured * 2) {
        title = 'A Garden of Letting Go';
        description = 'In choosing to release rather than hold, you\'ve created a quiet, muted space. Not all memories deserve to be fed. Your garden is sparse but honest, a testament to the peace of forgetting.';
        visualContent = '🍂🥀🌫️';
    } else {
        title = 'A Balanced Garden';
        description = 'You walked the middle path, nurturing some memories while letting others fade. Your garden reflects the natural rhythm of life - growth and decay, remembering and releasing, in equal measure.';
        visualContent = '🌿⚖️🍃';
    }

    document.getElementById('outcome-title').textContent = title;
    document.getElementById('outcome-description').textContent = description;
    document.getElementById('outcome-visual').textContent = visualContent;

    switchScreen('garden-screen', 'outcome-screen');
    playSound('outcome');
}

function restartGarden() {
    // Reset state
    gameState.stats = {
        nurtured: 0,
        neglected: 0,
        doorsEntered: 0,
        interactions: 0
    };
    gameState.selectedPlant = null;
    gameState.timeOfDay = 'day';

    switchScreen('outcome-screen', 'garden-screen');
    initializePlants();
    updateStats();
}

// ==================== VISUAL EFFECTS ====================
function createWaterParticles(plantElement) {
    const rect = plantElement.getBoundingClientRect();
    const container = document.getElementById('ambient-elements');

    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top}px;
            width: 6px;
            height: 6px;
            background: rgba(107, 181, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
        `;

        container.appendChild(particle);

        // Animate particle
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.animate([
            { transform: 'translate(0, 0)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px)`, opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

function createFloatingParticles() {
    const container = document.getElementById('ambient-elements');

    setInterval(() => {
        if (document.getElementById('garden-screen').classList.contains('active')) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = '100%';
            particle.style.animationDuration = `${6 + Math.random() * 4}s`;
            particle.style.animationDelay = `${Math.random() * 2}s`;

            container.appendChild(particle);

            setTimeout(() => particle.remove(), 10000);
        }
    }, 2000);
}

// ==================== TOOLTIP ====================
function showTooltip(event, text) {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = text;
    tooltip.classList.add('visible');
    updateTooltipPosition(event);
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('visible');
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
}

// ==================== AUDIO SYSTEM ====================
function initializeAudio() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        gameState.audioContext = new AudioContext();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function playAmbientSound() {
    if (!gameState.audioContext) return;

    const ctx = gameState.audioContext;

    // Create gentle ambient tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 110; // Low A
    gainNode.gain.value = 0.02; // Very quiet

    oscillator.start();

    gameState.sounds.ambient = { oscillator, gainNode };
}

function playSound(type) {
    if (!gameState.audioContext) return;

    const ctx = gameState.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different sounds for different actions
    const soundConfig = {
        'select': { freq: 440, duration: 0.1, gain: 0.1 },
        'water': { freq: 523, duration: 0.3, gain: 0.15 },
        'prune': { freq: 659, duration: 0.2, gain: 0.12 },
        'neglect': { freq: 220, duration: 0.4, gain: 0.08 },
        'door-appear': { freq: 880, duration: 0.5, gain: 0.15 },
        'enter-door': { freq: 1047, duration: 0.6, gain: 0.12 },
        'memory': { freq: 698, duration: 0.8, gain: 0.1 },
        'outcome': { freq: 523, duration: 1.0, gain: 0.15 }
    };

    const config = soundConfig[type] || soundConfig.select;

    oscillator.frequency.value = config.freq;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(config.gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);

    oscillator.start();
    oscillator.stop(ctx.currentTime + config.duration);
}

// ==================== UTILITY FUNCTIONS ====================
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Enable audio context on first user interaction
document.addEventListener('click', () => {
    if (gameState.audioContext && gameState.audioContext.state === 'suspended') {
        gameState.audioContext.resume();
    }
}, { once: true });

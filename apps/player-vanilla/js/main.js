/**
 * Main entry point for the player app
 */

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz Player App starting...');
    
    // Setup UI event listeners
    UI.setupEventListeners();
    
    // Connect to server
    SocketManager.connect();
    
    // Show initial screen
    UI.showJoinScreen();
    
    // Listen for game state changes
    window.addEventListener('gameStateChange', function(event) {
        console.log('Game state changed:', event.detail.state.status);
        handleStateChange(event.detail.state);
    });
    
    // Handle page visibility changes (for reconnection)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && !GameState.connected) {
            console.log('Page became visible, attempting to reconnect...');
            SocketManager.reconnect();
        }
    });
    
    // Handle beforeunload for cleanup
    window.addEventListener('beforeunload', function() {
        SocketManager.disconnect();
    });
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    }
    
    // Add app to home screen prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install button or banner
        showInstallPrompt();
    });
    
    // Handle install prompt
    function showInstallPrompt() {
        // You could show a custom install banner here
        console.log('App can be installed');
    }
    
    console.log('Quiz Player App initialized');
});

// Handle game state changes
function handleStateChange(state) {
    switch (state.status) {
        case 'joining':
            UI.showJoinScreen();
            break;
        case 'waiting':
            UI.showWaitingScreen();
            break;
        case 'question':
            UI.showQuestionScreen();
            break;
        case 'answered':
            UI.showConfirmedScreen();
            break;
        case 'feedback':
            // Handled in socket manager
            break;
        case 'rank':
            // Handled in socket manager
            break;
        case 'ended':
            // Handled in socket manager
            break;
    }
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    UI.showError('An unexpected error occurred. Please refresh the page.');
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Utility functions
window.Utils = {
    // Debounce function for input handling
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Format time in MM:SS format
    formatTime: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Generate avatar color based on nickname
    getAvatarColor: function(nickname) {
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ];
        
        let hash = 0;
        for (let i = 0; i < nickname.length; i++) {
            hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    },
    
    // Check if device has vibration support
    canVibrate: function() {
        return 'vibrate' in navigator;
    },
    
    // Check if device supports notifications
    canNotify: function() {
        return 'Notification' in window;
    },
    
    // Request notification permission
    requestNotificationPermission: function() {
        if (this.canNotify() && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },
    
    // Show notification
    showNotification: function(title, options = {}) {
        if (this.canNotify() && Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/assets/icon-192x192.png',
                badge: '/assets/icon-192x192.png',
                ...options
            });
        }
    }
};

// Expose global functions for debugging
window.QuizApp = {
    GameState,
    SocketManager,
    UI,
    Utils,
    
    // Debug functions
    debug: {
        getState: () => GameState,
        connect: () => SocketManager.connect(),
        disconnect: () => SocketManager.disconnect(),
        reset: () => SocketManager.reset(),
        showScreen: (screen) => UI.showScreen(screen)
    }
};
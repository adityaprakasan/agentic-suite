export const clearUserLocalStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    // Clear model selection so new users start with tier-appropriate model
    localStorage.removeItem('suna-model-selection-v3');
    localStorage.removeItem('suna-model-selection-v2'); // Legacy
    localStorage.removeItem('customModels');
    localStorage.removeItem('agent-selection-storage');
    localStorage.removeItem('auth-tracking-storage');
    localStorage.removeItem('pendingAgentPrompt');
    localStorage.removeItem('suna_upgrade_dialog_displayed');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('maintenance-dismissed-')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Local storage cleared on logout');
  } catch (error) {
    console.error('❌ Error clearing local storage:', error);
  }
}; 
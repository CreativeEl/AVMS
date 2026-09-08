// ============================================
// SUPABASE CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it available globally
window.supabase = supabaseClient;

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'Date TBD';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function truncateText(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function debugLog(message, data = null) {
    console.log(`🔍 [AVMS] ${message}`);
    if (data) console.log(data);
}

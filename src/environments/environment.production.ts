export const environment = {
  production: true,
  apiUrl: (window as any)['env']?.API_URL || 'https://colorado-ffhl-stats.onrender.com'
};

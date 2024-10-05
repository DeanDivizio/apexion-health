import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    "name": "Apexion Health",
    "short_name": "Apexion",
    "description": "Comprehensive Health Tracking for Data Enthusiasts",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#000000",
    "orientation": "portrait",
    "scope": "/",
    "icons": [
      {
        "src": "icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "lang": "en",
    "dir": "ltr"
  }
}
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/teacher/', '/student/', '/parent/'],
    },
    sitemap: 'https://school.shiviiii.com/sitemap.xml',
  }
}

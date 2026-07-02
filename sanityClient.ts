import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: 'uxm5o4n0',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

// Turns an image field into a real URL: urlFor(img).width(800).url()
const builder = imageUrlBuilder(sanityClient)
export const urlFor = (source: SanityImageSource) => builder.image(source)

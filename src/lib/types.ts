export type Category = {
  id: string
  name: string
  slug: string
  color: string | null
}

export type Organization = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

export type Announcement = {
  id: string
  title: string
  body: string
  banner_url: string | null
  registration_link: string | null
  published_at: string | null
  expires_at: string | null
  categories: Category | null
  organizations: Organization | null
}

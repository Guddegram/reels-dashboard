export type AnalysisStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface Category {
  id: string
  user_id: string
  name: string
  slug: string
  color: string
  icon: string
  sort_order: number
  type: 'category' | 'profile'
  created_at: string
}

export interface Reel {
  id: string
  user_id: string
  category_id: string | null
  category?: Category
  profile_id: string | null
  profile?: Category
  url: string
  instagram_id: string | null
  title: string | null
  description: string | null
  gemini_summary: string | null
  gemini_transcript: string | null
  gemini_tags: string[] | null
  gemini_category_suggestion: string | null
  analysis_status: AnalysisStatus
  thumbnail_url: string | null
  external_thumbnail: string | null
  author_username: string | null
  author_name: string | null
  is_favorite: boolean
  notes: string | null
  saved_at: string
  updated_at: string
}

export interface ExtractedMetadata {
  instagram_id: string | null
  author_username: string | null
  author_name: string | null
  title: string | null
  external_thumbnail: string | null
  description: string | null
}

export interface GeminiAnalysis {
  summary: string
  tags: string[]
  category_suggestion: string
  transcript: string
  language: string
}

export interface ReelFilters {
  category?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'favorites'
  favorites?: boolean
  page?: number
  limit?: number
}

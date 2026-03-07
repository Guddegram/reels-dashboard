import { NextRequest, NextResponse } from 'next/server'
import { extractReelMetadata } from '@/lib/instagram/extract'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || !url.includes('instagram.com')) {
      return NextResponse.json({ error: 'Ungültige Instagram URL' }, { status: 400 })
    }

    const metadata = await extractReelMetadata(url)
    return NextResponse.json(metadata)
  } catch {
    return NextResponse.json({ error: 'Extraktion fehlgeschlagen' }, { status: 500 })
  }
}

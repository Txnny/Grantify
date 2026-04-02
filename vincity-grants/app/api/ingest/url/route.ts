import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url: string | undefined = body?.url;

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  let fetchUrl: string;
  try {
    fetchUrl = new URL(url).toString();
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; VinCityGrantBot/1.0; +https://vincity.ca)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Remote returned ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    html = await res.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const $ = cheerio.load(html);

  // Strip boilerplate — keep grant content
  $(
    'script, style, noscript, nav, footer, header, aside, iframe, ' +
      '[role="navigation"], [role="banner"], [role="complementary"], ' +
      '.cookie-banner, .site-header, .site-footer, .sidebar'
  ).remove();

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    fetchUrl;

  // Prefer <main> or <article> if present, else <body>
  const contentRoot = $('main').length
    ? $('main')
    : $('article').length
      ? $('article')
      : $('body');

  const text = contentRoot
    .text()
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text) {
    return NextResponse.json(
      { error: 'No readable content found at that URL' },
      { status: 422 }
    );
  }

  return NextResponse.json({ title, text, url: fetchUrl });
}

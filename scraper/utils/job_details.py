"""
Job detail helpers

Fetch the full job description from each source's detail page and
normalize it to Markdown, so the site can render it on its own job page.
"""

import json
import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from markdownify import markdownify

MAX_DESCRIPTION_LEN = 20000

ELEDUCK_POST_API = "https://svc.eleduck.com/api/v1/posts/{post_id}"

# Next.js flight data chunks: self.__next_f.push([1,"..."])
_FLIGHT_CHUNK_RE = re.compile(r'self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)', re.DOTALL)
_JSON_DESCRIPTION_RE = re.compile(r'"description":"((?:\\.|[^"\\])*)"')


def html_to_markdown(html: str) -> str:
    """Convert job description HTML to tidy Markdown."""
    if not html:
        return ''
    md = markdownify(html, heading_style='ATX', bullets='-', strip=['img', 'script', 'style'])
    return clean_markdown(md)


def clean_markdown(text: str) -> str:
    """Trim trailing spaces, collapse blank lines and cap length."""
    if not text:
        return ''
    lines = [line.rstrip() for line in text.replace('\r\n', '\n').split('\n')]
    text = re.sub(r'\n{3,}', '\n\n', '\n'.join(lines)).strip()
    # Drop empty headings left behind by source markup (e.g. "<h1></h1>")
    text = re.sub(r'^#{1,6}\s*$\n?', '', text, flags=re.MULTILINE)
    # Drop "=====" heading underlines; they render as literal text when they follow a list
    text = re.sub(r'^\s*={3,}\s*$\n?', '', text, flags=re.MULTILINE).strip()
    return text[:MAX_DESCRIPTION_LEN]


def parse_eleduck_post(payload: dict) -> Optional[str]:
    """Extract the post body from an Eleduck post API response (Markdown source preferred)."""
    post = payload.get('post') or {}
    raw = post.get('raw_content') or ''
    if raw.strip():
        # Keep backslash escapes such as "\\*": Markdown renders them as literal characters
        return clean_markdown(raw)
    return html_to_markdown(post.get('content') or '') or None


async def fetch_eleduck_description(client: httpx.AsyncClient, post_id: str) -> Optional[str]:
    """Fetch the full post body from the Eleduck API; returns None on any error."""
    try:
        response = await client.get(ELEDUCK_POST_API.format(post_id=post_id))
        response.raise_for_status()
        return parse_eleduck_post(response.json())
    except Exception as e:
        print(f"  Eleduck detail {post_id} error: {e}")
        return None


def extract_rwfa_description(html: str) -> Optional[str]:
    """Read the description from the JobPosting JSON-LD on an RWFA job page."""
    soup = BeautifulSoup(html, 'html.parser')
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string or '')
        except Exception:
            continue
        items = data if isinstance(data, list) else data.get('@graph', [data])
        for item in items:
            if isinstance(item, dict) and item.get('@type') == 'JobPosting':
                md = html_to_markdown(item.get('description') or '')
                if md:
                    return md
    return None


def extract_remotecom_description(html: str) -> Optional[str]:
    """Read the HTML description embedded in a remote.com job page's flight data."""
    best = ''
    for chunk in _FLIGHT_CHUNK_RE.findall(html):
        try:
            decoded = json.loads(f'"{chunk}"')
        except Exception:
            continue
        for match in _JSON_DESCRIPTION_RE.finditer(decoded):
            try:
                value = json.loads(f'"{match.group(1)}"')
            except Exception:
                continue
            # Skip references like "$31" and plain meta descriptions
            if '<' in value and len(value) > len(best):
                best = value
    return html_to_markdown(best) or None

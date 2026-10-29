"""Parser tests for the RealWorkFromAnywhere listing page.

Run from scraper/: python -m pytest tests
"""

from scrapers.rwfa_scraper import RWFAScraper

# Trimmed copy of a real listing card: the posting time appears before the
# title (mobile) and after it (desktop), the company sits in the <p> under <h3>.
CARD = """
<a href="/jobs/engineer-ii-recommendations-vrchat-4521">
  <img alt="VRChat logo" src="https://example.com/vrchat.png"/>
  <span class="md:hidden">about 13 hours ago</span>
  <h3>Engineer II - Recommendations</h3>
  <p class="text-base truncate font-medium">VRChat</p>
  <span class="hidden md:block">about 13 hours ago</span>
  <span>Worldwide</span>
  <span class="badge">sql</span>
</a>
"""


def parse(html: str):
    scraper = RWFAScraper.__new__(RWFAScraper)  # parsing needs no AI client or DB
    return scraper._parse_page(html)


def test_company_comes_from_the_line_under_the_title():
    [job] = parse(CARD)
    assert job['title'] == 'Engineer II - Recommendations'
    assert job['company'] == 'VRChat'


def test_company_falls_back_to_the_logo_alt_text():
    [job] = parse(CARD.replace('<p class="text-base truncate font-medium">VRChat</p>', ''))
    assert job['company'] == 'VRChat'


def test_company_is_unknown_without_name_or_logo():
    html = CARD.replace('<p class="text-base truncate font-medium">VRChat</p>', '').replace(
        '<img alt="VRChat logo" src="https://example.com/vrchat.png"/>', ''
    )
    [job] = parse(html)
    assert job['company'] == 'Unknown'


DETAIL = """
<script type="application/ld+json">
{"@context": "https://schema.org", "@type": "JobPosting", "title": "Software Engineer - Storage",
 "description": "<p>Build storage.</p>",
 "hiringOrganization": {"@type": "Organization", "name": "Supabase"}}
</script>
"""


def test_detail_page_company_comes_from_json_ld():
    from utils.job_details import extract_rwfa_company

    assert extract_rwfa_company(DETAIL) == 'Supabase'
    assert extract_rwfa_company('<html></html>') is None


# Expired postings drop the JSON-LD but still link the company under the title
EXPIRED = """
<a href="/companies/kit">Kit</a>
<h1>Engineer II - Recommendations</h1>
<a href="/companies/vrchat">VRChat</a>
<div class="expired notice">This job posting has expired and no longer accepting applications.</div>
"""


def test_expired_detail_page_company_comes_from_the_company_link():
    from utils.job_details import extract_rwfa_company

    assert extract_rwfa_company(EXPIRED) == 'VRChat'

"""Parser tests for the Himalayas search API.

Run from scraper/: python -m pytest tests
"""

from scrapers.himalayas_scraper import HimalayasScraper

# Trimmed copy of a real search result
ITEM = {
    'title': 'Backend Developer',
    'excerpt': 'Build APIs.',
    'companyName': 'G2i',
    'employmentType': 'Full Time',
    'locationRestrictions': [],
    'parentCategories': ['Developer'],
    'description': '<p>Build <strong>APIs</strong>.</p>',
    'pubDate': '1793178202',
    'applicationLink': 'https://himalayas.app/companies/g2i/jobs/backend-developer?utm_source=api',
    'guid': 'https://himalayas.app/companies/g2i/jobs/backend-developer',
}


def scraper():
    return HimalayasScraper.__new__(HimalayasScraper)  # parsing needs no AI client or DB


def test_maps_api_fields():
    job = scraper()._parse_job(ITEM)
    assert job['title'] == 'Backend Developer'
    assert job['company'] == 'G2i'
    assert job['source_site'] == 'himalayas'
    assert job['original_url'] == ITEM['guid']
    # API terms: apply buttons must use applicationLink
    assert job['apply_url'] == ITEM['applicationLink']
    assert job['description'] == 'Build **APIs**.'
    assert job['date_posted'] =='2026-10-28T09:03:22+00:00'


def test_region_is_worldwide_without_restrictions_else_cn():
    assert scraper()._parse_job(ITEM)['region_limit'] == 'worldwide'
    restricted = {**ITEM, 'locationRestrictions': ['China', 'Singapore']}
    assert scraper()._parse_job(restricted)['region_limit'] == 'CN'


def test_contract_roles_are_parttime():
    assert scraper()._parse_job({**ITEM, 'employmentType': 'Contractor'})['work_type'] == 'parttime'
    assert scraper()._parse_job(ITEM)['work_type'] == 'fulltime'


def test_only_developer_and_data_roles_are_kept():
    assert scraper()._is_dev_job(ITEM)
    assert scraper()._is_dev_job({**ITEM, 'parentCategories': ['Data Science']})
    assert not scraper()._is_dev_job({**ITEM, 'parentCategories': ['Sales']})


def test_incomplete_items_are_skipped():
    assert scraper()._parse_job({**ITEM, 'guid': ''}) is None
    assert scraper()._parse_job({**ITEM, 'pubDate': None}) is None

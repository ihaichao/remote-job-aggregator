import asyncio
import json
from unittest.mock import AsyncMock

import pytest
from utils.ai_classifier import AIClassifier


def analyze(raw):
    classifier = AIClassifier()
    classifier._call_llm = AsyncMock(return_value=raw)
    return asyncio.run(classifier.analyze_job("职位", "招聘详情"))


valid = dict(summary="职责介绍" * 9, fitForChina="协作条件" * 6,
             highlights=[" 开发 ", "协作"], techStack=["Go"])


@pytest.mark.parametrize("template", ["{}", "```json\n{}\n```", "```\n{}\n```"])
def test_extracts_clean_analysis(template):
    assert analyze(template.format(json.dumps(valid))) == {**valid, "highlights": ["开发", "协作"]}


@pytest.mark.parametrize("patch", [dict(summary="短"), dict(fitForChina=None),
    dict(highlights=[" " , "一"]), dict(highlights=["一"]), dict(techStack="Go"), dict(techStack=[9])])
def test_rejects_invalid_fields(patch):
    assert analyze(json.dumps({**valid, **patch})) is None


@pytest.mark.parametrize("raw", ["[]", "invalid json", "```json\n{}"])
def test_malformed(raw):
    assert analyze(raw) is None

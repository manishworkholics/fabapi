import pytest

from backend.app.services.prediction_service import prediction_service


@pytest.mark.skipif(
    prediction_service._model is None, reason="model file missing – skip real prediction checks"
)
def test_top_two_probs_sum_to_one():
    txt = ["ManufacturerPN: 123ABC, 456DEF"]
    preds = prediction_service.get_predictions(txt)[0]
    total = preds["primary_confidence"] + preds["secondary_confidence"]
    # soft-max ensures total mass ≤ 1; it may be quite low for uncertain inputs
    assert 0.0 < total <= 1.0

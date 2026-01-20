import io
import pandas as pd

from backend.app.services.excel_service import clean_excel_file, create_training_data


def test_clean_excel_detects_header(tmp_path):
    df_in = pd.DataFrame(
        {"MPN": ["A", "B"], "Manufacturer": ["Foo", "Bar"], "Qty": [1, 2]}
    )
    buf = io.BytesIO()
    df_in.to_excel(buf, engine="openpyxl", index=False)
    buf.seek(0)

    df_out = clean_excel_file(buf.getvalue())
    assert list(df_out.columns) == ["MPN", "Manufacturer", "Qty"]


def test_training_rows(fake):
    df = pd.DataFrame({fake.word(): [fake.word() for _ in range(3)] for _ in range(4)})
    rows = create_training_data(df, source_file="dummy.xlsx")
    assert rows.shape[0] == len(df.columns)

import pandas as pd
import io
import logging

logger = logging.getLogger(__name__)

def clean_excel_file(file_content):
    """
    Clean Excel files with improved handling for multiple sheets.
    Keeps everything in memory without writing to disk.
    
    Args:
        file_content (bytes): The raw Excel file content
        
    Returns:
        pandas.DataFrame: Cleaned DataFrame with appropriate headers
    """
    # Get sheet names using pandas
    try:
        xl = pd.ExcelFile(io.BytesIO(file_content))
        all_sheets = xl.sheet_names
        logger.info(f"Available sheets: {', '.join(all_sheets)}")
    except Exception as e:
        logger.error(f"Error reading Excel file: {e}")
        raise

    # Prioritize sheets based on name
    priority_sheet_keywords = ['bom', 'parts', 'component', 'material', 'assembly']
    priority_modifiers = ['updated', 'final', 'latest', 'rev', 'current']
    
    # Select the best sheet
    selected_sheet = None
    
    # First priority: sheets with both modifier and keyword
    for sheet_name in all_sheets:
        sheet_name_lower = str(sheet_name).lower()
        if any(modifier in sheet_name_lower for modifier in priority_modifiers) and \
           any(keyword in sheet_name_lower for keyword in priority_sheet_keywords):
            selected_sheet = sheet_name
            logger.info(f"Selected sheet '{selected_sheet}' based on priority name containing both modifier and keyword")
            break
    
    # Second priority: sheets with just a BOM keyword
    if not selected_sheet:
        for sheet_name in all_sheets:
            sheet_name_lower = str(sheet_name).lower()
            if any(keyword in sheet_name_lower for keyword in priority_sheet_keywords):
                selected_sheet = sheet_name
                logger.info(f"Selected sheet '{selected_sheet}' based on priority keyword in name")
                break
    
    # Default to first sheet if no priority match
    if not selected_sheet and all_sheets:
        selected_sheet = all_sheets[0]
        logger.info(f"Selected first available sheet: '{selected_sheet}'")
    
    # Read the selected sheet without a header first
    if selected_sheet:
        logger.info(f"Reading sheet: '{selected_sheet}'")
        df_raw = pd.read_excel(io.BytesIO(file_content), sheet_name=selected_sheet, header=None)
    else:
        # If somehow we couldn't determine the sheet, read the first sheet by position
        logger.info("Reading first sheet by position")
        df_raw = pd.read_excel(io.BytesIO(file_content), header=None)
    
    # Typical "header-ish" words often seen in BOM column headers
    header_keywords = {
        'part', 'qty', 'quantity', 'reference', 'ref des', 'vendor',
        'manufacturer', 'mfr', 'description', 'desc', 'value', 'footprint',
        'package', 'comment', 'designation', 'designator', 'item', 'number',
        'pn', 'manf', 'manf#', 'refs', 'unit', 'cost', 'total'
    }
    
    # Find the best header row
    best_row = 0
    best_score = -1.0
    
    # Loop over each row to see how many header-like words appear
    for i in range(min(20, len(df_raw))):  # Check first 20 rows at most
        try:
            row_values = df_raw.iloc[i].dropna().astype(str)
            # Lowercase each cell and see if it contains a known header keyword
            score = 0
            for cell in row_values:
                cell_lc = cell.lower()
                if any(kw in cell_lc for kw in header_keywords):
                    score += 1
            
            if score > best_score:
                best_score = score
                best_row = i
        except Exception as e:
            logger.error(f"Error processing row {i}: {e}")
            continue
    
    logger.info(f"Selected header row {best_row} with score {best_score}")
    
    # Now read the file again, but with no header
    if selected_sheet:
        df_no_header = pd.read_excel(io.BytesIO(file_content), sheet_name=selected_sheet, header=None)
    else:
        df_no_header = pd.read_excel(io.BytesIO(file_content), header=None)

    # Extract the header row values as a list by converting to strings first
    header_values = [str(x) for x in df_no_header.iloc[best_row]]

    # Get data rows (everything after the header row)
    data_df = df_no_header.iloc[best_row+1:].reset_index(drop=True)

    # Create a new DataFrame with the exact column names
    df = pd.DataFrame()
    for i, col_name in enumerate(header_values):
        if i < len(data_df.columns):  # Make sure we don't go out of bounds
            df[col_name] = data_df[i]

    # Drop wholly empty "Unnamed" columns
    unnamed_cols = [
        col for col in df.columns
        if str(col).startswith('Unnamed:') and df[col].isna().all()
    ]
    df.drop(columns=unnamed_cols, inplace=True, errors='ignore')
        
    # Also remove any fully blank rows
    df.dropna(how='all', inplace=True)
    
    return df

def create_training_data(clean_df, source_file=""):
    """
    Create training data from the cleaned dataframe.
    
    Args:
        clean_df (pd.DataFrame): Cleaned DataFrame
        source_file (str): Original filename
        
    Returns:
        pd.DataFrame: DataFrame with column metadata for ML prediction
    """
    column_data = []
    categories = []
    column_names = []
    source_files = []
    
    for col_name in clean_df.columns:
        header_text = str(col_name)
        values = clean_df[col_name].dropna().head(10).astype(str).tolist()
        concatenated_text = header_text + ": " + ", ".join(values)
        
        column_data.append(concatenated_text)
        column_names.append(header_text)
        categories.append("")
        source_files.append(source_file)
    
    training_df = pd.DataFrame({
        'column_name': column_names,
        'sample_data': column_data,
        'category': categories,
        'source_file': source_files
    })
    
    return training_df
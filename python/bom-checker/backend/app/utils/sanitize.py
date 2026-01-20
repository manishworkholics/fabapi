import re


def sanitize_mpn(mpn):
    """
    Sanitize manufacturer part number to contain only letters, numbers, hyphens, and periods.
    
    Args:
        mpn: The manufacturer part number to sanitize (can be string, int, float, or None)
        
    Returns:
        str: Sanitized manufacturer part number string
    """
    # Handle None values
    if mpn is None:
        return ""
    
    # Check if it's already a numeric value (int or float)
    if isinstance(mpn, (int, float)):
        # For numeric MPNs, return the original number as a string with no spaces
        return str(mpn).strip()
    
    # For strings, process normally
    if isinstance(mpn, str):
        mpn_str = mpn.strip()
        if not mpn_str:
            return ""
        
        # Keep alphanumeric characters, hyphens, and periods
        return re.sub(r'[^a-zA-Z0-9\-\.]', '', mpn_str)
    
    # For any other type, convert to string
    return str(mpn).strip()
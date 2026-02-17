"""
Compatibility module for loading models that depend on specific functions.
"""

def standard_preprocessor(text):
    """
    Standard text preprocessing function used by the model.
    This needs to match the exact function used during model training.
    """
    if not isinstance(text, str):
        return ""
    return text.lower().replace('\n', ' ').replace('\r', ' ')

def simple_tokenizer(text):
    """
    Simple tokenization function that may be required by the model.
    """
    return [tok for tok in text.split() if tok]
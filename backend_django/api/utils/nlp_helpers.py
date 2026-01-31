"""
NLP Helpers - TheFuzz & spaCy utilities for intelligent chat
"""
from thefuzz import fuzz, process
import spacy
from typing import List, Dict, Optional, Tuple

# Load spaCy model (run: python -m spacy download en_core_web_sm)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("⚠️  spaCy model not found. Run: python -m spacy download en_core_web_sm")
    nlp = None


def fuzzy_match_column(user_input: str, column_names: List[str], threshold: int = 80) -> Optional[str]:
    """
    Match user input to column names using fuzzy matching
    
    Args:
        user_input: The column name user typed (may have typos)
        column_names: List of actual column names in the dataframe
        threshold: Minimum similarity score (0-100)
    
    Returns:
        Best matching column name or None if no match above threshold
    
    Example:
        >>> fuzzy_match_column("Appls", ["Apples", "Oranges", "Bananas"])
        "Apples"  # 90% match
    """
    if not column_names:
        return None
    
    # Find best match
    best_match, score = process.extractOne(user_input, column_names, scorer=fuzz.ratio)
    
    if score >= threshold:
        print(f"[Fuzzy Match] '{user_input}' -> '{best_match}' (score: {score}%)")
        return best_match
    
    return None


def fuzzy_match_all_columns(user_inputs: List[str], column_names: List[str], threshold: int = 80) -> Dict[str, Optional[str]]:
    """
    Match multiple user inputs to column names
    
    Returns:
        Dictionary mapping user input -> matched column name
    """
    return {
        user_input: fuzzy_match_column(user_input, column_names, threshold)
        for user_input in user_inputs
    }


def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract named entities from user text using spaCy
    
    Args:
        text: User's natural language query
    
    Returns:
        Dictionary of entity types -> entity values
    
    Example:
        >>> extract_entities("Show me sales for Apple in 2023")
        {
            'ORG': ['Apple'],
            'DATE': ['2023']
        }
    """
    if not nlp:
        return {}
    
    doc = nlp(text)
    entities = {}
    
    for ent in doc.ents:
        if ent.label_ not in entities:
            entities[ent.label_] = []
        entities[ent.label_].append(ent.text)
    
    return entities


def extract_numbers_and_dates(text: str) -> Dict[str, List]:
    """
    Extract numerical values and dates from text
    
    Returns:
        {
            'numbers': [float, ...],
            'dates': [str, ...],
            'money': [str, ...]
        }
    """
    if not nlp:
        return {'numbers': [], 'dates': [], 'money': []}
    
    doc = nlp(text)
    result = {
        'numbers': [],
        'dates': [],
        'money': []
    }
    
    for ent in doc.ents:
        if ent.label_ in ('CARDINAL', 'QUANTITY', 'PERCENT'):
            try:
                # Try to convert to float
                num = float(ent.text.replace(',', '').replace('%', ''))
                result['numbers'].append(num)
            except ValueError:
                pass
        elif ent.label_ == 'DATE':
            result['dates'].append(ent.text)
        elif ent.label_ == 'MONEY':
            result['money'].append(ent.text)
    
    return result


def smart_column_matcher(user_query: str, dataframe_columns: List[str]) -> Dict[str, any]:
    """
    Intelligently parse user query and match to dataframe columns
    
    Combines fuzzy matching + entity extraction
    
    Args:
        user_query: "Show sales for Appls and Ornges in 2023"
        dataframe_columns: ["Apples", "Oranges", "Sales", "Year"]
    
    Returns:
        {
            'matched_columns': ['Apples', 'Oranges'],
            'entities': {'DATE': ['2023']},
            'numbers': [],
            'original_query': user_query
        }
    """
    # Extract entities
    entities = extract_entities(user_query)
    numbers_dates = extract_numbers_and_dates(user_query)
    
    # Extract potential column names (words that might be columns)
    words = user_query.split()
    potential_columns = [w.strip(',.!?') for w in words if len(w) > 2]
    
    # Fuzzy match each word to column names
    matched = []
    for word in potential_columns:
        match = fuzzy_match_column(word, dataframe_columns, threshold=75)
        if match and match not in matched:
            matched.append(match)
    
    return {
        'matched_columns': matched,
        'entities': entities,
        'numbers': numbers_dates['numbers'],
        'dates': numbers_dates['dates'],
        'money': numbers_dates['money'],
        'original_query': user_query
    }


# =============================================================================
# Example Usage in Django Views
# =============================================================================
"""
from api.utils.nlp_helpers import smart_column_matcher

def categorical_chat_view(request):
    user_query = request.POST.get('query')
    csv_data = request.FILES.get('csv')
    
    df = pd.read_csv(csv_data)
    column_names = df.columns.tolist()
    
    # Parse query intelligently
    parsed = smart_column_matcher(user_query, column_names)
    
    # parsed['matched_columns'] = ['Apples', 'Sales']
    # Now you can filter the dataframe
    if parsed['matched_columns']:
        df_filtered = df[parsed['matched_columns']]
    
    # If dates found, filter by date
    if parsed['dates']:
        # Handle date filtering
        pass
    
    return JsonResponse({'data': df_filtered.to_dict()})
"""

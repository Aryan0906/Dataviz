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


import re

# Lazily initialized HuggingFace zero-shot classification pipeline
_zero_shot_pipeline = None

def get_zero_shot_pipeline():
    """
    Lazily initialize and return the zero-shot classification pipeline.
    Uses 'typeform/distilbert-base-uncased-mnli' (lightweight, ~268MB, fast).
    Runs on CPU (device=-1) for maximum compatibility.
    """
    global _zero_shot_pipeline
    if _zero_shot_pipeline is None:
        try:
            from transformers import pipeline
            print("🚀 Loading HuggingFace zero-shot-classification pipeline...")
            _zero_shot_pipeline = pipeline(
                "zero-shot-classification",
                model="typeform/distilbert-base-uncased-mnli",
                device=-1
            )
            print("✅ HuggingFace pipeline loaded successfully.")
        except Exception as e:
            print(f"⚠️ Failed to load HuggingFace pipeline (falling back to rules): {e}")
            _zero_shot_pipeline = None
    return _zero_shot_pipeline

def classify_intent_hf(query: str) -> str:
    """
    Classify the query into a chat command intent using HuggingFace Zero-Shot Classification.
    """
    pipe = get_zero_shot_pipeline()
    candidate_labels = [
        "add category",
        "update category",
        "remove category",
        "change chart type",
        "clear plot",
        "ask question"
    ]
    
    if pipe:
        try:
            res = pipe(query, candidate_labels)
            intent = res["labels"][0]
            confidence = res["scores"][0]
            print(f"[HF NLP] Query: '{query}' -> Intent: '{intent}' (confidence: {confidence:.2f})")
            if confidence > 0.4:
                return intent
        except Exception as e:
            print(f"Error running HF pipeline: {e}")
            
    # Rule-based fallback
    lower = query.lower().strip()
    if any(k in lower for k in ["add", "new", "create", "insert"]):
        return "add category"
    if any(k in lower for k in ["remove", "delete", "drop", "exclude"]):
        return "remove category"
    if any(k in lower for k in ["update", "change", "set", "modify"]):
        if any(c in lower for c in ["chart", "plot", "pie", "bar", "treemap"]):
            return "change chart type"
        return "update category"
    if any(k in lower for k in ["clear", "reset", "empty"]):
        return "clear plot"
    if any(c in lower for c in ["chart", "plot", "pie", "bar", "treemap"]):
        return "change chart type"
    return "ask question"

def extract_numerical_value(query: str) -> Optional[float]:
    """
    Helper to extract a numerical value (float/integer) from the query.
    """
    match = re.search(r'-?\d+(?:\.\d+)?', query)
    if match:
        return float(match.group(0))
    return None

def extract_chart_type(query: str) -> str:
    """
    Extract the chart type requested in the query.
    """
    lower = query.lower()
    if "pie" in lower:
        return "pie"
    if "treemap" in lower or "tree" in lower:
        return "treemap"
    return "bar"


def extract_category_label(query: str, current_labels: List[str]) -> Tuple[str, bool]:
    """
    Extract the category name from the query.
    Fuzzy matches against existing labels first.
    If no match above threshold, parses a new label out of the text.
    
    Returns:
        (label, is_existing)
    """
    # 1. Try fuzzy matching words in query to current labels
    words = re.findall(r'[A-Za-z0-9_-]+', query)
    best_label = None
    highest_score = 0
    
    # We test combinations of words (up to 3 consecutive words) to match category names
    for length in range(1, 4):
        for i in range(len(words) - length + 1):
            phrase = " ".join(words[i:i+length])
            if phrase.lower() in ["add", "update", "set", "delete", "remove", "change", "chart", "pie", "bar", "treemap", "value", "to", "with", "label", "category"]:
                continue
            match = fuzzy_match_column(phrase, current_labels, threshold=70)
            if match:
                # Get the actual score
                score = fuzz.ratio(phrase.lower(), match.lower())
                if score > highest_score:
                    highest_score = score
                    best_label = match
                    
    if best_label and highest_score >= 70:
        return best_label, True
        
    # 2. Extract new category name if not matching existing
    text = query.lower()
    # Remove command verbs and punctuation
    text = re.sub(r'\b(add|create|insert|update|change|set|to|with|value|category|of|remove|delete|drop)\b', '', text)
    # Remove numbers
    text = re.sub(r'-?\d+(?:\.\d+)?', '', text)
    text = re.sub(r'[^\w\s-]', '', text).strip()
    
    # Capitalize the words for presentation
    cleaned = text.title()
    if cleaned:
        return cleaned, False
    return "Unknown", False


def answer_data_question(query: str, current_data: List[Dict[str, any]], x_key: str = 'label', y_key: str = 'value') -> str:
    """
    Answer user's question about the dataset using local computation.
    Uses HuggingFace zero-shot classification to understand which statistical query is asked.
    """
    if not current_data:
        return "The plot data is currently empty. Try adding some categories first!"
        
    # Extract values
    values = []
    labels = []
    for item in current_data:
        if x_key in item and y_key in item and item[y_key] is not None:
            try:
                values.append(float(item[y_key]))
                labels.append(str(item[x_key]))
            except ValueError:
                pass
    
    if not values:
        return "There are no numerical values in the categories yet."
        
    # Classify the question intent
    pipe = get_zero_shot_pipeline()
    candidate_questions = [
        "maximum value",
        "minimum value",
        "average value",
        "total sum",
        "category count"
    ]
    
    question_intent = "category count"
    if pipe:
        try:
            res = pipe(query, candidate_questions)
            question_intent = res["labels"][0]
        except Exception as e:
            print(f"Error classifying question: {e}")
    else:
        # Simple rule fallback
        lower = query.lower()
        if any(k in lower for k in ["max", "highest", "largest", "top", "most", "biggest"]):
            question_intent = "maximum value"
        elif any(k in lower for k in ["min", "lowest", "smallest", "bottom", "least"]):
            question_intent = "minimum value"
        elif any(k in lower for k in ["average", "mean", "avg"]):
            question_intent = "average value"
        elif any(k in lower for k in ["sum", "total", "add up", "overall"]):
            question_intent = "total sum"
            
    # Compute the response
    if question_intent == "maximum value":
        max_idx = values.index(max(values))
        return f"The category with the highest value is **{labels[max_idx]}** with **{values[max_idx]:g}**."
    elif question_intent == "minimum value":
        min_idx = values.index(min(values))
        return f"The category with the lowest value is **{labels[min_idx]}** with **{values[min_idx]:g}**."
    elif question_intent == "average value":
        avg_val = sum(values) / len(values)
        return f"The average value across the **{len(values)}** categories is **{avg_val:.2f}**."
    elif question_intent == "total sum":
        total_val = sum(values)
        return f"The total sum of all categories is **{total_val:g}**."
    else:
        return f"There are currently **{len(current_data)}** categories plotted."



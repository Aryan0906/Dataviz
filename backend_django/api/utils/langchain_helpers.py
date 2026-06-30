"""
LangChain Integration - Structured LLM interactions for data queries
"""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import os
import pandas as pd
from typing import Dict, Any


# Initialize OpenAI LLM
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.2,
    api_key=os.getenv('OPENAI_API_KEY', 'dummy-key-for-initialization')
)


# =============================================================================
# Prompt Templates
# =============================================================================

# Template for Chart Type Recommendation
chart_type_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a data visualization expert. Given a dataset description, 
    recommend the best chart type and explain why.
    
    Available chart types:
    - bar: Compare categories
    - line: Show trends over time
    - scatter: Show correlation between two variables
    - pie: Show proportions of a whole
    - histogram: Show distribution of a single variable
    - box: Show statistical distribution with outliers
    """),
    ("user", """Dataset: {dataset_description}
    
    Columns: {columns}
    Sample Data: {sample_data}
    
    What chart type should I use and why?""")
])


# Template for Natural Language to Pandas Query (Structured Spec)
nl_to_pandas_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a Data expert. Convert natural language queries to a structured JSON specification for data manipulation.
    
    Rules:
    1. Return ONLY valid JSON
    2. The JSON must follow this schema:
       {
           "filter": [{"column": "col1", "operator": ">", "value": 1000}], // optional list of filters
           "groupby": "col2", // optional column to group by
           "agg": "mean", // optional aggregation function (mean, sum, count, min, max)
           "agg_column": "col3" // optional column to aggregate
       }
    3. Valid operators for filter: ">", "<", ">=", "<=", "==", "!=", "contains"
    4. Do not include any markdown formatting like ```json
    
    Example:
    User: "Show me average revenue by region for customers over 30"
    You: {
        "filter": [{"column": "age", "operator": ">", "value": 30}],
        "groupby": "region",
        "agg": "mean",
        "agg_column": "revenue"
    }
    """),
    ("user", """Dataframe columns: {columns}
    Dataframe dtypes: {dtypes}
    
    User query: {query}
    
    Generate JSON:""")
])


# Template for Data Insights
data_insights_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a data analyst. Analyze the dataset and provide 3-5 key insights.
    Be specific and mention actual numbers from the data."""),
    ("user", """Dataset Summary:
    {summary}
    
    Statistical Description:
    {stats}
    
    Provide insights:""")
])

# Template for AI Data Storyteller
data_story_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an AI Data Storyteller. Your goal is to write a 3-4 sentence plain-English narrative about a dataset.
    The narrative should highlight key trends, outliers, or interesting distributions.
    Write for a non-technical audience. Do not just list facts; tell a brief, engaging story about what the data shows.
    Be extremely concise."""),
    ("user", """Dataset Metadata:
    {metadata}
    
    Write the 3-4 sentence narrative:""")
])


# =============================================================================
# LangChain Chains
# =============================================================================

def recommend_chart_type(df: pd.DataFrame) -> Dict[str, str]:
    """
    Recommend best chart type using a rule-based engine first to save LLM costs.
    """
    columns = df.columns.tolist()
    
    # 1. Rule-based checks
    date_cols = [c for c in columns if 'date' in c.lower() or 'time' in c.lower() or pd.api.types.is_datetime64_any_dtype(df[c])]
    numeric_cols = [c for c in columns if pd.api.types.is_numeric_dtype(df[c])]
    categorical_cols = [c for c in columns if not pd.api.types.is_numeric_dtype(df[c]) and c not in date_cols]
    
    if len(date_cols) > 0 and len(numeric_cols) > 0:
        return {"chart_type": "line", "recommendation": f"Line chart recommended because there is a time-series column ({date_cols[0]}) and a numeric column ({numeric_cols[0]})."}
        
    if len(numeric_cols) == 2 and len(columns) == 2:
        return {"chart_type": "scatter", "recommendation": "Scatter plot recommended to show correlation between two numeric variables."}
        
    if len(categorical_cols) > 0 and len(numeric_cols) > 0:
        cardinality = df[categorical_cols[0]].nunique()
        if cardinality <= 15:
            return {"chart_type": "bar", "recommendation": f"Bar chart recommended to compare categories in '{categorical_cols[0]}'."}
            
    if len(numeric_cols) == 1 and len(columns) == 1:
        return {"chart_type": "histogram", "recommendation": "Histogram recommended to show the distribution of a single numeric variable."}
        
    # 2. LLM Fallback for ambiguous cases
    chain = chart_type_prompt | llm
    
    result = chain.invoke({
        "dataset_description": f"{len(df)} rows, {len(df.columns)} columns",
        "columns": ", ".join(df.columns.tolist()),
        "sample_data": df.head(3).to_string()
    })
    
    return {
        "recommendation": result.content,
        "chart_type": extract_chart_type(result.content)
    }


import json

def nl_query_to_pandas(query: str, df: pd.DataFrame) -> dict:
    """
    Convert natural language query to JSON execution spec
    """
    chain = nl_to_pandas_prompt | llm
    
    result = chain.invoke({
        "columns": ", ".join(df.columns.tolist()),
        "dtypes": str(df.dtypes.to_dict()),
        "query": query
    })
    
    content = result.content.strip()
    if content.startswith('```json'):
        content = content[7:-3]
    elif content.startswith('```'):
        content = content[3:-3]
        
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}


def get_data_insights(df: pd.DataFrame) -> str:
    """
    Generate AI insights from the dataframe
    """
    chain = data_insights_prompt | llm
    
    summary = {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "missing_values": df.isnull().sum().to_dict(),
    }
    
    result = chain.invoke({
        "summary": str(summary),
        "stats": df.describe().to_string()
    })
    
    return result.content


def generate_data_story(metadata: Dict[str, Any]) -> str:
    """
    Generate a 3-4 sentence plain-English narrative from dataset metadata.
    """
    chain = data_story_prompt | llm
    
    result = chain.invoke({
        "metadata": str(metadata)
    })
    
    return result.content.strip()


def extract_chart_type(text: str) -> str:
    """Extract chart type from LLM response"""
    chart_types = ['bar', 'line', 'scatter', 'pie', 'histogram', 'box']
    text_lower = text.lower()
    
    for chart_type in chart_types:
        if chart_type in text_lower:
            return chart_type
    
    return 'bar'  # Default


# =============================================================================
# SQL Generation (for future database queries)
# =============================================================================

sql_generation_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a SQL expert. Convert natural language to SQL queries.
    
    Rules:
    1. Return ONLY valid SQL
    2. Use table name: {table_name}
    3. No explanations
    """),
    ("user", """Table: {table_name}
    Columns: {columns}
    
    Query: {query}
    
    SQL:""")
])


def nl_to_sql(query: str, table_name: str, columns: list) -> str:
    """
    Convert natural language to SQL query
    (For future when you use PostgreSQL instead of CSV uploads)
    """
    chain = sql_generation_prompt | llm
    
    result = chain.invoke({
        "table_name": table_name,
        "columns": ", ".join(columns),
        "query": query
    })
    
    return result.content.strip()


# =============================================================================
# Example Usage in Django Views
# =============================================================================
"""
from api.utils.langchain_helpers import recommend_chart_type, nl_query_to_pandas

def categorical_chat_view(request):
    user_message = request.POST.get('message')
    csv_data = request.FILES.get('csv')
    
    df = pd.read_csv(csv_data)
    
    # Get chart recommendation
    recommendation = recommend_chart_type(df)
    
    # Or convert query to JSON execution spec
    if "filter" in user_message.lower():
        spec = nl_query_to_pandas(user_message, df)
        
        try:
            # Execute the generated spec securely
            filtered_df = df.copy()
            if "filter" in spec:
                for f in spec["filter"]:
                    op = f["operator"]
                    col = f["column"]
                    val = f["value"]
                    if op == ">": filtered_df = filtered_df[filtered_df[col] > val]
                    elif op == "<": filtered_df = filtered_df[filtered_df[col] < val]
                    elif op == ">=": filtered_df = filtered_df[filtered_df[col] >= val]
                    elif op == "<=": filtered_df = filtered_df[filtered_df[col] <= val]
                    elif op == "==": filtered_df = filtered_df[filtered_df[col] == val]
                    elif op == "!=": filtered_df = filtered_df[filtered_df[col] != val]
                    elif op == "contains": filtered_df = filtered_df[filtered_df[col].astype(str).str.contains(str(val), case=False, na=False)]
            
            if "groupby" in spec and "agg" in spec and "agg_column" in spec:
                agg_func = spec["agg"]
                if agg_func in ['mean', 'sum', 'count', 'min', 'max']:
                    filtered_df = filtered_df.groupby(spec["groupby"])[spec["agg_column"]].agg(agg_func).reset_index()
            
            return JsonResponse({'data': filtered_df.to_dict(orient='records')})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'recommendation': recommendation})
"""

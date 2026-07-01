import os
import json
from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# Initialize OpenAI LLM using standard env var or fallback
llm = ChatOpenAI(
    model="gpt-4",
    temperature=0.1,
    api_key=os.getenv('OPENAI_API_KEY', 'dummy-key-for-initialization')
)

chart_config_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an intelligent data visualization helper. Given a dataset schema and a user's natural language query, recommend the best chart configuration to plot the data.

Return ONLY a valid JSON object matching the keys below, and no other text:
{{
    "chartType": "bar" | "line" | "scatter" | "pie" | "histogram",
    "title": "A descriptive title for the chart",
    "xAxisKey": "column name to use for the X-axis (must match a column in the schema exactly)",
    "dataKeys": ["list of column names to plot on the Y-axis/values (must match columns in the schema exactly)"]
}}

Rules:
1. Every column name specified in "xAxisKey" and "dataKeys" MUST exist in the provided schema.
2. Select appropriate chartType:
   - "line" for trends over time.
   - "bar" for comparing categories.
   - "pie" for proportions of a whole (limited categories).
   - "scatter" for correlation between two numeric variables.
   - "histogram" for frequency distribution.
"""),
    ("user", """Dataset Schema:
{schema}

User Query:
{query}

Generate JSON:""")
])

def nl_query_to_chart_config(query: str, data_schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Translate a user's natural language query into a chart configuration spec.
    """
    try:
        chain = chart_config_prompt | llm
        result = chain.invoke({
            "schema": str(data_schema),
            "query": query
        })
        content = result.content.strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"Error in LLM chart config generation: {e}")
        # Robust fallback logic based on schema
        columns = data_schema.get("columns", []) if isinstance(data_schema, dict) else []
        x_key = columns[0] if len(columns) > 0 else ""
        y_key = columns[1] if len(columns) > 1 else (columns[0] if len(columns) > 0 else "")
        return {
            "chartType": "bar",
            "title": f"Query: {query}",
            "xAxisKey": x_key,
            "dataKeys": [y_key] if y_key else []
        }

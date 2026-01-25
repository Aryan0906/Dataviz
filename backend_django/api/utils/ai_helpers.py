"""
AI Helper Functions for Data Analysis and Visualization

This module provides utilities for:
1. Generating metadata summaries from DataFrames (token optimization)
2. Suggesting data cleaning actions using OpenAI
3. Generating chart configurations from natural language queries
"""

import os
import json
import time
import pandas as pd
from typing import Dict, List, Any, Optional
from openai import OpenAI

# Configuration
OPENAI_MODEL = "openai/gpt-4o-mini"  # OpenRouter model format
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


def _get_openai_client():
    """Lazy initialization of OpenAI client configured for OpenRouter"""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")
    return OpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1"
    )



class AITimeoutError(Exception):
    """Raised when AI service times out after all retries"""
    pass


class AIValidationError(Exception):
    """Raised when AI returns invalid or malformed data"""
    pass


def generate_metadata_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generate a compact metadata summary from a DataFrame.
    
    This is the "token optimization" strategy - instead of sending the full CSV
    to OpenAI (which could be 100KB+), we send only metadata (~2KB).
    
    Args:
        df: Pandas DataFrame to analyze
        
    Returns:
        Dictionary containing:
        - columns: List of column names
        - dtypes: Data types for each column
        - sample_rows: First 5 rows as dict
        - statistics: Numeric column statistics from .describe()
        - row_count: Total number of rows
        - null_counts: Number of null values per column
    """
    metadata = {
        "columns": df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "row_count": len(df),
        "null_counts": df.isnull().sum().to_dict(),
        "sample_rows": df.head(5).to_dict(orient='records'),
    }
    
    # Add statistics for numeric columns
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    if numeric_cols:
        stats_df = df[numeric_cols].describe()
        metadata["statistics"] = stats_df.to_dict()
    
    return metadata


def suggest_cleaning_actions(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use OpenAI to identify data quality issues and suggest cleaning actions.
    
    Args:
        metadata: DataFrame metadata from generate_metadata_summary()
        
    Returns:
        Dictionary containing:
        - issues: List of identified data quality problems
        - suggested_actions: List of recommended cleaning steps
        - summary: Brief overall assessment
        
    Raises:
        AITimeoutError: If all retry attempts fail
        AIValidationError: If AI returns invalid JSON
    """
    system_prompt = """You are a Data Quality Expert. Analyze the provided dataset metadata 
and identify data quality issues such as:
- Missing values (nulls)
- Mixed data types in columns
- Potential outliers (based on statistics)
- Inconsistent formatting
- Duplicate-prone columns

Return ONLY valid JSON in this exact format:
{
  "issues": ["issue 1", "issue 2", ...],
  "suggested_actions": ["action 1", "action 2", ...],
  "summary": "Brief overall assessment"
}"""

    user_prompt = f"""Analyze this dataset metadata and identify data quality issues:

{json.dumps(metadata, indent=2)}

Provide specific, actionable recommendations."""

    for attempt in range(MAX_RETRIES):
        try:
            client = _get_openai_client()
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent output
                timeout=30  # 30 second timeout per request
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                result = json.loads(content)
                
                # Validate required fields
                if not all(key in result for key in ["issues", "suggested_actions", "summary"]):
                    raise AIValidationError("Missing required fields in AI response")
                
                return result
                
            except json.JSONDecodeError as e:
                raise AIValidationError(f"AI returned invalid JSON: {str(e)}")
        
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                print(f"AI request failed (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}")
                time.sleep(RETRY_DELAY * (attempt + 1))  # Exponential backoff
                continue
            else:
                # All retries exhausted
                raise AITimeoutError(f"AI service timed out after {MAX_RETRIES} attempts: {str(e)}")
    
    raise AITimeoutError("AI service failed after all retry attempts")


def generate_chart_config(user_query: str, schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a Recharts configuration from a natural language query.
    
    Args:
        user_query: Natural language description (e.g., "Show sales by month as a line chart")
        schema: Dataset schema with column names and types
        
    Returns:
        Dictionary containing:
        - chartType: "bar" | "line" | "scatter" | "pie"
        - xAxisKey: Column name for X-axis
        - dataKeys: List of column names for Y-axis/data series
        - title: Chart title
        - summary: Brief explanation of the insight
        
    Raises:
        AITimeoutError: If all retry attempts fail
        AIValidationError: If AI returns invalid configuration
    """
    available_columns = schema.get("columns", [])
    column_types = schema.get("dtypes", {})
    
    system_prompt = """You are a Data Visualization Expert using Recharts library.
Your task is to convert natural language queries into chart configurations.

CRITICAL CONSTRAINTS:
1. Return ONLY valid JSON - no code, no explanations, just JSON
2. Use ONLY column names that exist in the provided schema
3. Choose appropriate chart types based on data types
4. For bar/line charts: xAxisKey should be categorical or time-based, dataKeys should be numeric
5. For pie charts: use one categorical column and one numeric column

Return ONLY valid JSON in this exact format:
{
  "chartType": "bar" | "line" | "scatter" | "pie",
  "xAxisKey": "column_name",
  "dataKeys": ["column1", "column2"],
  "title": "Descriptive chart title",
  "summary": "Brief explanation of what this chart shows"
}"""

    user_prompt = f"""Generate a chart configuration for this query: "{user_query}"

Available columns and types:
{json.dumps({"columns": available_columns, "types": column_types}, indent=2)}

Return the chart configuration as JSON."""

    for attempt in range(MAX_RETRIES):
        try:
            client = _get_openai_client()
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                timeout=30
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                result = json.loads(content)
                
                # Validate required fields
                required_fields = ["chartType", "xAxisKey", "dataKeys", "title", "summary"]
                if not all(key in result for key in required_fields):
                    raise AIValidationError(f"Missing required fields. Expected: {required_fields}")
                
                # Validate chart type
                valid_chart_types = ["bar", "line", "scatter", "pie"]
                if result["chartType"] not in valid_chart_types:
                    raise AIValidationError(f"Invalid chartType. Must be one of: {valid_chart_types}")
                
                # Validate column names exist in schema
                if result["xAxisKey"] not in available_columns:
                    raise AIValidationError(f"xAxisKey '{result['xAxisKey']}' not found in schema")
                
                for key in result["dataKeys"]:
                    if key not in available_columns:
                        raise AIValidationError(f"dataKey '{key}' not found in schema")
                
                return result
                
            except json.JSONDecodeError as e:
                raise AIValidationError(f"AI returned invalid JSON: {str(e)}")
        
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                print(f"AI request failed (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}")
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            else:
                raise AITimeoutError(f"AI service timed out after {MAX_RETRIES} attempts: {str(e)}")
    
    raise AITimeoutError("AI service failed after all retry attempts")

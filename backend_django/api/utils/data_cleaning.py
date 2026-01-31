"""
Data Cleaning Utilities for Smart Data Health Checks
Detects and fixes common data quality issues in uploaded CSVs.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List


def check_data_health(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Performs comprehensive health check on dataframe.
    
    Args:
        df: Input dataframe to analyze
        
    Returns:
        Dictionary containing:
        - has_errors: bool indicating if issues were found
        - missing_rows: int count of rows with any null values
        - missing_by_column: dict of null counts per column
        - duplicates: int count of duplicate rows
        - data_types: dict of column types
        - type_warnings: list of columns with potential type issues
        - total_rows: int
        - total_columns: int
    """
    health_report = {
        'has_errors': False,
        'missing_rows': 0,
        'missing_by_column': {},
        'duplicates': 0,
        'data_types': {},
        'type_warnings': [],
        'total_rows': len(df),
        'total_columns': len(df.columns),
        'issues': []
    }
    
    # Check for missing values
    null_counts = df.isnull().sum()
    missing_rows = df.isnull().any(axis=1).sum()
    
    health_report['missing_rows'] = int(missing_rows)
    health_report['missing_by_column'] = {
        col: int(count) for col, count in null_counts.items() if count > 0
    }
    
    if missing_rows > 0:
        health_report['has_errors'] = True
        health_report['issues'].append({
            'type': 'missing_values',
            'severity': 'warning',
            'message': f"⚠️ {missing_rows} rows contain missing values",
            'affected_columns': list(health_report['missing_by_column'].keys())
        })
    
    # Check for duplicates
    duplicate_count = df.duplicated().sum()
    health_report['duplicates'] = int(duplicate_count)
    
    if duplicate_count > 0:
        health_report['has_errors'] = True
        health_report['issues'].append({
            'type': 'duplicates',
            'severity': 'warning',
            'message': f"⚠️ {duplicate_count} duplicate rows detected"
        })
    
    # Check data types and identify potential issues
    for col in df.columns:
        dtype = str(df[col].dtype)
        health_report['data_types'][col] = dtype
        
        # Check if numeric columns are stored as strings/objects
        if dtype == 'object':
            # Try to convert to numeric
            try:
                non_null_values = df[col].dropna()
                if len(non_null_values) > 0:
                    # Check if values look numeric
                    numeric_conversion = pd.to_numeric(non_null_values, errors='coerce')
                    successful_conversions = numeric_conversion.notna().sum()
                    
                    # If >80% of values can be converted to numeric, it's likely a type issue
                    if successful_conversions / len(non_null_values) > 0.8:
                        health_report['type_warnings'].append({
                            'column': col,
                            'current_type': dtype,
                            'suggested_type': 'numeric',
                            'convertible_ratio': float(successful_conversions / len(non_null_values))
                        })
                        health_report['has_errors'] = True
                        health_report['issues'].append({
                            'type': 'type_mismatch',
                            'severity': 'info',
                            'message': f"ℹ️ Column '{col}' appears numeric but stored as text",
                            'column': col
                        })
            except:
                pass
    
    return health_report


def clean_data(df: pd.DataFrame, method: str = 'drop', columns: List[str] = None) -> pd.DataFrame:
    """
    Applies cleaning operations to dataframe.
    
    Args:
        df: Input dataframe to clean
        method: Cleaning method - 'drop', 'mean', 'median', 'mode', 'forward_fill', 'zero'
        columns: Specific columns to clean (None = all columns)
        
    Returns:
        Cleaned dataframe
    """
    df_cleaned = df.copy()
    
    if method == 'drop':
        # Drop rows with any missing values
        df_cleaned = df_cleaned.dropna()
        
    elif method == 'drop_duplicates':
        # Remove duplicate rows
        df_cleaned = df_cleaned.drop_duplicates()
        
    elif method in ['mean', 'median', 'mode']:
        # Fill numeric columns with statistical measures
        target_cols = columns if columns else df_cleaned.select_dtypes(include=[np.number]).columns
        
        for col in target_cols:
            if col in df_cleaned.columns:
                if method == 'mean':
                    df_cleaned[col].fillna(df_cleaned[col].mean(), inplace=True)
                elif method == 'median':
                    df_cleaned[col].fillna(df_cleaned[col].median(), inplace=True)
                elif method == 'mode':
                    mode_value = df_cleaned[col].mode()
                    if len(mode_value) > 0:
                        df_cleaned[col].fillna(mode_value[0], inplace=True)
    
    elif method == 'forward_fill':
        # Forward fill missing values
        target_cols = columns if columns else df_cleaned.columns
        df_cleaned[target_cols] = df_cleaned[target_cols].fillna(method='ffill')
    
    elif method == 'zero':
        # Fill with zeros (useful for numeric data)
        target_cols = columns if columns else df_cleaned.select_dtypes(include=[np.number]).columns
        df_cleaned[target_cols] = df_cleaned[target_cols].fillna(0)
    
    # Convert type warnings (numeric columns stored as strings)
    for col in df_cleaned.select_dtypes(include=['object']).columns:
        try:
            # Try to convert to numeric
            converted = pd.to_numeric(df_cleaned[col], errors='coerce')
            if converted.notna().sum() / len(df_cleaned) > 0.8:
                df_cleaned[col] = converted
        except:
            pass
    
    return df_cleaned


def get_cleaning_summary(df_original: pd.DataFrame, df_cleaned: pd.DataFrame) -> Dict[str, Any]:
    """
    Compare original and cleaned dataframes to show what changed.
    
    Args:
        df_original: Original dataframe before cleaning
        df_cleaned: Cleaned dataframe
        
    Returns:
        Summary of changes made
    """
    return {
        'rows_before': len(df_original),
        'rows_after': len(df_cleaned),
        'rows_removed': len(df_original) - len(df_cleaned),
        'columns_before': len(df_original.columns),
        'columns_after': len(df_cleaned.columns),
        'nulls_before': int(df_original.isnull().sum().sum()),
        'nulls_after': int(df_cleaned.isnull().sum().sum()),
        'duplicates_removed': int(df_original.duplicated().sum() - df_cleaned.duplicated().sum())
    }


def calculate_correlation_matrix(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calculate correlation matrix for numeric columns.
    
    Args:
        df: Input dataframe
        
    Returns:
        Dictionary with correlation matrix and metadata
    """
    # Select only numeric columns
    numeric_df = df.select_dtypes(include=[np.number])
    
    if len(numeric_df.columns) < 2:
        return {
            'error': 'Not enough numeric columns for correlation analysis',
            'columns': []
        }
    
    # Calculate correlation matrix
    corr_matrix = numeric_df.corr()
    
    # Convert to list of dictionaries for easy frontend consumption
    # Format: [{x: 'col1', y: 'col2', value: 0.85}, ...]
    correlation_data = []
    columns = list(corr_matrix.columns)
    
    for i, col1 in enumerate(columns):
        for j, col2 in enumerate(columns):
            correlation_data.append({
                'x': col1,
                'y': col2,
                'value': float(corr_matrix.iloc[i, j]),
                'abs_value': abs(float(corr_matrix.iloc[i, j]))
            })
    
    # Find strongest correlations (excluding diagonal)
    strong_correlations = []
    for i, col1 in enumerate(columns):
        for j, col2 in enumerate(columns):
            if i < j:  # Only upper triangle, avoid duplicates
                corr_val = float(corr_matrix.iloc[i, j])
                if abs(corr_val) > 0.5:  # Threshold for "strong" correlation
                    strong_correlations.append({
                        'var1': col1,
                        'var2': col2,
                        'correlation': corr_val,
                        'strength': 'strong' if abs(corr_val) > 0.7 else 'moderate'
                    })
    
    # Sort by absolute correlation value
    strong_correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    
    return {
        'matrix': correlation_data,
        'columns': columns,
        'strong_correlations': strong_correlations[:10],  # Top 10
        'total_variables': len(columns)
    }

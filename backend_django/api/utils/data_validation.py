"""
Data Validation - Pandera schemas for robust CSV validation
"""
import pandas as pd
import pandera as pa
from pandera import Column, DataFrameSchema, Check
from typing import Dict, Any


# =============================================================================
# Pandera Schemas - Define expected data structure
# =============================================================================

# Schema for Regression Data
regression_schema = DataFrameSchema({
    "x": Column(float, checks=[
        Check.greater_than_or_equal_to(0, ignore_na=True),
    ], nullable=True, coerce=True),
    "y": Column(float, checks=[
        Check.greater_than_or_equal_to(0, ignore_na=True),
    ], nullable=True, coerce=True),
}, strict=False)  # Allow additional columns


# Schema for Sales/Business Data
sales_schema = DataFrameSchema({
    "sales": Column(float, checks=[
        Check.greater_than(0, error="Sales must be positive"),
    ], coerce=True),
    "date": Column(pa.DateTime, coerce=True, nullable=True),
    "quantity": Column(int, checks=[
        Check.greater_than_or_equal_to(0),
    ], coerce=True, nullable=True),
}, strict=False)


# Flexible Schema - validates any numeric CSV
numeric_csv_schema = DataFrameSchema(
    columns={},
    checks=[
        Check(lambda df: len(df) > 0, error="CSV must have at least 1 row"),
        Check(lambda df: len(df.columns) > 0, error="CSV must have at least 1 column"),
    ],
    coerce=True
)


# =============================================================================
# Validation Functions
# =============================================================================

def validate_csv_data(df: pd.DataFrame, schema_name: str = "numeric") -> Dict[str, Any]:
    """
    Validate dataframe against a schema
    
    Args:
        df: Pandas dataframe to validate
        schema_name: "regression", "sales", or "numeric"
    
    Returns:
        {
            'valid': True/False,
            'errors': [...],
            'validated_df': DataFrame (if valid),
            'summary': {...}
        }
    """
    schemas = {
        "regression": regression_schema,
        "sales": sales_schema,
        "numeric": numeric_csv_schema,
    }
    
    schema = schemas.get(schema_name, numeric_csv_schema)
    
    try:
        # Validate and coerce types
        validated_df = schema.validate(df, lazy=True)
        
        return {
            'valid': True,
            'errors': [],
            'validated_df': validated_df,
            'summary': {
                'rows': len(validated_df),
                'columns': len(validated_df.columns),
                'dtypes': validated_df.dtypes.to_dict(),
                'null_counts': validated_df.isnull().sum().to_dict(),
            }
        }
    except pa.errors.SchemaErrors as err:
        # Collect all validation errors
        error_list = []
        for failure_case in err.failure_cases.itertuples():
            error_list.append({
                'column': failure_case.column,
                'check': failure_case.check,
                'error': str(failure_case),
            })
        
        return {
            'valid': False,
            'errors': error_list,
            'validated_df': None,
            'summary': None,
        }


def create_dynamic_schema(df: pd.DataFrame) -> DataFrameSchema:
    """
    Create a Pandera schema from a dataframe
    
    Useful for user-uploaded CSVs - auto-detect column types
    """
    column_schemas = {}
    
    for col in df.columns:
        dtype = df[col].dtype
        
        if pd.api.types.is_numeric_dtype(dtype):
            column_schemas[col] = Column(
                dtype,
                checks=[Check.notnull()] if df[col].isnull().sum() == 0 else [],
                nullable=True,
                coerce=True
            )
        elif pd.api.types.is_string_dtype(dtype):
            column_schemas[col] = Column(str, nullable=True, coerce=True)
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            column_schemas[col] = Column(pa.DateTime, nullable=True, coerce=True)
    
    return DataFrameSchema(column_schemas, strict=False, coerce=True)


# =============================================================================
# Example Usage in Django Views
# =============================================================================
"""
from api.utils.data_validation import validate_csv_data

@csrf_exempt
def upload_csv_view(request):
    csv_file = request.FILES.get('file')
    df = pd.read_csv(csv_file)
    
    # Validate the CSV
    validation_result = validate_csv_data(df, schema_name="regression")
    
    if not validation_result['valid']:
        return JsonResponse({
            'error': 'Invalid CSV format',
            'details': validation_result['errors']
        }, status=400)
    
    # Use the validated (and cleaned) dataframe
    clean_df = validation_result['validated_df']
    
    # Continue with regression analysis...
    return JsonResponse({
        'success': True,
        'summary': validation_result['summary']
    })
"""

import scipy.stats as stats
import pandas as pd
import numpy as np

def run_hypothesis_test(df, group_col, value_col):
    """
    Run an appropriate statistical test (t-test or ANOVA) based on the number of groups.
    """
    if group_col not in df.columns or value_col not in df.columns:
        return {'error': 'Columns not found in dataset.'}
        
    # Drop NaNs
    df_clean = df[[group_col, value_col]].dropna()
    
    # Get unique groups
    groups = df_clean[group_col].unique()
    
    # Need at least 2 groups
    if len(groups) < 2:
        return {
            'error': 'Need at least 2 distinct groups to run a hypothesis test.'
        }
    
    # Extract arrays
    group_data = [df_clean[df_clean[group_col] == g][value_col].values for g in groups]
    
    # Check if we have enough data per group
    for i, data in enumerate(group_data):
        if len(data) < 2:
            return {
                'error': f'Group {groups[i]} has less than 2 data points.'
            }
            
    if len(groups) == 2:
        # T-test
        stat, p_value = stats.ttest_ind(group_data[0], group_data[1], equal_var=False) # Welch's t-test
        test_name = "Welch's t-test (2 groups)"
        
        # Calculate means
        mean_1 = np.mean(group_data[0])
        mean_2 = np.mean(group_data[1])
        
        verdict = 'statistically significant' if p_value < 0.05 else 'not statistically significant'
        conclusion = f'The difference between {groups[0]} (mean={mean_1:.2f}) and {groups[1]} (mean={mean_2:.2f}) is {verdict} (p={p_value:.4f}).'
        
        return {
            'test_name': test_name,
            'p_value': p_value,
            'statistic': stat,
            'groups': [str(g) for g in groups],
            'means': [mean_1, mean_2],
            'conclusion': conclusion
        }
        
    else:
        # ANOVA
        stat, p_value = stats.f_oneway(*group_data)
        test_name = f'One-way ANOVA ({len(groups)} groups)'
        
        means = [np.mean(d) for d in group_data]
        
        verdict = 'statistically significant difference' if p_value < 0.05 else 'no statistically significant difference'
        conclusion = f'There is {verdict} in {value_col} across the {len(groups)} groups (p={p_value:.4f}).'
        
        return {
            'test_name': test_name,
            'p_value': p_value,
            'statistic': stat,
            'groups': [str(g) for g in groups],
            'means': means,
            'conclusion': conclusion
        }

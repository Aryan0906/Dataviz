import json
from pathlib import Path

def generate_notebook(visualization_id, mode='full'):
    """Generate a minimal Jupyter notebook.

    Parameters
    ----------
    visualization_id: int or str
        Identifier of the visualization to export.
    mode: str, optional
        'chartOnly' – include only chart rendering code.
        'full' – include data loading, chart code, and optional AI insights.
    """
    # Placeholder implementation – in a real app you would fetch the visualization data
    cells = []
    if mode == 'full':
        cells.append({
            "cell_type": "code",
            "metadata": {},
            "source": ["import pandas as pd", "\n# Load data (placeholder)", "df = pd.read_csv('data.csv')\n"],
            "outputs": []
        })
    # Chart rendering cell (placeholder)
    cells.append({
        "cell_type": "code",
        "metadata": {},
        "source": ["# Render chart for visualization ID: {}".format(visualization_id), "\n# Insert chart library code here\n"],
        "outputs": []
    })
    if mode == 'full':
        # AI insights cell (placeholder)
        cells.append({
            "cell_type": "markdown",
            "metadata": {},
            "source": ["## AI Insights\n", "*Generated insights would appear here.*\n"]
        })
    notebook = {
        "cells": cells,
        "metadata": {
            "kernelspec": {"name": "python3", "language": "python", "display_name": "Python 3"},
            "language_info": {"name": "python", "version": "3.x"}
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }
    return json.dumps(notebook, indent=2)

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { runQuery, getQuery, allQuery } from '../database/db.js';
import regression from 'regression';

const router = Router();

// Save analysis result
router.post('/save', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { title, dataPoints, regressionType, equation, rSquared } = req.body;
    const userId = req.userId;

    if (!title || !dataPoints) {
      return res.status(400).json({ error: 'Title and data points are required' });
    }

    const result = await runQuery(
      'INSERT INTO analysis_results (user_id, title, data_points, regression_type, equation, r_squared) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, JSON.stringify(dataPoints), regressionType, equation, rSquared]
    );

    res.status(201).json({
      message: 'Analysis saved successfully',
      id: result.id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save analysis' });
  }
});

// Get all saved analyses for user
router.get('/analyses', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const analyses = await allQuery(
      'SELECT id, title, regression_type, equation, r_squared, created_at FROM analysis_results WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ analyses });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch analyses' });
  }
});

// Get specific analysis
router.get('/analyses/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const analysis = await getQuery(
      'SELECT * FROM analysis_results WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({
      ...analysis,
      data_points: JSON.parse(analysis.data_points)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch analysis' });
  }
});

// Delete analysis
router.delete('/analyses/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const analysis = await getQuery(
      'SELECT id FROM analysis_results WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    await runQuery(
      'DELETE FROM analysis_results WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Analysis deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete analysis' });
  }
});

// Perform regression analysis
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { dataPoints } = req.body;

    if (!dataPoints || dataPoints.length < 2) {
      return res.status(400).json({ error: 'At least 2 data points are required' });
    }

    const points: [number, number][] = dataPoints.map((d: any) => [d.x, d.y]);

    const models = [
      { type: 'linear', result: regression.linear(points) },
      { type: 'polynomial', result: regression.polynomial(points, { order: 2 }) },
      { type: 'exponential', result: regression.exponential(points) },
      { type: 'logarithmic', result: regression.logarithmic(points) },
      { type: 'power', result: regression.power(points) }
    ];

    const bestModel = models.reduce((best, current) =>
      current.result.r2 > best.result.r2 ? current : best
    );

    res.json({
      type: bestModel.type,
      equation: bestModel.result.string,
      r2: bestModel.result.r2,
      predictions: bestModel.result.points
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

export default router;

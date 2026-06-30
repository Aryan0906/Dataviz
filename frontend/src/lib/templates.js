export const analysisTemplates = [
  {
    id: 'sales-marketing',
    title: 'Marketing ROI (Linear)',
    description: 'Analyze how marketing spend impacts total sales revenue.',
    icon: 'trending',
    type: 'regression',
    data: [
      { x: 1000, y: 15000 },
      { x: 2000, y: 28000 },
      { x: 3000, y: 42000 },
      { x: 4000, y: 55000 },
      { x: 5000, y: 72000 },
      { x: 6000, y: 86000 },
      { x: 7000, y: 98000 },
      { x: 8000, y: 112000 }
    ],
    labels: { x: 'Marketing Spend ($)', y: 'Sales Revenue ($)' }
  },
  {
    id: 'student-grades',
    title: 'Study Hours vs Grades',
    description: 'A classic dataset demonstrating diminishing returns (Polynomial).',
    icon: 'graduation',
    type: 'regression',
    data: [
      { x: 1, y: 45 },
      { x: 2, y: 55 },
      { x: 3, y: 68 },
      { x: 4, y: 78 },
      { x: 5, y: 85 },
      { x: 6, y: 91 },
      { x: 7, y: 94 },
      { x: 8, y: 96 },
      { x: 9, y: 97 },
      { x: 10, y: 97 }
    ],
    labels: { x: 'Study Hours', y: 'Exam Score' }
  },
  {
    id: 'server-load',
    title: 'Server Load vs Response Time',
    description: 'Exponential curve showing server performance under load.',
    icon: 'server',
    type: 'regression',
    data: [
      { x: 100, y: 45 },
      { x: 200, y: 50 },
      { x: 300, y: 58 },
      { x: 400, y: 75 },
      { x: 500, y: 110 },
      { x: 600, y: 180 },
      { x: 700, y: 320 },
      { x: 800, y: 580 },
      { x: 900, y: 950 }
    ],
    labels: { x: 'Active Users', y: 'Response Time (ms)' }
  }
];

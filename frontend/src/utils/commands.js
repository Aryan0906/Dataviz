// commands.js – defines available actions for the Command Palette
export const commands = [
  {
    id: 'upload-csv',
    name: 'Upload CSV',
    shortcut: '⌘U',
    action: () => {
      // Navigate to upload page (handled by router)
      const navigate = require('react-router-dom').useNavigate();
      navigate('/manual-plot');
    },
  },
  {
    id: 'save-analysis',
    name: 'Save Analysis',
    shortcut: '⌘S',
    action: () => {
      // Trigger save – placeholder implementation
      console.log('Save analysis triggered');
    },
  },
  {
    id: 'export-notebook',
    name: 'Export Notebook',
    shortcut: '⌘E',
    action: () => {
      // Open export modal – we will handle in ExportButton component
      const event = new CustomEvent('openExportModal');
      window.dispatchEvent(event);
    },
  },
];

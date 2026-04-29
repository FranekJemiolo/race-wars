import React from 'react';
import { ReplayTestPage } from '../pages/ReplayTestPage';

export const TestNavigation: React.FC = () => {
  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="bg-gray-800 rounded-lg p-3 shadow-lg">
        <h3 className="text-sm font-semibold text-white mb-2">Navigation</h3>
        <div className="space-y-2">
          <a
            href="/"
            className="block text-sm text-blue-400 hover:text-blue-300"
          >
            🏁 Race Wars
          </a>
          <a
            href="/replay-demo"
            className="block text-sm text-blue-400 hover:text-blue-300"
          >
            🎬 Replay Demo
          </a>
          <a
            href="/replay-tests"
            className="block text-sm text-green-400 hover:text-green-300"
          >
            🧪 E2E Tests
          </a>
        </div>
      </div>
    </div>
  );
};

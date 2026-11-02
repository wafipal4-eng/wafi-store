// Stat.tsx
import React from 'react';

interface StatProps {
  title: string;
  value: string;
  description: string;
}

const Stat: React.FC<StatProps> = ({ title, value, description }) => (
  <div className="stat">
    <div className="stat-title text-sm font-medium text-gray-600">{title}</div>
    <div className="stat-value text-xl font-bold text-gray-900">{value}</div>
    <div className="stat-desc text-sm text-gray-500">{description}</div>
  </div>
);

export default Stat;

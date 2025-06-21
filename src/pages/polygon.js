import React from 'react';

export default function PolygonPage() {
  return (
    <div style={{ height: '100vh' }}>
      <iframe
        src="/polygon/index.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Polygon App"
      />
    </div>
  );
}


import { useState, useRef, useLayoutEffect, useEffect, memo } from 'react';
import './App.css';

// ============================================
// Pattern A: Inline styles
// ============================================
const PatternA = memo(function PatternA({ x, y }: { x: number; y: number }) {
  return (
    <div className="dot" style={{ transform: `translate(${x}px, ${y}px)` }} />
  );
});

// ============================================
// Pattern B: useRef + useLayoutEffect
// ============================================
const PatternB = memo(function PatternB({ x, y }: { x: number; y: number }) {
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const elm = elementRef.current;
    if (!elm) return;
    elm.style.transform = `translate(${x}px, ${y}px)`;
  }, [x, y]);

  return <div className="dot" ref={elementRef} />;
});

// ============================================
// Pattern C: Ref callback
// ============================================
const PatternC = memo(function PatternC({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="dot"
      ref={(elm) => {
        if (elm) elm.style.transform = `translate(${x}px, ${y}px)`;
      }}
    />
  );
});

// ============================================
// Benchmark component
// ============================================
type PatternType = 'A' | 'B' | 'C';

interface Position {
  x: number;
  y: number;
}

function App() {
  const [pattern, setPattern] = useState<PatternType>('A');
  const [componentCount, setComponentCount] = useState(1000);
  const [updateInterval, setUpdateInterval] = useState(16);
  const [isRunning, setIsRunning] = useState(false);
  const [positions, setPositions] = useState<Position[]>(() => {
    const initial: Position[] = [];
    for (let i = 0; i < 1000; i++) {
      initial.push({ x: Math.random() * 600, y: Math.random() * 400 });
    }
    return initial;
  });

  // Reinitialize positions when count changes
  useEffect(() => {
    const newPositions: Position[] = [];
    for (let i = 0; i < componentCount; i++) {
      newPositions.push({
        x: Math.random() * 600,
        y: Math.random() * 400,
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPositions(newPositions);
  }, [componentCount]);

  // Animation loop
  useEffect(() => {
    if (!isRunning) return;

    let animationId: number;
    let lastUpdate = performance.now();

    const animate = () => {
      const now = performance.now();

      if (now - lastUpdate >= updateInterval) {
        lastUpdate = now;

        setPositions((prev) =>
          prev.map((pos) => ({
            x: pos.x + (Math.random() - 0.5) * 10,
            y: pos.y + (Math.random() - 0.5) * 10,
          })),
        );
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isRunning, updateInterval]);

  const PatternComponent =
    pattern === 'A' ? PatternA : pattern === 'B' ? PatternB : PatternC;

  return (
    <div className="app">
      <header className="header">
        <h1>React Transform Pattern Benchmark</h1>
        <p>
          {componentCount} components updating every {updateInterval}ms (
          {Math.round(1000 / updateInterval)} target FPS)
        </p>
      </header>

      <div className="controls">
        <div className="control-group">
          <label>Pattern:</label>
          <div className="button-group">
            <button
              className={pattern === 'A' ? 'active' : ''}
              onClick={() => setPattern('A')}
            >
              A: Inline Style
            </button>
            <button
              className={pattern === 'B' ? 'active' : ''}
              onClick={() => setPattern('B')}
            >
              B: useLayoutEffect
            </button>
            <button
              className={pattern === 'C' ? 'active' : ''}
              onClick={() => setPattern('C')}
            >
              C: Ref Callback
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Components: {componentCount}</label>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={componentCount}
            onChange={(e) => setComponentCount(Number(e.target.value))}
            disabled={isRunning}
          />
        </div>

        <div className="control-group">
          <label>
            Update interval: {updateInterval}ms (
            {Math.round(1000 / updateInterval)} target FPS)
          </label>
          <input
            type="range"
            min="4"
            max="100"
            step="1"
            value={updateInterval}
            onChange={(e) => setUpdateInterval(Number(e.target.value))}
            disabled={isRunning}
          />
        </div>

        <div className="control-group">
          <button
            className="primary"
            onClick={() => setIsRunning(true)}
            disabled={isRunning}
          >
            Start
          </button>
          <button onClick={() => setIsRunning(false)} disabled={!isRunning}>
            Stop
          </button>
        </div>
      </div>

      <div className="benchmark-container">
        {positions.map((pos, i) => (
          <PatternComponent key={i} x={pos.x} y={pos.y} />
        ))}
      </div>

      <div className="pattern-info">
        <h2>Pattern Descriptions</h2>
        <div className="pattern-cards">
          <div className={`pattern-card ${pattern === 'A' ? 'active' : ''}`}>
            <h3>A: Inline Style</h3>
            <pre>{`<div style={{ transform: \`translate(\${x}px, \${y}px)\` }} />`}</pre>
            <p>
              React handles the style object, creating new objects each render.
            </p>
          </div>
          <div className={`pattern-card ${pattern === 'B' ? 'active' : ''}`}>
            <h3>B: useLayoutEffect + Ref</h3>
            <pre>{`useLayoutEffect(() => {
  elm.style.transform = \`...\`
}, [x, y])`}</pre>
            <p>Direct DOM manipulation after React commit phase.</p>
          </div>
          <div className={`pattern-card ${pattern === 'C' ? 'active' : ''}`}>
            <h3>C: Ref Callback</h3>
            <pre>{`ref={(elm) => {
  if (elm) elm.style.transform = \`...\`
}}`}</pre>
            <p>
              Sets transform during ref attachment. Creates new function each
              render.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';

import MapChart from './MapChart'

import './App.css';

function App() {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth)
    setHeight(window.innerHeight)
    window.addEventListener('resize', () => {
      // const nextWidth = window.innerWidth
      // const nextHeight = window.innerHeight;
      // const deltaX = Math.abs(width - nextWidth);
      // const deltaY = Math.abs(height - nextHeight);
      // if ( deltaX >= 40 || deltaY >= 30) {
      //   console.log(width , nextWidth)
        setWidth(window.innerWidth)
        setHeight(window.innerHeight)
    // }
    });
  }, []);

  return (
    <div className="App">
      <MapChart width={width} height={height} />
    </div>
  );
}

export default App;

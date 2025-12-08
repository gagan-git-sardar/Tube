import { TFL_COLORS, LINE_NAMES, TUBE_LINES } from '../services/tflApi';

function Legend() {
  return (
    <div className='legend'>
      <h4>🚇 Tube Lines</h4>
      {TUBE_LINES.map((lineId) => (
        <div key={lineId} className='legend-item'>
          <div
            className='legend-color'
            style={{ backgroundColor: TFL_COLORS[lineId] }}
          />
          <span>{LINE_NAMES[lineId]}</span>
        </div>
      ))}
    </div>
  );
}

export default Legend;

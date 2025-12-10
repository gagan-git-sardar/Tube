
function StationLegend() {
    return (
        <div
            style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '15px',
                borderRadius: '8px',
                fontFamily: 'Segoe UI, sans-serif',
                zIndex: 1000,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                maxWidth: '220px',
            }}>
            <h4
                style={{
                    marginBottom: '8px',
                    color: '#333',
                    borderBottom: '1px solid #ddd',
                    paddingBottom: '5px',
                }}>
                Station Busyness
            </h4>
            <p
                style={{
                    fontSize: '11px',
                    color: '#666',
                    marginBottom: '12px',
                    lineHeight: '1.3',
                }}>
                Circle radius is determined by connection count (1-6+).
            </p>
            <div
                className='legend-item'
                style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div
                    style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(227, 32, 23, 0.8)',
                        border: '2px solid #E32017',
                        marginRight: '10px',
                        marginLeft: '3px',
                    }}
                />
                <span style={{ fontSize: '12px' }}>Less Busy (1-2 Conn.)</span>
            </div>
            <div
                className='legend-item'
                style={{ display: 'flex', alignItems: 'center' }}>
                <div
                    style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(227, 32, 23, 0.8)',
                        border: '2px solid #E32017',
                        marginRight: '6px',
                    }}
                />
                <span style={{ fontSize: '12px' }}>Very Busy (6+ Conn.)</span>
            </div>
        </div>
    );
}

export default StationLegend;


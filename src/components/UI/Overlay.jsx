import React from 'react';

const Overlay = () => {
    return (
        <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.8)',
            padding: '20px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            color: 'white',
            maxWidth: '300px'
        }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>London Tube Live</h1>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#ccc' }}>Real-time train positions via TfL Open Data</p>

            <div style={{ fontSize: '0.8rem' }}>
                <div style={{ fontSize: '0.8rem' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>Network Status</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 10, height: 10, background: '#00ff00', borderRadius: '50%', boxShadow: '0 0 5px #00ff00' }}></div>
                        <span>All 14 Lines Active</span>
                    </div>
                    <p style={{ margin: '5px 0', fontSize: '0.75rem', color: '#aaa' }}>
                        Tube, DLR, Elizabeth, Overground
                    </p>
                    <p style={{ margin: '10px 0 0 0', fontSize: '0.75rem', color: '#888' }}>
                        Station sizes reflect weekday ridership volume.
                    </p>
                </div>
            </div>
        </div>
    );
};

const LineBadge = ({ color, name }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: 10, height: 10, background: color, borderRadius: '50%' }}></div>
        <span>{name}</span>
    </div>
);

export default Overlay;

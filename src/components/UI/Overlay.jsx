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
                <h3 style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>Live Lines</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <LineBadge color="#0098D4" name="Victoria" />
                    <LineBadge color="#A0A5A9" name="Jubilee" />
                    <LineBadge color="#E32017" name="Central" />
                    <LineBadge color="#B36305" name="Bakerloo" />
                    <LineBadge color="#000000" name="Northern" />
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

import React from 'react';
import { Badge } from 'react-bootstrap';

const timelineStyles = {
    container: {
        position: 'relative',
        paddingLeft: '30px',
    },
    line: {
        position: 'absolute',
        left: '10px',
        top: '0',
        bottom: '0',
        width: '2px',
        backgroundColor: '#dee2e6',
    },
    entry: {
        position: 'relative',
        marginBottom: '20px',
        paddingBottom: '10px',
    },
    dot: {
        position: 'absolute',
        left: '-25px',
        top: '4px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        border: '2px solid #fff',
        boxShadow: '0 0 0 2px #dee2e6',
    },
    meta: {
        fontSize: '0.8rem',
        color: '#6c757d',
        marginTop: '4px',
    },
};

const ReturnTimeline = ({ timeline = [] }) => {
    if (!timeline || timeline.length === 0) {
        return <p className="text-muted">No timeline entries yet.</p>;
    }

    return (
        <div style={timelineStyles.container}>
            <div style={timelineStyles.line} />
            {timeline.map((entry, index) => (
                <div key={index} style={timelineStyles.entry}>
                    <div style={timelineStyles.dot} />
                    <div>
                        <Badge variant="dark" style={{ marginRight: '8px' }}>
                            {entry.action ? entry.action.replace(/_/g, ' ') : 'NOTE'}
                        </Badge>
                        {entry.note && <span>{entry.note}</span>}
                    </div>
                    <div style={timelineStyles.meta}>
                        {entry.performedByName && <span>By {entry.performedByName} &middot; </span>}
                        {entry.fromStatus && entry.toStatus && (
                            <span>{entry.fromStatus} → {entry.toStatus} &middot; </span>
                        )}
                        {entry.createdAt && (
                            <span>{new Date(entry.createdAt).toLocaleString()}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReturnTimeline;

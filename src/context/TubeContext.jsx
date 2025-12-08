import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchLineSequence, fetchTubeLines } from '../services/tflApi';

const TubeContext = createContext();

export const useTubeData = () => useContext(TubeContext);

export const TubeProvider = ({ children }) => {
    const [lines, setLines] = useState([]);
    const [stations, setStations] = useState([]);
    const [lineSequences, setLineSequences] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Fetch basic line info
                const linesData = await fetchTubeLines();
                const distinctLines = linesData.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
                setLines(distinctLines);

                // Fetch full sequences for priority lines
                const priorityLines = ['victoria', 'jubilee', 'central', 'bakerloo', 'northern'];
                const seqMap = {};
                const allStations = new Map();

                await Promise.all(priorityLines.map(async (lineId) => {
                    const seq = await fetchLineSequence(lineId);
                    if (seq) {
                        seqMap[lineId] = seq;
                        if (seq.stations) {
                            seq.stations.forEach(s => {
                                allStations.set(s.id, {
                                    ...s,
                                    lineIds: [...(allStations.get(s.id)?.lineIds || []), lineId]
                                });
                            });
                        }
                    }
                }));

                setLineSequences(seqMap);
                setStations(Array.from(allStations.values()));
            } catch (e) {
                console.error("Failed to load tube data", e);
            }
            setLoading(false);
        };

        loadInitialData();
    }, []);

    return (
        <TubeContext.Provider value={{ lines, stations, lineSequences, loading }}>
            {children}
        </TubeContext.Provider>
    );
};

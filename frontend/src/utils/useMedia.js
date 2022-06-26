import { useState, useEffect } from 'react';
import { map, findIndex, forEach } from 'lodash';

const useMediaQuery = (queries, values) => {
    const mediaQueryLists = map(queries, query => window.matchMedia(query));

    const getValue = () => {
        // Get index of first media query that matches
        const index = findIndex(mediaQueryLists, 'matches');
        // Return related value or defaultValue if none
        return typeof values[index] !== 'undefined' ? values[index] : null;
    };

    const [matches, setMatches] = useState(getValue);
    useEffect(() => {
        const listener = () => setMatches(getValue);
        forEach(mediaQueryLists, mql => {
            if (mql.addEventListener) {
                mql.addEventListener('change', listener);
            }
        });
        return () =>
            forEach(mediaQueryLists, mql => {
                if (mql.removeEventListener) {
                    mql.removeEventListener('change', listener);
                }
            });
    }, []);
    return matches;
};

export default useMediaQuery;

import axios from 'axios';

const BASE_URL = 'https://api.tfl.gov.uk';

// Optional: Add app_id and app_key if user provides them, otherwise rely on anonymous quota
const API_CONFIG = {
    params: {
        // app_id: 'YOUR_APP_ID',
        // app_key: 'YOUR_APP_KEY'
    }
};

export const fetchTubeLines = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/Line/Mode/tube/Route`, API_CONFIG);
        return response.data;
    } catch (error) {
        console.error("Error fetching tube lines:", error);
        return [];
    }
};

export const fetchLineSequence = async (lineId) => {
    try {
        const response = await axios.get(`${BASE_URL}/Line/${lineId}/Route/Sequence/all`, API_CONFIG);
        return response.data;
    } catch (error) {
        console.error(`Error fetching sequence for ${lineId}:`, error);
        return null;
    }
};

export const fetchArrivals = async (lineId) => {
    try {
        const response = await axios.get(`${BASE_URL}/Line/${lineId}/Arrivals`, API_CONFIG);
        return response.data;
    } catch (error) {
        console.error(`Error fetching arrivals for ${lineId}:`, error);
        return [];
    }
};

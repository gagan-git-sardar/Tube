export const stationUsage = {
    "Waterloo": 297151,
    "King's Cross St. Pancras": 296014,
    "Oxford Circus": 257759,
    "Victoria": 243801,
    "Bank & Monument": 224256,
    "Liverpool Street": 224125,
    "London Bridge": 220654,
    "Paddington": 155079,
    "Euston": 129541,
    "Green Park": 126711,
    "Tottenham Court Road": 126015,
    "Bond Street": 121358,
    "Piccadilly Circus": 116225,
    "Holborn": 107905,
    "Moorgate": 101442,
    "South Kensington": 100135,
    "Vauxhall": 97486,
    "Leicester Square": 97289,
    "Baker Street": 92029,
    "Old Street": 84073,
    "Westminster": 77242,
    "Farringdon": 73938,
    "Elephant & Castle": 70244,
    "Warren Street": 69734,
    "Embankment": 68555,
    "Chancery Lane": 63863,
    "Tower Hill": 63256,
    "Angel": 60512,
    "Earl's Court": 60421,
    "Charing Cross": 60211,
    "St. Paul's": 58431,
    "Southwark": 56987,
    "Sloane Square": 54951,
    "Blackfriars": 51437,
    "St. James's Park": 50532,
    "Euston Square": 49219,
    "Knightsbridge": 48836,
    "Covent Garden": 47254,
    "Notting Hill Gate": 47188,
    "Aldgate East": 43398,
    "Marylebone": 42640,
    "Gloucester Road": 42283,
    "Marble Arch": 42263,
    "Barbican": 41192,
    "High Street Kensington": 40133,
    "Russell Square": 35616,
    "Pimlico": 35262,
    "Cannon Street": 34097,
    "Temple": 31624,
    "Aldgate": 31103,
    "Great Portland Street": 28504,
    "Goodge Street": 25611,
    "Queensway": 24126,
    "Edgware Road (Cir)": 23366,
    "Mansion House": 23314,
    "Borough": 18843,
    "Lancaster Gate": 18688,
    "Hyde Park Corner": 15807,
    "Edgware Road (Bak)": 14830,
    "Bayswater": 13255,
    "Regent's Park": 11877,
    "Lambeth North": 10330,
    "Stratford": 180027,
    "Canary Wharf": 173466,
    "Finsbury Park": 97391,
    "Brixton": 99850
};

// Normalize names for better matching (simple lower casing and removal of punctuation)
export const getStationUsage = (name) => {
    if (!name) return 0;

    // Direct match
    if (stationUsage[name]) return stationUsage[name];

    // Fuzzy match try
    const cleanName = name.replace(/Station/i, '').trim();
    if (stationUsage[cleanName]) return stationUsage[cleanName];

    // Try finding keys that contain the name
    const key = Object.keys(stationUsage).find(k => k.includes(cleanName) || cleanName.includes(k));
    return key ? stationUsage[key] : 10000; // Default low usage if not found
};

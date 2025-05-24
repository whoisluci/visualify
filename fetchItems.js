export async function fetchItems (timeRange = 'short_term', type = 'artists') {
    const url = `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=50&offset=0`;
    const token = localStorage.getItem('accessToken');
    let topItems;

    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const rqst = await fetch(url, options);
        const response = await rqst.json();
        topItems = response.items;
    } catch(err) {
        console.error('Error:', err);
        return;
    }

    return topItems;
}
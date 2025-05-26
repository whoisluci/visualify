export async function fetchItems (timeRange = 'short_term', type = 'artists') {
    const url = `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=50&offset=0`;
    const token = localStorage.getItem('accessToken');
    let topItems;

    console.log(timeRange)

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

export async function getLatestItems (days) {

    function fetchLatestItems(secondsAgo){
        const token = localStorage.getItem('accessToken');

        return fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${secondsAgo}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(res => res.json());
    }

    const promises = [];
    for(let i = 1; i <= days; i++){
        const now = Date.now();
        const secondsAgo = now - (i * 24 * 60 * 60 * 1000);
        promises.push(fetchLatestItems(secondsAgo));
    }

    let latestItems;

    try {
        const responses = await Promise.all(promises);
        latestItems = responses.map(response => response.items);
    } catch(err) {
        console.error('Error:', err);
        return;
    }

    return latestItems;
}

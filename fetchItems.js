export async function fetchItems (timeRange = 'short_term', type = 'artists') {
    const url = `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=50&offset=0`;
    const token = localStorage.getItem('accessToken');
    let topItems;

    console.log(token)

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

export async function getMBID(track, artist){
    const query = `recording:"${track}" AND artist:"${artist}"`;
    const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=1`; //makes it into url type language
    let data = null;

    try{
        const response = await fetch(url)
        data = await response.json();
    } catch(error){
        console.error(error)
        return;
    }

    return data;
}

export async function getSongDataFromMBID(mbid){
    fetch(`https://acousticbrainz.org/api/v1/${mbid}/low-level`)

        let data = null;

    try{
        const response = await fetch(url)
        data = await response.json();
    } catch(error){
        console.error(error)
        return;
    }

    return data;
}

import { STATE } from '../index.js';
import { renderHeadline } from '../headline.js';
import { renderTimeRangeBttn } from '../timeRangeBttn.js';

export async function renderWorldMap (parentID, timeRange = 'shortTerm') {
    document.querySelector(parentID).innerHTML = ``;
    const header = document.querySelector('header');
    header.innerHTML = ``;

    const headline = renderHeadline('header', 'MUSIC MAP');
    const timeRngSel = renderTimeRangeBttn('header');

    const hSvg = 1000, wSvg = 1200, margin = 1, hViz = 900, wViz = 900, padding = 50;
    const svg = d3.select('main')
        .append('svg')
        .attr('height', hSvg)
        .attr('width', wSvg);

    const path = d3.geoPath();
    const projection = d3.geoMercator()
        .scale(180)
        .center([0, 20])
        .translate([wSvg/2, hSvg/2]);

    Promise.all([d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')])
        .then((loadData) => {
            const topo = loadData[0];
            
            svg.append('g')
                .selectAll('path')
                .data(topo.features)
                .enter()
                .append('path')
                .attr('d', d3.geoPath().projection(projection))
                .attr('id', d => {
                    if (d.properties.name.includes(' ')) {
                        const name = d.properties.name;
                        return name.replaceAll(' ', '_');
                    } 
                   return d.properties.name;
                })
                .style('fill', '#383141')
                .style('stroke', 'var(--black)')
                .each(d => {
                    const name = d.properties.name;
                    // d.properties.count = countryCount.get(id) || 0;
                })
                .on('click', (event, d) => {
                    const classDone = event.target.classList.value;
                    if (classDone === 'done') {
                        d3.select('main').selectAll('.show').classed('show', false);
                        console.log(d);
                        
                        if (d.properties.name === 'United Kingdom') {
                            d.properties.name = 'England';
                        } else if (d.properties.name.includes(' ')) {
                            d.properties.name = d.properties.name.replaceAll(' ', '_');
                        }
                        d3.select("#" + d.properties.name + ".countryInfo").classed('show', true);
                    }
                })
    });
            
    const countryCount = await fetchData(svg, timeRange);
    renderCountryData(parentID, countryCount, timeRange);

    timeRngSel.addEventListener('change', (event) => {
        console.log(svg.selectAll('path'));
        
        svg.selectAll('path')
            .transition()
            .duration(200)
            .style('fill', '#383141');

        const timeRange = event.target.value;
        if (timeRange === 'short_range') {
            fetchData(svg, 'shortTerm');
        } else if (timeRange === 'medium_range') {
            fetchData(svg, 'mediumTerm');
        } else {
            fetchData(svg, 'longTerm');
        }
    });
}

async function fetchData (svg, timeRange) {
    const countryCount = [];
    for (let artist of STATE.userData.artists[`${timeRange}`]) {
        const data = await getArtistCountry(artist.id, artist.name);
        if (data === undefined || data === null) continue;

        if (data.source === 'wikidata') {
            const bindings = data.result.results.bindings;

            if (bindings.length > 0) {
                if (bindings[0].countryLabel) {
                    const exists = countryCount.find(c => c.country === bindings[0].countryLabel.value);
                    
                    if (!exists) {
                        const countryObj = {
                            country: bindings[0].countryLabel.value,
                            artists: [bindings[0].artistLabel.value],
                            count: 1
                        };
                        countryCount.push(countryObj);
                    } else {
                        exists.artists.push(bindings[0].artistLabel.value);
                        exists.count += 1;
                    }
                    updateCountryColor(countryCount, svg, bindings[0].countryLabel.value);
                }
            }
        } else {
            if (data.result.area) {
                const exists = countryCount.find(c => c.country === data.result.area.name);
                if (!exists) {
                    const countryObj = {
                        country: data.result.area.name,
                        artists: [data.result.name],
                        count: 1
                    };
                    countryCount.push(countryObj);
                } else {
                    exists.artists.push(data.result.name);
                    exists.count += 1;
                }   
                updateCountryColor(countryCount, svg, data.result.area.name);
            }
        }
    }

    return countryCount;
}

async function getArtistCountry (spotifyID, name = null) {
    const wikiDataResult = await fetchWikiData(spotifyID);
    if (wikiDataResult.results.bindings.length > 0) return {source: 'wikidata', result: wikiDataResult};

    const musicBrainzResult = await fetchMusicBrainz(name);
    if (musicBrainzResult) return {source: 'musicbrainz', result: musicBrainzResult};

    return null;
}

async function fetchWikiData(spotifyID) {
    const query = `
        SELECT ?artist ?artistLabel ?countryLabel WHERE {
            ?artist wdt:P1902 "${spotifyID}".
            OPTIONAL { ?artist wdt:P27 ?country. }
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
    `;    
    const encodedQuery = encodeURIComponent(query);
    const url = `https://query.wikidata.org/sparql?query=${encodedQuery}`;

    const options  = {
        headers: {
            'Accept': 'application/sparql-results+json',
            'User-Agent': 'Visualify/1.0 (lucmov99@gmail.com)'
        }
    };

    try {
        const rqst = await fetch(url, options);
        const response = await rqst.json();   
        return response; 
    } catch (err) {
        console.error('Error', err);
        return null;
    }
}

async function fetchMusicBrainz(name) {
    const mbUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:${name}&fmt=json`;
    const options = {
        headers: {'User-Agent': 'Visualify/1.0 (lucmov99@gmail.com)'}
    };

    try {
        const rqst = await fetch(mbUrl, options);
        const response = await rqst.json();
        const artists = response.artists || [];

        if (artists.length === 0) return null;

        const best = artists[0];
        console.log(best);
        return best;
        
    } catch(err) {
        console.error('Error:', err);
    }
}

function updateCountryColor(countryCount, svg, country) {
    const maxCount = d3.max(countryCount, d => d.count || 1);

    const colors = [
        '#E3CCFF',
        '#D2AFFF',
        '#AD74F6',
        '#9745FF'
    ];

    const customInterpolator = t => d3.interpolateRgbBasis(colors)(t);
    const colorScale = d3.scaleSequential()
        .domain([1, maxCount])
        .interpolator(customInterpolator)
        .clamp(true);
        
    const count = countryCount.find(c => c.country === country).count;
    if (!count) return;

    if (country === 'United States') {
        country = 'USA'
    } else if (country === 'United Kingdom') {
        country = 'England';
    } else if (country.includes(' ')) {
        country = country.replaceAll(' ', '_');
    }

    svg.select(`#${country}`)
        .classed('done', true)
        .transition()
        .duration(300)
        .style('fill', (d) => {
            return count ? colorScale(count): colorScale(0);
        });
}

function renderCountryData (parentID, countryCount, timeRange) {
    for (let country of countryCount) {
        const div = document.createElement('div');
        document.querySelector(parentID).append(div);

        let newSpelling;
        if (country.country === 'United States') {
            country.country = 'USA';
        } else if (country.country === 'United Kingdom') {
            country.country = 'England';
        } else if (country.country.includes(' ')) {
            newSpelling = country.country.replaceAll(' ', '_');
        }

        div.id = (newSpelling === null || newSpelling === undefined) ? country.country : newSpelling;
        div.classList.add('countryInfo');

        const countryName = document.createElement('h3');
        if (newSpelling !== null) {
            countryName.textContent = newSpelling;
        }
        countryName.textContent = country.country;
        div.append(countryName);
        countryName.id = 'countryName';

        const artistImg = document.createElement('img');
        const artist = STATE.userData.artists[`${timeRange}`].find(a => a.name === country.artists[0]);
        artistImg.src = artist.images[0].url;
        div.append(artistImg);
        artistImg.id = 'artistImg';

        const textDiv = document.createElement('div');
        div.append(textDiv);
        textDiv.id = 'textDiv';

        const catText = document.createElement('h4');
        catText.textContent = 'Top artist';
        textDiv.append(catText);
        catText.id = 'catText';

        const artistName = document.createElement('h3');
        artistName.textContent = country.artists[0];
        artistName.id = 'artistName';
        textDiv.append(artistName); 
    }
}
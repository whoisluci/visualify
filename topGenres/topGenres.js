import { STATE } from "/index.js"; 

export function renderTopGenres (parentID) {
    document.querySelector(parentID).innerHTML = ``;

    const allGenres = [];
    STATE.userData['artists'].map( artist => {
        if (artist.genres.length !== null) {
            for (let genre of artist.genres) {
                allGenres.push(genre);
            }
        }
    });

    const topGenres = [];
    for (let genre of allGenres) {
        const exists = topGenres.find(g => g.genre === genre);

        if (!exists) {
            topGenres.push({
                genre: genre,
                count: 1
            })
        } else {
            exists.count += 1;
        }
    }

    const hSvg = 1000, wSvg = 1000, margin = 1, hViz = 900, wViz = 900, padding = 50;
    const colors = d3.scaleOrdinal(d3.schemePaired);
    // const colorScale = d3.scaleOrdinal()
    // .domain(sortedData.map(d => d.Country))
    // .range(d3.schemeCategory10);

    console.log(topGenres);
    
    const pack = d3.pack()
                    .size([wViz - padding, hViz - padding])
                    .padding(5);

    const hierarchy = d3.hierarchy({children: topGenres})
        .sum(g => g.count);

    const root = pack(hierarchy);
    
    const svg = d3.select('main').append('svg')
        .attr('width', wSvg)
        .attr('height', hSvg);

    const bubbles = svg.selectAll('.bubble')
        .data(root.descendants().slice(1))
        .enter()
        .append('g')
        .attr('class', 'bubble')
        .attr('transform', d => `translate(${d.x + padding}, ${d.y + padding})`);

    bubbles.append('circle')
        .attr('r', d => d.r)
        .attr('fill', '#fff'); /* byt ut mot rätt fräg */
    
    /* lägg till text i bubblorna */
}
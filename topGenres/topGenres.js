import { STATE } from "/index.js"; 
import { renderHeadline } from "../headline.js";
import { renderTimeRangeBttn } from "../timeRangeBttn.js";
import { renderWorldMap } from "../worldMap/worldMap.js";

export function renderTopGenres (parentID) {
    document.querySelector('header').innerHTML = ``;
    document.querySelector(parentID).innerHTML = ``;

    const headline = renderHeadline('#header', 'TOP GENRES');
    const timeRngSel = renderTimeRangeBttn('#header');

    const allGenres = [];
    STATE.userData['artists'].shortTerm.map((artist) => {
        if (artist.genres.length !== null) {
            for (let genre of artist.genres) {
                allGenres.push(genre);
            }
        }
    });

    const topGenresS = [];
    for (let genre of allGenres) {
        const exists = topGenresS.find(g => g.genre === genre || g.genre === `${genre}s`);

        if (!exists) {
            topGenresS.push({
                genre: genre,
                count: 1
            })
        } else {
            exists.count += 1;
        }
    }

    const hSvg = 1000, wSvg = 1000, margin = 1, hViz = 900, wViz = 900, padding = 50;
    const colors = [getComputedStyle(document.documentElement).getPropertyValue('--white').trim(), getComputedStyle(document.documentElement).getPropertyValue('--lilac').trim()];

    console.log(d3.min(topGenresS, d => d.count), d3.max(topGenresS, d => d.count));
    function customInterpolator(t) {
        return d3.interpolateRgb(colors[0], colors[1])(t);
    }
    
    const color = d3.scaleSequential()
        .domain([
            d3.min(topGenresS, d => d.count),
            d3.max(topGenresS, d => d.count)])
        .interpolator(customInterpolator);

    const pack = d3.pack()
                    .size([wViz - padding, hViz - padding])
                    .padding(5);

    const hierarchy = d3.hierarchy({children: topGenresS})
        .sum(g => g.count);

    const root = pack(hierarchy);
    
    const svg = d3.select('main').append('svg')
        .attr('width', wSvg)
        .attr('height', hSvg);

    const g = svg.append('g');

    const bubble = g.selectAll('g')
        .data(root.descendants().slice(1))
        .enter()
        .append('g')
        .attr('class', 'bubble')
        .attr('transform', d => `translate(${d.x + padding}, ${d.y + padding})`);

    bubble.append('circle')
        .attr('r', d => d.r)
        .attr('fill', (d, i, nodes) => {
            const match = topGenresS.find(g => g.genre === d.data.genre);
            const count = match ? match.count : 0;
            return color(count);
        }); /* byt ut mot rätt fräg */
    
    const genreLabel = bubble.append('text')
        .text((d) => d.data.genre)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .style('font-size', d => Math.min(2 * d.r / d.data.genre.length, d.r / 2) + "px");

    const zoom = d3.zoom()
        .scaleExtent([1, 40])
        .filter(event => false)
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    /* Fixa inzoomningen helt */
    bubble.on('click', (event, d) => {
        const scale = 5; 
        const x = d.x;
        const y = d.y;
      
        svg.transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(wSvg / 2, hSvg / 2)  
              .scale(scale)                  
              .translate(-x, -y)                 
          );
    });

    svg.on('click', (event) => {
        if (event.target === svg.node()) {
          svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
        }
    });

    const topGenresM = [];
    const topGenresL = [];

    timeRngSel.addEventListener('change', (event) => {
        const timeRange = event.target.value;

        if (timeRange === 'short_range') {
            changeData(svg, 'shortTerm');
        } else if (timeRange === 'medium_range') {
            changeData(svg, 'mediumTerm');
        } else{
            changeData(svg, 'longTerm');
        }
    });

    const nextBttn = document.createElement('button');
    nextBttn.textContent = 'next graph';
    document.querySelector(parentID).append(nextBttn);
    nextBttn.addEventListener('click', () => {
        renderWorldMap('main');
    });
}

function changeData (svg, timeRange) {
    const allGenres = [];
    STATE.userData['artists'][`${timeRange}`].map((artist) => {
        if (artist.genres.length !== null) {
            for (let genre of artist.genres) {
                allGenres.push(genre);
            }
        }
    });

    const topGenres = [];
    for (let genre of allGenres) {
        const exists = topGenres.find(g => g.genre === genre || g.genre === `${genre}s`);

        if (!exists) {
            topGenres.push({
                genre: genre,
                count: 1
            })
        } else {
            exists.count += 1;
        }
    }

    svg.selectAll('circle')
        .data(topGenres)
        .transition()
        .duration(700);
}
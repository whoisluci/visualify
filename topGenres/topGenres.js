import { STATE } from "../index.js"; 
import { renderHeadline } from "../headline.js";
import { renderTimeRangeBttn } from "../timeRangeBttn.js";

export function renderTopGenres (parentID) {
    const parent = document.querySelector(parentID);

    const section = document.createElement("section");
    section.id = "topGenrePage";
    section.className = "page";
    parent.append(section);

    const header = document.createElement('header');
    section.append(header);

    const main = document.createElement('main');
    section.append(main);

    const headline = renderHeadline('#topGenrePage header', 'TOP GENRES');
    const timeRngSel = renderTimeRangeBttn('#topGenrePage header');

    const parentsize = d3.select("#topGenrePage main").node().getBoundingClientRect();

    const hSvg = parentsize.height * 1.10;
    const wSvg = parentsize.width;
    const padding = 10;
    const hViz = hSvg - padding * 2; 
    const wViz = wSvg - padding * 2;
    const colors = [getComputedStyle(document.documentElement).getPropertyValue('--white').trim(), getComputedStyle(document.documentElement).getPropertyValue('--lilac').trim()];

    const topGenres = formatGenreData(STATE.userData['artists'].shortTerm);

    console.log(topGenres)
    
    const color = d3.scaleSequential()
        .domain([
            d3.min(topGenres, d => d.count),
            d3.max(topGenres, d => d.count)])
        .interpolator(customInterpolator);

    function customInterpolator(t) {
        return d3.interpolateRgb(colors[0], colors[1])(t);
    }

    const pack = d3.pack()
                    .size([wViz, hViz])
                    .padding(5);

    const hierarchy = d3.hierarchy({children: topGenres})
        .sum(g => g.count);

    const root = pack(hierarchy);
    
    const svg = d3.select('#topGenrePage main').append('svg')
        .attr('width', wSvg)
        .attr('height', hSvg);

    const g = svg.append('g').classed("bubbleContainer", true);

    const bubble = g.selectAll('g')
        .data(root.descendants().slice(1))
        .enter()
        .append('g')
        .attr('class', 'bubble')
        .attr('transform', d => `translate(${d.x + padding}, ${d.y + padding})`);

    bubble.append('circle')
        .attr('r', d => d.r)
        .attr('fill', (d, i, nodes) => {
            const match = topGenres.find(g => g.genre === d.data.genre);
            const count = match ? match.count : 0;
            return color(count);
        }); 
    
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

    timeRngSel.addEventListener('change', (event) => {
        const timeRange = event.target.value;
        changeData(svg, timeRange, wViz, hViz, padding, colors)
    });
}


function changeData(svg, timeRange, wViz, hViz, padding, colors) {
    const newDataset = formatGenreData(STATE.userData['artists'][timeRange]);

    const color = d3.scaleSequential()
        .domain([
            d3.min(newDataset, d => d.count),
            d3.max(newDataset, d => d.count)
        ])
        .interpolator(t => d3.interpolateRgb(colors[0], colors[1])(t));

    const pack = d3.pack().size([wViz, hViz]).padding(5);
    const root = pack(d3.hierarchy({children: newDataset}).sum(g => g.count));
    const container = svg.select('.bubbleContainer');

    const nodes = container.selectAll('.bubble')
        .data(root.descendants().slice(1), d => d.data.genre); 

    const bubbleEnter = nodes.enter()
        .append('g')
        .attr('class', 'bubble')
        .attr('transform', d => `translate(${d.x + padding}, ${d.y + padding})`);

    bubbleEnter.append('circle')
        .attr('r', d => d.r)
        .attr('fill', d => {
            const match = newDataset.find(g => g.genre === d.data.genre);
            const count = match ? match.count : 0;
            return color(count);
        });

    bubbleEnter.append('text')
        .text(d => d.data.genre)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .style('font-size', d => Math.min(2 * d.r / d.data.genre.length, d.r / 2) + "px");

    const bubbleUpdate = nodes.transition()
        .duration(750)
        .attr('transform', d => `translate(${d.x + padding}, ${d.y + padding})`);

    bubbleUpdate.select('circle')
        .attr('r', d => d.r)
        .attr('fill', d => {
            const match = newDataset.find(g => g.genre === d.data.genre);
            const count = match ? match.count : 0;
            return color(count);
        });

    bubbleUpdate.select('text')
        .text(d => d.data.genre)
        .style('font-size', d => Math.min(2 * d.r / d.data.genre.length, d.r / 2) + "px");

    nodes.exit().remove();
}


function formatGenreData(dataset){
    const allGenres = [];
    dataset.map((artist) => {
        if (artist.genres.length !== null) {
            for (const genre of artist.genres) {
                allGenres.push(genre);
            }
        }
    });

    const topGenres = [];
    for (const genre of allGenres) {
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

    return topGenres
}
import { STATE } from "../index.js";
import { PubSub } from "../pubSub.js";
import { renderHeadline } from "../headline.js";
import { renderTimeRangeBttn } from "../timeRangeBttn.js";
import { renderTopGenres } from "../topGenres/topGenres.js";
import { fetchItems } from "../fetchItems.js";

/* Spotify def. timeRange = medium_term */
export async function renderTopItems (parentID, limit = 50, offset = 0, type = 'artists') {
    let topItemsS = await fetchItems();
    const parent = document.querySelector(parentID);

    topItemsS.forEach( (item, i) => {
    item.rank = i + 1;
    });

    STATE.userData[`${type}`].shortTerm = topItemsS;

    const section = document.createElement("section");
    section.id = "topItemsPage";
    section.className = "page";
    parent.append(section);

    const header = document.createElement('header');
    section.append(header);

    const text = `Top ${type}`.toUpperCase();
    const headline = renderHeadline('#topItemsPage header', text);

    const bttnsDiv = document.createElement('div');
    bttnsDiv.id = 'bttnsDiv';
    header.append(bttnsDiv);

    const typeSel = document.createElement('select');
    typeSel.id = 'typeSel';
    bttnsDiv.append(typeSel);

    const optArtists = document.createElement('option');
    optArtists.classList.add('opt');
    optArtists.value = 'artists';
    optArtists.text = 'Artists';
    typeSel.append(optArtists);

    const optSongs = document.createElement('option');
    optSongs.classList.add('opt');
    optSongs.value = 'songs';
    optSongs.text = 'Songs';
    typeSel.append(optSongs);

    const timeRngSel = renderTimeRangeBttn('#bttnsDiv');
    
    const main = document.createElement('main');
    section.append(main);

    /* ändra sen */

    const parentsize = d3.select("#topItemsPage main").node().getBoundingClientRect();

    const hSvg = parentsize.height;
    const wSvg = parentsize.height * 2.5;
    const margin = {
        left: 200,
        right: 200,
        top: 50,
        bottom: 50
    }

    const hViz = hSvg - margin.bottom - margin.top;
    const wViz = wSvg - margin.right - margin.left;

    const svg = d3.select('#topItemsPage main').append('svg')
                .attr('height', hSvg)
                .attr('width', wSvg)
                .attr('id', `${type}Graph`);

    const selectedItems = topItemsS.filter(item => item.rank >= 1 && item.rank <= 10);
    /* ändra till dynamiska värden */
    
    const lowestRank = selectedItems.reduce((min, item) => item.rank < min.rank ? item : min).rank;
    const highestRank = selectedItems.reduce((max, item) => item.rank > max.rank ? item : max).rank;

    const xScale = d3.scaleLinear([0, 50], [margin.left, wViz + margin.left]);
    const yScale = d3.scaleLinear([0, 100], [hViz + margin.top, margin.bottom]);
    
    svg.append('g')
        .call(d3.axisBottom(xScale))
        .attr('transform', `translate(0, ${hViz + margin.top})`)
        .style('color', '#fff');

    svg.append('g')
        .call(d3.axisLeft(yScale))
        .attr('transform', `translate(${margin.left}, 0)`)
        .style('color', '#fff');

    svg.append('g')
        .selectAll('dot')
        .data(topItemsS)
        .enter()
        .append('circle')
            .attr('cx', (d, i, nodes) => xScale(d.rank))
            .attr('cy', (d, i, nodes) => yScale(d.popularity))
            .attr('r', 5.5)
            .style('fill', 'var(--lilac)');

    const topItemsM = await fetchItems('medium_term', `${type}`);
    const topItemsL = await fetchItems('long_term', `${type}`);

    topItemsM.forEach( (item, i) => {
        item.rank = i + 1;
    });
    topItemsL.forEach( (item, i) => {
        item.rank = i + 1;
    });


    STATE.userData[`${type}`].mediumTerm = topItemsM;
    STATE.userData[`${type}`].longTerm = topItemsL;

    typeSel.addEventListener('change', (event) => {
        const type = event.target.value;
    });

    timeRngSel.addEventListener('change', (event) => {
        const timeRange = event.target.value;
        if (timeRange === 'shortTerm') {
            changeData(svg, topItemsS, xScale, yScale);
        } else if (timeRange === 'mediumTerm') {
            changeData(svg, topItemsM, xScale, yScale);
        } else{
            changeData(svg, topItemsL, xScale, yScale);
        }
    });
}

function changeData (svg, dataset, xScale, yScale) {
    svg.selectAll('circle')
        .data(dataset)
        .transition()
        .duration(700)
        .attr('cx', (d, i, nodes) => xScale(d.rank))
        .attr('cy', (d, i, nodes) => yScale(d.popularity));
}
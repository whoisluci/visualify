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

    const tooltip = d3.select('body')
        .append('div')
        .style('opacity', 0)
        .attr('class', 'tooltip')
        .style('background-color', 'var(--white)')
        .style('border-width', '1px')
        .style('border-radius', '3px')
        .style('padding', '10px');

    svg.append('g')
        .selectAll('dot')
        .data(topItemsS)
        .enter()
        .append('circle')
            .attr('cx', (d, i, nodes) => xScale(d.rank))
            .attr('cy', (d, i, nodes) => yScale(d.popularity))
            .attr('r', 8)
            .style('fill', 'var(--lilac)')
            .on('mouseover', (event, d, i, nodes) => {
                d3.select('.tooltip')
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                if (!d.album) {
                    tooltip.html(`
                        <h3>${d.name}</h3>
                        <h4>Your ranking: <span class='int'>${d.rank}</span></h4>
                        <h4>Spotify popularity: <span class='int'>${d.popularity}</span></h4>
                        <img id='artistImg' class='tooltipImg'src='${d.images[0].url}'>`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
                } else {
                    tooltip.html(`
                        <h3>${d.name}</h3>
                        <h4>Your ranking: <span class='int'>${d.rank}</span></h4>
                        <h4>Spotify popularity: <span class='int'>${d.popularity}</span></h4>
                        <img id='artistImg' class='tooltipImg'src='${d.album.images[0].url}'>`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
                }
            })
            .on('mouseout', (d, i, nodes) => {
                tooltip.transition()
                .duration(200)
                .style("opacity", 0);
            });

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
        if (type === 'artists') {
            changeDataType(timeRange, 'artists', xScale, yScale);
        } else {
            changeDataType(timeRange, 'tracks', xScale, yScale);
        }
    });

    timeRngSel.addEventListener('change', (event) => {
        const timeRange = event.target.value;
        const typeVal = document.querySelector('#timeRngSel').value;
        
        if (typeVal === 'tracks') {
            const topItemsS = STATE.userData.tracks.shortTerm;
            const topItemsM = STATE.userData.tracks.mediumTerm;
            const topItemsL = STATE.userData.tracks.longTerm;

            if (timeRange === 'short_range') {
                changeData(svg, topItemsS, xScale, yScale);
            } else if (timeRange === 'medium_range') {
                changeData(svg, topItemsM, xScale, yScale);
            } else {
                changeData(svg, topItemsL, xScale, yScale);
            }
        } else {
            if (timeRange === 'short_range') {
                changeData(svg, topItemsS, xScale, yScale);
                console.log(topItemsS); 
            } else if (timeRange === 'medium_range') {
                changeData(svg, topItemsM, xScale, yScale);
            } else {
                changeData(svg, topItemsL, xScale, yScale);
            }
        }
    });
}

async function changeDataType (timeRange, type, xScale, yScale) {
    const topItemsS = await fetchItems(timeRange, type);
    const topItemsM = await fetchItems('medium_term', type);
    const topItemsL = await fetchItems('long_term', type);

    STATE.userData.tracks.shortTerm = topItemsS;
    STATE.userData.tracks.mediumTerm = topItemsM;
    STATE.userData.tracks.longTerm = topItemsL;

    topItemsS.forEach( (item, i) => {
        item.rank = i + 1;
    });
    topItemsM.forEach( (item, i) => {
        item.rank = i + 1;
    });
    topItemsL.forEach( (item, i) => {
        item.rank = i + 1;
    });

    const svg = d3.select('svg');
    changeData(svg, topItemsS, xScale, yScale);
}

function changeData (svg, dataset, xScale, yScale) {
    svg.selectAll('circle')
        .data(dataset)
        .transition()
        .duration(700)
        .attr('cx', (d, i, nodes) => xScale(d.rank))
        .attr('cy', (d, i, nodes) => yScale(d.popularity));
}
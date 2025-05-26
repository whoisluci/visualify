import { getLatestItems } from "../../fetchItems.js";
import { renderHeadline } from "../../headline.js";

export async function renderLatestSongsPage(parentSelector){
    const parent = document.querySelector(parentSelector);

    const section = document.createElement("section");
    section.id = "latestSongsPage";
    section.className = "page";
    parent.appendChild(section);

    section.innerHTML = `<header>
                            <div class="titleContainer"></div>
                            <select>
                                <option value="1">Last 24 hours</option>
                                <option value="2">last 48 hours</option>
                                <option value="7">last week</option>
                            </select>
                        </header>
                        <main></main>`;

    const dataset = await getLatestItems(7);
    const radarChart = new RadarChart("#latestSongsPage main", formatLatestItems([dataset[0]]));
    renderHeadline("#latestSongsPage .titleContainer", "Headline headline");

    section.querySelector("#latestSongsPage select").addEventListener("change", (event) => {
        const result = dataset.slice(0, (Number(event.target.value)));
        radarChart.changeData(formatLatestItems(result));
    });   
}

function formatLatestItems(totalDataset){
    let dataset = [];    

    totalDataset.forEach(item => {
        dataset = dataset.concat(item);
    });

    const titles = ["Playlist Listening", "Artist Page Listening", "Distinct albums" /* "Album Listening" */, "Artist repeat rate", "Song repeat rate"];
    const types = ["playlist", "artist"/*, "album" */];
    const formatted = [];
    const correctData = dataset.filter(item => item.context !== null);


    types.forEach((type, i) => {
        const filteredData = dataset.filter(item => item.context?.type === type);

        formatted.push({
            "title": titles[i],
            "value": filteredData.length / correctData.length
        });
    });

    const uniqueArtists = [];
    const uniqueSongs = [];
    const albumNames = [];

    dataset.forEach((item, i) => {
        const artistName = item.track.artists[0].name;
        const songName = item.track.name;
        const albumName = item.track.album.name;

        if(!uniqueArtists.includes(artistName)){
            uniqueArtists.push(artistName);
        }

        if(!albumNames.includes(albumName)){
            albumNames.push(albumName);
        }

        if(!uniqueSongs.includes(songName)){
            uniqueSongs.push(songName);
        }
    });

    formatted.push({
        "title": titles[2],
        "value": uniqueArtists.length / dataset.length
    });

    formatted.push({
        "title": titles[3],
        "value": (dataset.length - uniqueArtists.length) / dataset.length
    });

    formatted.push({
        "title": titles[4],
        "value": (dataset.length - uniqueSongs.length) / dataset.length
    });
    

    return formatted;
}


class RadarChart{
    constructor(parentSelector, dataset){
        this.parent = d3.select(parentSelector);
        this.dataset = dataset;
        const boundingRect = this.parent.node().getBoundingClientRect();


        this.margin = {
            top: 50,
            right: 100,
            bottom: 50,
            left: 100
        }
        this.colors = {
            lilacOpacity: "#D2AFFF",
            lilac: "#D2AFFF"
        }

        this.wSvg =  750/* boundingRect.width * 0.5 */;   
        this.hSvg = boundingRect.height; 
        this.hViz = this.hSvg - this.margin.bottom - this.margin.top;
        this.wViz = this.wSvg - this.margin.left - this.margin.right;
        this.radius = d3.min([this.hViz, this.wViz]) / 2; 

        this.gridLevels = [0.4, 1];
        this.pieAngle = (2 * Math.PI) / dataset.length;

        this.init();
    }

    init(){
        this.svg = this.parent.append("svg")
            .attr("width", this.wSvg)
            .attr("height", this.hSvg)
            .classed("radarChart", true);

        this.graphGroup = this.svg.append("g")
            .classed("graphGroup", true)
            .attr("transform", `translate(${this.wSvg / 2},  ${this.hSvg/2})`)

        this.renderGrid();
        this.renderLabels();
        this.renderPolygon();
        this.renderPolygonDots();
    }

    renderGrid(){
        const circles = this.graphGroup.append("g").classed("circleGridGroup", true)
            .selectAll("circle")
            .data(this.gridLevels)
            .enter()
            .append("circle")
                .classed("gridCircle", true)
                .attr("r", (d, i, nodes) => d * this.radius)

        
        const lines = this.graphGroup.append("g").classed("lineGroup", true)
            .selectAll("line")
            .data(this.dataset)
            .enter()
            .append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (d, i, nodes) => {
                    const angle = i * this.pieAngle;
                    return this.radius * Math.sin(angle);
                })
                .attr("y2", (d, i, nodes) => {
                    const angle = i * this.pieAngle;
                    return -this.radius * Math.cos(angle);
                })
                .attr("stroke", "#ccc");
    }

    renderLabels(){
        this.graphGroup.append("g").classed("labelGroup", true)
            .selectAll("text")
            .data(this.dataset)
            .enter()
            .append("text")
                .classed("radarChartLabel", true)
                .text((d, i, nodes) => d.title)
                .attr("x", (d, i, nodes) => this.getLabelX(i, nodes))
                .attr("y", (d, i, nodes) => this.getLabelY(i, nodes));
    }

    renderPolygon(){
        const radarLine = d3.lineRadial()
            .radius((d, i) => d.value * this.radius)
            .angle((d, i) => i * this.pieAngle)
            .curve(d3.curveLinearClosed);

        this.polygon = this.graphGroup.append("g").classed("polygonGroup", true)
            .selectAll("path")
            .data([this.dataset])
            .enter()
            .append("path")
                .attr("class", "radarArea")
                .attr("d", radarLine);
    }

    renderPolygonDots(){
        this.polygonDots = this.graphGroup.append("g").classed("dotsGroup", true)
            .selectAll("circle")
            .data(this.dataset)
            .enter()
            .append("circle")
                .classed("radarCircles", true)
                .attr("cx", (d, i) => this.getDotX(d, i))
                .attr("cy", (d, i) => this.getDotY(d, i))
                .attr("r", 5);
    }

    getDotY(d, i){
        const r = d.value * this.radius;
        const angle = i * this.pieAngle;
        return -r * Math.cos(angle);
    }

    getDotX(d, i){
        const r = d.value * this.radius;
        const angle = i * this.pieAngle;
        return r * Math.sin(angle);
    }

    getLabelY(index, nodes){
        let addHeight = 0;
        const labelHeight = nodes[index].getBBox().height;

        switch(index){
            case 1: 
                addHeight = labelHeight / 3;
                break;
            case 2:
                addHeight = labelHeight * 0.6;
                break;
            case 3:
                addHeight = labelHeight * 0.6;
                break;
            case 4:
                addHeight = labelHeight / 3;
                break;
            default:
                addHeight = 0;  
                break;                 
        }

        const angle = index * this.pieAngle;
        return -this.radius * Math.cos(angle) * 1.05 + addHeight;
    }

    getLabelX(index, nodes){
        let addWidth = 0;
        const labelWidth = nodes[index].getBBox().width;

        switch(index){
            case 0:
                addWidth = -labelWidth / 2;
                break;
            case 1:
                addWidth = labelWidth / 11;
                break;
            case 3:
                addWidth = -labelWidth;
                break;
            case 4:
                addWidth = -labelWidth;
                break;
            default:
                addWidth = 0;   
                break;                
        }

        const angle = index * this.pieAngle;
        return this.radius * Math.sin(angle) * 1.05 + addWidth;
    }

    changeData(dataset){
        this.dataset = dataset
        this.polygonDots
            .data(this.dataset)
            .transition()
            .duration(700)
            .attr("cx", (d, i) => this.getDotX(d, i))
            .attr("cy", (d, i) => this.getDotY(d, i))

        const radarLine = d3.lineRadial()
            .radius((d, i) => d.value * this.radius)
            .angle((d, i) => i * this.pieAngle)
            .curve(d3.curveLinearClosed);

        this.polygon
            .data([this.dataset])
            .transition()
            .duration(700)
            .attr("d", radarLine)
    }
}
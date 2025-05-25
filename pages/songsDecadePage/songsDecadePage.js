export function renderSongsDecadePage(parentSelector, dataset){
    const parent = document.querySelector(parentSelector);
    parent.innerHTML += `<section id="circularBarPage" class="page">
                            <header>
                                <select>
                                    <option value="shortTerm">Last 4 weeks</option>
                                    <option value="mediumTerm">Last 6 Months</option>
                                    <option value="longTerm">Last 12 Months</option>
                                </select>
                            </header>
                            <main>
                                <div id="songContainer"></div>
                            </main>
                        </section>`;

    const circularChart = new CircularBarChart("#circularBarPage main", dataset["shortTerm"]);
    renderArtistDivs("#circularBarPage #songContainer", dataset["shortTerm"]);

    parent.querySelector("#circularBarPage select").addEventListener("change", (event) => {
        circularChart.changeData(dataset[event.target.value]);
        renderArtistDivs("#circularBarPage #songContainer", dataset[event.target.value]);
    });    
}

function renderArtistDivs(parentSelector, songs){
    const parent = document.querySelector(parentSelector);
    parent.innerHTML = ``;

    for(const song of songs){
        if(song.image){
            parent.innerHTML += `<div class="song" id="song${song.decade}">
                                    <h3 class="decadeTitle">${song.decade}'s</h3>
                                    <img src=${song.image}>
                                    <div class="artistInfo">
                                        <h4>Top Artist</h4>
                                        <h3>${song.topArtist}</h3>
                                    </div>
                                <div>`;
        }
    }
}

class CircularBarChart{
    constructor(parentSelector, dataset){
        this.parent = d3.select(parentSelector);
        this.dataset = dataset;
        const boundingRect = this.parent.node().getBoundingClientRect();

        this.margin = {
            top: 40,
            right: 10,
            bottom: 40,     
            left: 10
        }
        this.colors = {
            toLilac: "#F0E5FD",
            fromLilac: "var(--lilac)",
            toDarkerLilac: "#9745FF"
        }

        this.wSvg = boundingRect.height;
        this.hSvg = boundingRect.height; 
        this.hViz = this.hSvg - this.margin.bottom - this.margin.top;
        this.wViz = this.wSvg - this.margin.left - this.margin.right;

        this.rotation = ((1/dataset.length) * 360)/2;
        this.innerRadius = 80;
        this.outerRadius = d3.min([this.hViz, this.wViz]) / 2;

        this.init();
    }

    init(){
        this.svg = this.parent.append("svg")
            .attr("width", this.wSvg)
            .attr("height", this.hSvg)
            .classed("circularBarChart", true)

        this.graphGroup = this.svg.append("g")
            .classed("graphGroup", true)
            .attr("transform", `translate(${this.wSvg / 2},  ${this.hSvg/2}) rotate(${this.rotation})`);
        
        this.renderDefs();
        this.prepScales();
        this.renderBackroundArcs();
        this.renderLabels();
        this.renderDataArcs();
        this.bindListeners();
    }

    renderDefs(){
        const defs = this.svg.append("defs")

        const lightPurpleGrad = defs.append("linearGradient")
            .attr("id", "lightPurpleGrad")
        lightPurpleGrad.append("stop").attr("stop-color", this.colors.fromLilac).attr("offset", "0%")
        lightPurpleGrad.append("stop").attr("stop-color", this.colors.toLilac).attr("offset", "100%");

        const darkPurpleGrad = defs.append("linearGradient")
            .attr("id", "darkPurpleGrad")
        darkPurpleGrad.append("stop").attr("stop-color", this.colors.fromLilac).attr("offset", "0%");
        darkPurpleGrad.append("stop").attr("stop-color", this.colors.toDarkerLilac).attr("offset", "100%");
    }

    prepScales(){
        const decades = this.dataset.map(obj => obj.decade);
        const amounts = this.dataset.map(obj => obj.amount);
        this.maxamount = d3.max(amounts);

        this.xScale = d3.scaleBand()
            .domain(decades)
            .range([0, 2 * Math.PI]);
        
        this.yScale = d3.scaleRadial()
            .domain([0, this.maxamount])
            .range([this.innerRadius, this.outerRadius])
    }

    renderBackroundArcs(){
        this.graphGroup.append("g").classed("backroundArcGroup", true)
            .selectAll("path")
            .data(this.dataset)
            .enter()
            .append("path")
                .style("fill", (d, i, nodes) => {
                    if(i === nodes.length - 1){
                        nodes[i].classList.add("none");
                        return "transparent";
                    }
                    else{
                        nodes[i].classList.add("pieBackground");
                        return "var(--darkestGrey)";
                    }
                })
                .attr("d", d3.arc()
                    .innerRadius(this.innerRadius)
                    .outerRadius((d, i, nodes) => this.yScale(this.maxamount))
                    .startAngle((d, i, nodes) => this.xScale(d.decade))
                    .endAngle((d, i, nodes) => this.xScale(d.decade) + this.xScale.bandwidth())
                    .padAngle(0.10)
                    .padRadius(this.innerRadius)
                )
    }

    renderLabels(){
        this.graphGroup.append("g").classed("labelGroup", true)
            .selectAll("g")
            .data(this.dataset)
            .enter().append("g")
                .attr("text-anchor", "middle")
                .attr("transform", (d, i, nodes) => 
                    `rotate(${(this.xScale(d.decade) + this.xScale.bandwidth() / 2) * 180 / Math.PI - 90})` +
                    `translate(${this.innerRadius}, 0)`
                )
                .append("text")
                    .classed("decadeText", true)
                    .attr("id", (d, i, nodes) => "pieText-" + (i + 1))
                    .attr("transform", (d, i, nodes) =>
                        (this.xScale(d.decade) + this.xScale.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI
                            ? "rotate(90)translate(0,16)"
                            : "rotate(-90)translate(0,-9)"
                    )
                    .text((d, i, nodes) => {
                        if(d.decade)return String(d.decade).slice(2, 5) + "s"
                    });
    }

    renderDataArcs(){
        this.arcs = this.graphGroup.append("g").classed("arcGroup", true)
            .selectAll("path")
            .data(this.dataset)
            .enter()
            .append("path")
                .classed("pie", true)
                .attr("id", (d, i, nodes) => "pie-" + (i + 1))
                .attr("d", d3.arc()
                    .innerRadius(this.innerRadius)
                    .outerRadius((d, i, nodes) => this.yScale(d.amount))
                    .startAngle((d, i, nodes) => this.xScale(d.decade))
                    .endAngle((d, i, nodes) => this.xScale(d.decade) + this.xScale.bandwidth())
                    .padAngle(0.10)
                    .padRadius(this.innerRadius)
                )
    }

    bindListeners(){
        this.graphGroup.selectAll(".pie").each(function(d, i){
            d3.select(this)
                .on("mouseenter", () => {
                    this.classList.add("pieHover");
                    d3.select(`#song${d.decade}`).classed("show", true)
                    d3.select("#pieText-" + (i + 1)).classed("pieTextHover", true)
                })
                .on("mouseleave", () => {
                    this.classList.remove("pieHover");
                    d3.select(`#song${d.decade}`).classed("show", false)
                    d3.select("#pieText-" + (i + 1)).classed("pieTextHover", false)
                });
        })

        this.graphGroup.selectAll(".pieBackground").each(function(d, i){
            d3.select(this)
                .on("mouseenter", () => {
                    d3.select(`#song${d.decade}`).classed("show", true)
                    d3.select("#pie-" + (i + 1)).classed("pieHover", true)
                    d3.select("#pieText-" + (i + 1)).classed("pieTextHover", true)
                })
                .on("mouseleave", () => {
                    d3.select(`#song${d.decade}`).classed("show", false)
                    d3.select("#pie-" + (i + 1)).classed("pieHover", false)
                    d3.select("#pieText-" + (i + 1)).classed("pieTextHover", false)
                });
        })
    }

    changeData(dataset){
        this.dataset = dataset;
        const amounts = this.dataset.map(obj => obj.amount);
        this.maxamount = d3.max(amounts);

        this.yScale = d3.scaleRadial()
            .domain([0, this.maxamount])
            .range([this.innerRadius, this.outerRadius]);

        const arcGenerator = d3.arc()
            .innerRadius(this.innerRadius)
            .startAngle(d => this.xScale(d.decade))
            .endAngle(d => this.xScale(d.decade) + this.xScale.bandwidth())
            .padAngle(0.10)
            .padRadius(this.innerRadius);

        this.arcs
            .data(this.dataset)
            .transition()
            .duration(400)
            .attrTween("d", (d, i, nodes) => { //
                const previousRadius = nodes[i].__currentRadius || this.innerRadius; //old radius
                const targetRadius = this.yScale(d.amount); //new radius based on data
                const interpolateRadius = d3.interpolate(previousRadius, targetRadius); //makes for a smooth transition between the values

                return (t) => { //called on each animation frame, t represents the transition progress from 0 => 1
                    const currentRadius = interpolateRadius(t); 
                    const arcWithRadius = arcGenerator.outerRadius(currentRadius); //the current frame radius
                    return arcWithRadius(d);  //generates a arc with the new outerRadius
                };
            });
        }
}

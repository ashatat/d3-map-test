import React, { Component } from 'react'
import * as d3 from 'd3'

import continentsGeojson from "../geojson/continents.json";
import africa from "../geojson/africa.json"
import asia from "../geojson/asia.json"
import europ from "../geojson/europ.json"
import oceania from "../geojson/oceania.json"
import northAmerica from "../geojson/north.america.json"
import southAmerica from "../geojson/south.america.json"
import antarctica from "../geojson/antarctica.json"

export default class MapChart extends Component {
  _zoom = 100;
  _center  = [];
  _projection = undefined;
  _mapCenter = [];
  _info = false;

  async componentDidMount() {
    const svg = d3.select("svg")
      // .call(d3.zoom().on("zoom", () => { svg.attr("transform", d3.event.transform) }));
    // const svgHight = svg.style("height").split("px")[0];
    // const svgWidth = svg.style("width").split("px")[0];
    const { width, height } = this.props;
    this._center = [width / 2, height / 2];
    const mapCenter = await this.getBrowserLoacation();
    // const zoom = this._zoom;

    svg.select(".continents-layer").selectAll("g")
      .data(continentsGeojson.features)
      .enter()
      .append("g")
      .attr("class", "continent")
      .append("path")
      .attr("d", this.path(mapCenter))
      .attr("fill", "coral")
      .attr("cursor", "pointer")
      .on("mouseover", this.mouseOver)
  }

  shouldComponentUpdate(nextProps) {
    // const { width, height } = this.props;
    // const { width: nextWidth, height: nextHeight } = nextProps;
    // const deltaX = Math.abs(width - nextWidth);
    // const deltaY = Math.abs(height - nextHeight);
    // if ( deltaX >= 40 || deltaY >= 30) {
      // console.log(width, nextWidth)
      const { width, height } = nextProps;
      this._center = [width / 2, height / 2];
    // console.log(width)
    
      this.draw()
      return true;
    // }
    // return false;
  }

  getBrowserLoacation = () => new Promise((resolve, reject) => {
    const geo = navigator.geolocation;
    if (!geo) return [0, 0]

    geo.getCurrentPosition((position, error) => {
      if (error) return reject(error)
      const { coords: { longitude, latitude} } = position;
      this._mapCenter = [longitude, latitude];
      resolve([longitude, latitude]);
    });
  });

  path = (_mapCenter, _zoom, _yOffset) => {
    const mapCenter = _mapCenter || this._mapCenter;
    const zoom = _zoom || this._zoom;
    const yOffset = _yOffset || 0;


    // console.log(mapCenter)
    const projection = d3
      // .geoOrthographic()
      .geoMercator()
      .center(mapCenter)
      .scale([zoom])    
      .translate([this._center[0], this._center[1] + yOffset])

    this._projection = projection;

    return d3
      .geoPath()
      .projection(projection)
  }

  draw = () => {
    // console.log("draw")
    const svg = d3.select("svg");
    // const svgHight = svg.style("height").split("px")[0];
    // const svgWidth = svg.style("width").split("px")[0];
    svg.selectAll('path')
      .attr("d", this.path())
      // .attr('fill', 'black')

    d3.select(".continent-info")
      .text("")
  }

  drawCountries = _continent => {
    // console.log(_continent)
    const continents = {
      Africa: africa,
      Asia: asia,
      Europe: europ,
      Australia: oceania,
      Oceania: oceania,
      "North America": northAmerica,
      "South America": southAmerica,
      Antarctica: antarctica
    }

    const continent = continents[_continent];

    const geoGenerator = this.path();
    const mapCenter = this._projection.invert(geoGenerator.centroid(continent));
  
    const bounds = geoGenerator.bounds(continent)
    console.log(bounds)
    
    

    const economyScale = d3.scaleOrdinal()
      .domain(continent.features.map( d => d.properties.economy))
      .range(d3.schemePaired);
    
    const populationScale = d3.scaleOrdinal()
      .domain(continent.features.map( d => d.properties.pop_est))
      .range(d3.schemePaired);

    const continentWidth = bounds[1][0] -bounds[0][0]
    const continentHeight = bounds[1][1]- bounds[0][1]

    const zoomRatio = (this.props.height - 40) / continentHeight;

    const geoPath = this.path(mapCenter, zoomRatio * this._zoom, zoomRatio * -20);
    // d3.select(".countries-layer")
    //   .append('rect')
    //   .attr('x', bounds[0][0])
    //   .attr('y', bounds[0][1])
    //   .attr('width', continentWidth )
    //   .attr('height', continentHeight )
    //   .attr('stroke', 'pink')
    //   .attr('stroke-width', 4)
    //   .attr('fill', 'none')



    d3.select(".countries-layer")
      .selectAll("path")
      .data(continent.features)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("fill", d => economyScale(d.properties.economy))
      // .attr("fill", d => {
      //   console.log(d.properties)
      //   return "red"
      // })
      .attr("fill-opacity", 0.7)
      .attr("stroke", "white")
      .attr("d", this.path(null, 0))
      .on("mouseover", feature => this.mouseOverCountry(feature, geoPath, populationScale))
      .transition()
      .duration(2500)
      .attr("d", this.path(mapCenter, zoomRatio * this._zoom, zoomRatio * -20))
      .attr("cursor", "pointer")
      .on("end", () => {
        this._countryHover = true
      })

    d3.select(".continent-hover")
      .attr("d", "")
    d3.select(".continent-info")
      .text("")
  }

  zoom = async (deltaY, x, y) => {

      const zoom = this._zoom + (deltaY > 0 ? -70 : 70);
      // console.log(zoom)
      if (zoom < 100 || this._info || this._countryHover) {
        return;
      }
      
      // const mapCenter = await this.getBrowserLoacation();
      // const mapCenter = zoom > 200 ? this._projection.invert([x, y]) : [0, 0];
      this._zoom = zoom;
      this.draw(null, zoom )
  }

  mouseOverCountry = (feature, geoPath, populationScale) => {
    if (!this._countryHover) return;
    // console.log(feature.properties)
    // const geoGenerator = this.path();
    // const countryCenter = this._projection.invert(geoPath.centroid(feature));
    const countryCenter = geoPath.centroid(feature);
    d3.select(".country-hover")
      .attr("d", geoPath(feature))
      // .attr("d", this.path(countryCenter, 400)(feature))
      .attr("fill", populationScale(feature.properties.pop_est))
      .attr("fill-opacity", 0.9)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
    //   .on("click", () => this.showContinentInfo(feature));

    d3.select(".country-info")
      .text(feature.properties.admin)
      .attr("x", countryCenter[0])
      .attr("y", countryCenter[1])
      .attr("text-anchor", "middle")

    d3.select(".name")
      .text(feature.properties.formal_en)
      .attr("y", 20)
    d3.select(".population")
      .text(`Population: ${feature.properties.pop_est}`)
      .attr("y", 20)

  }

  mouseOver = feature => {
    if (this._info) return;
    const geoGenerator = this.path();
    const continetCenter = geoGenerator.centroid(feature);

    d3.select(".continent-hover")
      .attr("d", this.path()(feature))
      .attr("fill", "black")
      .attr("fill-opacity", 0.5)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("click", () => this.showContinentInfo(feature));

    d3.select(".continent-info")
      .text(feature.properties.CONTINENT)
      .attr("x", continetCenter[0])
      .attr("y", continetCenter[1])
      .attr("text-anchor", "middle")
  }

  showContinentInfo = feature => {
    d3.event.stopPropagation();

    const geoGenerator = this.path(null, 400);
    const mapCenter = this._projection.invert(geoGenerator.centroid(feature));
    this._info = true;

    d3.select(".continent-hover")
      .attr("d", this.path(mapCenter, 400)(feature))
      .attr("fill", "green")
      // .attr("stroke", "black")
      // .attr("stroke-width", 2)

    // get the new center
    const newGeoGenerator = this.path(mapCenter);
    const continetCenter = (newGeoGenerator.centroid(feature));
    d3.select(".continent-info")
      .text(feature.properties.CONTINENT)
      .attr("x", continetCenter[0])
      .attr("y", continetCenter[1])
      .attr("text-anchor", "middle")
      .attr("font-family", "arial")

    this.drawCountries(feature.properties.CONTINENT)
  }

  hideContinentInfo = () => {
    this._info = false
    this._countryHover = false
    d3.select(".countries-layer")
      .selectAll("path")
      .data([])
      .exit()
      .remove();
    
    d3.select(".country-info")
      .text("")

    this.draw();
  };

  render() {
    const { width , height } = this.props;
    // console.log(width, height)
    const _width = width ? (width - 25) : 0;
    const _height = height ? (height - 25) : 0;
    return (
      <div
        onWheel={e => {
          const x = (e.pageX - e.target.offsetLeft);
          const y = (e.pageY - e.target.offsetTop);
          this.zoom(e.deltaY, x, y)
        }}
        onClick={this.hideContinentInfo}
        style={{
          maxWidth: _width, height: _height, textAline: "center", margin: "0 auto",
          border: "2px solid red"
        }}
      >
        <svg width={_width} height ={_height}>
          <g className="continents-layer" />
          <g className="countries-layer" />
          <g className="info-layer">
            <path className={"continent-hover"} />
            <text className={"continent-info"} />
            <path className={"country-hover"} />
            <text className={"country-info"} />
          </g>
        </svg>
        <div className={"statistics"}>
          {/* <g transition={"translate(20, 20)"}> */}
            <div className={"name"} />
            <div className={"population"} />
            <div className={"economy"} />
            <div className={"formal_en"} />
            <div className={"area"} />
          {/* </g> */}
        </div>
      </div>
    )
  }
}

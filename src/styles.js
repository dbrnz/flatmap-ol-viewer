/******************************************************************************

Flatmap viewer and annotation tool

Copyright (c) 2019  David Brooks

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

******************************************************************************/

'use strict';

//==============================================================================

import {Circle, Fill, Style, Stroke, Text} from 'ol/style.js';
import MultiPoint from 'ol/geom/MultiPoint';

// See http://viglino.github.io/ol-ext/examples/geom/map.geom.cspline.html
import '../third_party/cspline.js';

//==============================================================================

const SPLINE_OPTS = {
    tension: 0.5,
    pointsPerSeg: 10,
    normalize: false
};

//==============================================================================

function featureText_(feature, fontSize)
//======================================
{
    return new Text({
        font: `${fontSize}px "Open Sans", "Arial Unicode MS", "sans-serif"`,
        fill: new Fill({color: '#080'}),
        textAlign: feature.get('textAlign'), // Feature specific??
        text: feature.get('name')
    });
}

export function defaultStyle(feature, resolution)
//===============================================
{
    // Scale font and stroke to match resolution

    const fontSize = 4*Math.sqrt(this.resolutions[0]/resolution);
    const strokeWidth = 0.2*this.resolutions[0]/resolution;
    const spline = feature.getGeometry().cspline(SPLINE_OPTS);

    return [
        new Style({
            fill: new Fill({
                color: [255, 255, 255, 0]
            }),
            geometry: spline,
            stroke: new Stroke({color: '#008', width: strokeWidth}),
            text: featureText_(feature, fontSize)
        })
    ];
}


export function drawingStyle(feature, resolution)
//===============================================
{
    const g = feature.getGeometry();
    const spline = g.cspline ? g.cspline(SPLINE_OPTS) : null;

    return [
        new Style({
            stroke: new Stroke({ color:"red", width:1 }),
            geometry: spline
        }),
        new Style({
            image: new Circle({
                radius: 2,
                stroke: new Stroke({color: "red", width: 4})
            }),
            geometry: new MultiPoint(feature.getGeometry().getCoordinates())
        })
    ]
}


export function editStyle(feature, resolution)
//============================================
{
    // Scale font and stroke to match resolution

    const fontSize = 4*Math.sqrt(this.resolutions[0]/resolution);
    const strokeWidth = 0.5*this.resolutions[0]/resolution;

    const geometry = feature.getGeometry();
    const spline = geometry.cspline(SPLINE_OPTS);
    const coords = (geometry.getType() === 'Polygon') ? geometry.getCoordinates()[0]
                                                      : geometry.getCoordinates();
    return [
        new Style({
            fill: new Fill({
                color: [196, 196, 196, 0.5]
            }),
            geometry: spline,
            stroke: new Stroke({color: "red", width: strokeWidth/2}),
            text: featureText_(feature, fontSize)
        }),
        new Style({
            stroke: new Stroke({color: [255, 196, 196], width: strokeWidth/5})
        }),
        new Style({
            image: new Circle({
                radius: strokeWidth/2,
                fill: new Fill({color: "blue"})
            }),
            geometry: new MultiPoint(coords)
        })
    ];
}

//==============================================================================

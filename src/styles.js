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
import Point from 'ol/geom/Point';
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

function featureText_(feature, fontSize, colour='#080')
//=====================================================
{
    return new Text({
        font: `${fontSize}px "Open Sans", "Arial Unicode MS", "sans-serif"`,
        fill: new Fill({color: colour}),
        textAlign: feature.get('textAlign'), // Feature specific??
        text: feature.get('name')
    });
}


function featureGeometry_(feature, interpolation=null)
//====================================================
{
    interpolation = interpolation || feature.get('interpolation');
    return (interpolation === 'cspline')
          ? feature.getGeometry().cspline(SPLINE_OPTS)
          : null;
}


function featurePoints_(feature)
//==============================
{
    const geometry = feature.getGeometry();
    const coords = (geometry.getType() === 'Polygon') ? geometry.getCoordinates()[0]
                 : (geometry.getType() === 'Point')   ? [geometry.getCoordinates()]
                 :                                      geometry.getCoordinates();
    return new MultiPoint(coords);
}


function featurePointStyle_(feature, strokeWidth, colour)
//=======================================================
{
    const radius = feature.get('name') ? strokeWidth/4 : 1.5*strokeWidth;
    return new Circle({
        radius: radius,
        fill: new Fill({color: colour})
    });
}


function strokeWidth_(map, resolution)
//====================================
{
    return 0.5*map.resolutions[0]/resolution;
}


export function defaultStyle(map, feature, resolution)
//====================================================
{
    // Scale font and stroke to match resolution

    const fontSize = 4*Math.sqrt(map.resolutions[0]/resolution);
    const strokeWidth = strokeWidth_(map, resolution);

    return [
        new Style({
            fill: new Fill({
                color: [255, 255, 255, 0]
            }),
            geometry: featureGeometry_(feature),
            image: featurePointStyle_(feature, strokeWidth, '#008'),
            stroke: new Stroke({color: '#008', width: strokeWidth/2}),
            text: featureText_(feature, fontSize)
        })
    ];
}

export function activeLayerStyle(map, feature, resolution)
//========================================================
{
    // Scale font and stroke to match resolution

    const fontSize = 4*Math.sqrt(map.resolutions[0]/resolution);
    const strokeWidth = strokeWidth_(map, resolution);

    return [
        new Style({
            fill: new Fill({
                color: [224, 224, 224, 0.3]
            }),
            geometry: featureGeometry_(feature),
            image: featurePointStyle_(feature, strokeWidth, '#008'),
            stroke: new Stroke({color: '#008', width: strokeWidth/2}),
            text: featureText_(feature, fontSize, '#800')
        })
    ];
}

export function interpolatedDrawingStyle(map, interpolation, feature, resolution)
//===============================================================================
{
    const strokeWidth = strokeWidth_(map, resolution);
    return [
        new Style({
            stroke: new Stroke({ color:"red", width:1 }),
            geometry: featureGeometry_(feature, interpolation),
        }),
        new Style({
            image: featurePointStyle_(feature, strokeWidth, 'red'),
            geometry: featurePoints_(feature)
        })
    ]
}


export function editStyle(map, feature, resolution)
//=================================================
{
    // Scale font and stroke to match resolution

    const fontSize = 4*Math.sqrt(map.resolutions[0]/resolution);
    const strokeWidth = strokeWidth_(map, resolution);

    return [
        new Style({
            fill: new Fill({
                color: [196, 196, 196, 0.5]
            }),
            geometry: featureGeometry_(feature),
            stroke: new Stroke({color: "red", width: 2*strokeWidth}),
            text: featureText_(feature, fontSize)
        }),
        new Style({
            stroke: new Stroke({color: [255, 196, 196], width: strokeWidth/2})
        }),
        new Style({
            image: featurePointStyle_(feature, strokeWidth, 'blue'),
            geometry: featurePoints_(feature)
        })
    ];
}


export function viewStyle(map, feature, resolution)
//=================================================
{
    // Scale font and stroke to match resolution

    const fontSize = 4*Math.sqrt(map.resolutions[0]/resolution);
    const strokeWidth = strokeWidth_(map, resolution);

    return [
        new Style({
            fill: new Fill({
                color: [255, 255, 255, 0.2]
            }),
            geometry: featureGeometry_(feature),
            image: featurePointStyle_(feature, 1.2*strokeWidth, '#008'),
            stroke: new Stroke({color: '#008', width: strokeWidth/2}),
            text: featureText_(feature, 1.2*fontSize)
        })
    ];
}

//==============================================================================

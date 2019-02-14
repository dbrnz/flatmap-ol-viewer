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

import {Fill, Style, Stroke, Text} from 'ol/style.js';

//==============================================================================

export function defaultStyle(feature, resolution)
{
    // Scale font and stroke to match resolution

    const fontSize = 4*Math.sqrt(this.resolutions[0]/resolution);
    const strokeWidth = 0.2*this.resolutions[0]/resolution;

    return new Style({
        fill: new Fill({
            color: [255, 255, 255, 0]
        }),
        stroke: new Stroke({
            color: '#008',
            width: strokeWidth
        }),
        text: new Text({
            font: `${fontSize}px "Open Sans", "Arial Unicode MS", "sans-serif"`,
            fill: new Fill({color: '#040'}),
            textAlign: feature.get('textAlign'),                 // From stylesheet specific to features??
            text: feature.get('name')
        })
    });
}

//==============================================================================

export function selectedStyle(feature, resolution)
{
    // Scale font and stroke to match resolution

    const fontSize = 6*Math.sqrt(this.resolutions[0]/resolution);
    const strokeWidth = 0.5*this.resolutions[0]/resolution;

    return new Style({
        fill: new Fill({
            color: [255, 255, 255, 0.5]
        }),
        stroke: new Stroke({
            color: '#008',
            width: strokeWidth
        }),
        text: new Text({
            font: `bold ${fontSize}px "Open Sans", "Arial Unicode MS", "sans-serif"`,
            fill: new Fill({color: '#080'}),
            textAlign: feature.get('textAlign'),                 // From stylesheet specific to features??
            text: feature.get('name')
        })
    });
}

//==============================================================================

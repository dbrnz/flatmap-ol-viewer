/******************************************************************************

Cell Diagramming Language

Copyright (c) 2018  David Brooks

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

import 'ol/ol.css';

import 'ol-layerswitcher/src/ol-layerswitcher.css';
import 'ol-contextmenu/dist/ol-contextmenu.css';

//==============================================================================

import {FlatMap} from '/static/scripts/flatmap.js';

//==============================================================================

const bodyMap = {
    "id": "demo",
    "size": [10000, 18000],
    "debug": true,
    "layerSwitcher": true,
    "overviewMap": true,
    "imageTileLayers": [{
        "rasterSource": "head"
      }, {
        "rasterSource": "cardiovascular",
        "title": "Cardiovascular"
      }, {
        "rasterSource": "brownfat",
        "title": "Brown fat"
      }, {
        "rasterSource": "respiratory",
        "title": "Respiratory"
      }, {
        "rasterSource": "digestive",
        "title": "Digestive"
      }, {
        "rasterSource": "exocrine",
        "title": "Exocrine"
      }, {
        "rasterSource": "endocrine",
        "title": "Endocrine"
      }, {
        "rasterSource": "urinary",
        "title": "Urinary"
      }, {
        "rasterSource": "reproductive",
        "title": "Reproductive"
      }, {
        "rasterSource": "spine",
        "title": "Spine"
      }, {
        "rasterSource": "ganglia",
        "title": "Ganglia"
      }, {
        "rasterSource": "neural",
        "title": "Neural"
      }
    ]
};

/* Functional diagram */

const functionalMap = {
    "id": "functional",
    "size": [20000, 12000],
    //"debug": true,
    "overviewMap": true,
    "imageTileLayers": [{
        "rasterSource": "functional"
      }
    ]
};

//==============================================================================

function init()
{
    const map = new FlatMap('map1', bodyMap);

    const map2 = new FlatMap('map2', functionalMap);

}

//==============================================================================

init();

//==============================================================================

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



//==============================================================================

import {FlatMap} from '/src/flatmap.js';

//==============================================================================

const bodyMap = {
    "id": "body",
    "size": [10000, 18000],
    "debug": true,
    "layerSwitcher": true,
    "overviewMap": true,
    "features": true,
    "editable": true,
    "layers": [{
        "source": "head"
      }, {
        "source": "cardiovascular",
        "title": "Cardiovascular"
      }, {
        "source": "brownfat",
        "title": "Brown fat"
      }, {
        "source": "respiratory",
        "title": "Respiratory"
      }, {
        "source": "digestive",
        "title": "Digestive"
      }, {
        "source": "exocrine",
        "title": "Exocrine"
      }, {
        "source": "endocrine",
        "title": "Endocrine"
      }, {
        "source": "urinary",
        "title": "Urinary"
      }, {
        "source": "reproductive",
        "title": "Reproductive"
      }, {
        "source": "spine",
        "title": "Spine"
      }, {
        "source": "ganglia",
        "title": "Ganglia"
      }, {
        "source": "neural",
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
    "layers": [{
        "source": "functional"
      }
    ]
};

/* Rat body */

const ratMap = {
    "id": "rat",
    "size": [10000, 5959],
    //"debug": true,
    "overviewMap": true,
    "layers": [{
        "source": "body"
      }
    ]
};

//==============================================================================

function init()
{
    const map = new FlatMap('map1', bodyMap);

    const map2 = new FlatMap('map2', functionalMap);

    const map3 = new FlatMap('map3', ratMap);

}

//==============================================================================

init();

//==============================================================================


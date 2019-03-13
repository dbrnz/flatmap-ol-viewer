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

const ATTRIBUTION_ABI = '© <a href="https://www.auckland.ac.nz/en/abi.html">Auckland Bioengineering Institute</a>';

//==============================================================================

import {Group} from 'ol/layer.js';
import TileImage from 'ol/source/TileImage';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';

import {GeoJSON, TopoJSON} from 'ol/format.js';

//==============================================================================

import {FeatureSource} from './sources.js';

import * as styles from './styles.js';
import * as utils from './utils.js';

//==============================================================================

class Layer
{
    constructor(title, featureLayer, tileLayer)
    {
        this._title = title;
        this._features = featureLayer;
        this._tiles = tileLayer;
        this._visible = true;
    }

    get title()
    //===========
    {
        return this._title;
    }

    get visible()
    //===========
    {
        return this._visible;
    }

    setVisible(visible)
    //=================
    {
        if (this._features) {
            this._features.setVisible(visible);
        }
        if (this._tiles) {
            this._tiles.setVisible(visible);
        }
        this._visible = visible;
    }
}

//==============================================================================

export class LayerManager
{
    constructor(map)
    {
        this._map = map;
        this._layers = [];

        const imageTileLayers = new Group();
        this._imageTileLayerCollection = imageTileLayers.getLayers();
        this._map.addLayer(imageTileLayers);

        const featureLayers = new Group();
        this._featureLayerCollection = featureLayers.getLayers();
        this._map.addLayer(featureLayers);
    }

    addLayer(layerOptions, editable)
    //==============================
    {
        const tileLayer = new TileLayer({
            title: layerOptions.title,
            source: new TileImage({
                attributions: ATTRIBUTION_ABI,
                tileGrid: this._map.tileGrid,
                tileUrlFunction: layerOptions.source ? ((...args) => {
                    return LayerManager.tileUrl_(this._map.id, layerOptions.source, ...args);
                }) : null
            })
        });
        this._imageTileLayerCollection.push(tileLayer);

        const featureLayer = new VectorLayer({
            title: layerOptions.title,
            style: (...args) => styles.defaultStyle(this._map, ...args),
            //renderMode: 'image',  //  Great performance, but point symbols and texts
                                  //  are always rotated with the view and pixels are
                                  //  scaled during zoom animations.
            source: new FeatureSource(
                this.featureUrl_(layerOptions.source),
                new GeoJSON({dataProjection: this._map.projection})            )
        });
        this._featureLayerCollection.push(featureLayer);
        this._layers.push(new Layer(layerOptions.title, featureLayer, tileLayer));
    }

    get layers()
    //==========
    {
        return this._layers;
    }

    static tileUrl_(mapId, source, coord, ratio, proj)
    //================================================
    {
        return utils.absoluteUrl(`${mapId}/tiles/${source}/${coord[0]}/${coord[1]}/${-coord[2] - 1}`)
    }

    featureUrl_(source=null)
    //======================
    {
        return (source === null) ? null
                                 : utils.absoluteUrl(`${this._map.id}/features/${source}`);
    }

    lower(layer)
    //==========
    {
        const numLayers = this._featureLayerCollection.getLength();
        for (let i = 0; i < numLayers; i++) {
            if (this._featureLayerCollection.item(i) === layer) {
                if (i > 0) {
                    this._featureLayerCollection.removeAt(i);
                    this._featureLayerCollection.insertAt(i-1, layer);
                    const tileLayer = this._imageTileLayerCollection.removeAt(i);
                    this._imageTileLayerCollection.insertAt(i-1, tileLayer);
                    this._map.render();
                }
                break;
            }
        }
    }

    raise(layer)
    //==========
    {
        const numLayers = this._featureLayerCollection.getLength();
        for (let i = 0; i < numLayers; i++) {
            if (this._featureLayerCollection.item(i) === layer) {
                if (i < (numLayers-1)) {
                    this._featureLayerCollection.removeAt(i);
                    this._featureLayerCollection.insertAt(i+1, layer);
                    const tileLayer = this._imageTileLayerCollection.removeAt(i);
                    this._imageTileLayerCollection.insertAt(i+1, tileLayer);
                    this._map.render();
                }
                break;
            }
        }
    }
}
/*
        // Add a features' layer

        if (options.features) {
            //this.demoTopoJSON_();   // <==================
            this.addLayer(this.newFeatureLayer('Features', ''));
        } else {
            this.addLayer(this.newFeatureLayer('Features'));
        }
*/
/*
    demoTopoJSON_()
    //=============
    {
        // TopoJSON demo
        const featureLayer = new VectorLayer({
            title: "Topology",
            style: (...args) => styles.defaultStyle(this, ...args),
            source: new FeatureSource(
                utils.absoluteUrl(`${this._id}/topology/`),
                new TopoJSON({dataProjection: this._projection})
            )
        });
        this._featureLayers.push(featureLayer);
        this.addLayer(featureLayer);
        // End TopoJSON demo
    }
*/

//==============================================================================

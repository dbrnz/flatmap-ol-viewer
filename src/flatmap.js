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

import 'ol/ol.css';

import 'ol-layerswitcher/src/ol-layerswitcher.css';
import 'ol-contextmenu/dist/ol-contextmenu.css';

//==============================================================================

// Import after those required by packages so we can override styles

import '/static/css/flatmap.css';

//==============================================================================

import {Map as olMap} from 'ol';
import {View as olView} from 'ol';

import Projection from 'ol/proj/Projection';
import TileGrid from 'ol/tilegrid/TileGrid';
import TileImage from 'ol/source/TileImage';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import {GeoJSON, TopoJSON} from 'ol/format.js';
import {Group} from 'ol/layer.js';
import {OverviewMap} from 'ol/control.js';
import {TileDebug} from 'ol/source.js';

import LayerSwitcher from 'ol-layerswitcher';

//==============================================================================

import {Editor} from './editor.js';
import {Toolbar} from './toolbar.js';

import * as styles from './styles.js';
import * as utils from './utils.js';

//==============================================================================

export class FlatMap extends olMap
{
    /**
     * Create and display a new FlatMap
     *
     * @param      {string}  htmlElementId  The HTML element identifier in which to display the map
     * @param      {Object}  options  The maps's configurable options
     * @param      {string}  options.id  An identifier for the map
     * @param      {Array<number>}  options.size   A two-long array giving the map's [width, height]
     * @param      {boolean}  [options.debug=false]  Add a layer showing the grid tiles
     * @param      {boolean}  [options.editable=false]  Allow features to be edited
     * @param      {string}  [options.features]  The map's features are in `/{id}/features/{features}`
     * @param      {boolean}  [options.layerSwitcher=false]  Add a control to control layer visibility
     * @param      {boolean}  [options.overviewMap=false]  Add a control to show an overview map
     * @param      {Array<Object>}  options.layers  Details of the map's layers
     * @param      {string}  [options.layers.title]  The layer's title. A layer will only appear in the
     *                                                              layer switcher if it has title
     * @param      {string}  [options.layers.featureSource]  The layer's features are in `/{id}/features/{featureSource}`
     * @param      {string}  [options.layers.rasterSource]  The layer's image tiles are in `/{id}/tiles/{rasterSource}/`
     */
    constructor(htmlElementId, options)
    {
        const tileSize = 256;
        const maxDimension = Math.max(options.size[0], options.size[1]);

        let maxZoom = 0;
        for (let dimension = maxDimension/tileSize; dimension >= 1; ) {
            dimension /= 2;
            maxZoom += 1;
        }

        const startResolution = 2**maxZoom;
        const mapResolutions = new Array(22);
        for (let i = 0, ii = mapResolutions.length; i < ii; ++i) {
            mapResolutions[i] = startResolution / Math.pow(2, i);
        }

        const mapExtent = [0, 0, options.size[0], options.size[1]];

        const mapGrid = new TileGrid({
            origin: [0, 0],
            extent: mapExtent,
            tileSize: tileSize,
            resolutions: mapResolutions
        });

        const mapProjection = new Projection({
            units: 'm',
            worldExtent: mapExtent
        });

        const mapView = new olView({
            projection: mapProjection,
            resolutions: mapResolutions,
            center: [options.size[0]/2,
                     options.size[1]/2],
            zoom: 2,
            maxZoom: maxZoom
          });

        let mapDisplayElementId = '';
        let toolbar = null;

        // Create toolbar before map so that bar is in front of map's canvas
        if (options.editable) {
            mapDisplayElementId = `${htmlElementId}-display`;

            const mapElement = document.getElementById(htmlElementId);
            mapElement.classList.add('flatmap-map');

            const mapDisplayElement = document.createElement('div');
            mapDisplayElement.id = mapDisplayElementId;
            mapDisplayElement.classList.add('flatmap-display')
            mapElement.appendChild(mapDisplayElement);

            toolbar = new Toolbar(htmlElementId);
            mapElement.appendChild(toolbar.domElement);
        } else {
            mapDisplayElementId = htmlElementId;
        }

        super({
            target: mapDisplayElementId,
            view: mapView,
            loadTilesWhileInteracting: true,
            loadTilesWhileAnimating: true
          });

        this.id = options.id;
        this.projection = mapProjection;
        this.resolutions = mapResolutions;
        this.tileGrid = mapGrid;
        this._featureLayers = [];

        if (options.editable) {
            this._editor = new Editor(this);
            toolbar.setEditor(this._editor);
        }

        // Add a debugging grid if option set and make
        // sure it's visible if we can't switch layers

        if (options.debug) {
            this.addLayer(new TileLayer({
                title: 'Grid',
                visible: !options.layerSwitcher,
                source: new TileDebug({
                  tileGrid: mapGrid,
                  projection: mapProjection
                })
            }));
        }

        // Add map's layers

        if (options.layers) {
            for (let layer of options.layers) {
                this.addNewLayer(layer);
            }
        }

        // Add a features' layer

        if (options.features) {
            //this.demoTopoJSON_();   // <==================
            this.addLayer(this.newFeatureLayer('Features', ''));
        } else {
            this.addLayer(this.newFeatureLayer('Features'));
        }


        this._activeFeatureLayer = this._featureLayers.length - 1;

        // Add a layer switcher if option set

        if (options.layerSwitcher) {
            const layerSwitcher = new LayerSwitcher();
            this.addControl(layerSwitcher);
        }

        // Add an overview map if option set

        if (options.overviewMap) {
            this.addControl(new OverviewMap({
                view: new olView({
                    projection: mapProjection,
                    resolutions: mapResolutions,
                    center: [options.size[0]/2,
                             options.size[1]/2],
                    zoom: 3,
                    maxZoom: maxZoom
                })
              })
            );
        }

    }

    get activeFeatureLayer()
    //======================
    {
        return (this._activeFeatureLayer >= 0)
            ? this._featureLayers[this._activeFeatureLayer]
            : undefined;
    }

    addNewLayer(options)
    //==================
    {
        // Just have options.source and use it to get both tiles and features??

        const tileLayer = options.rasterSource
            ? new TileLayer({
                title: options.title,
                source: new TileImage({
                tileGrid: this.tileGrid,
                tileUrlFunction: (coord, ratio, proj) =>
                    utils.absoluteUrl(`${this.id}/tiles/${options.rasterSource}/${coord[0]}/${coord[1]}/${coord[2]}`)
                })
            })
            : null;

        const featureLayer = options.featureSource
            ? this.newFeatureLayer(options.title, options.featureSource)
            : null;

        if (tileLayer && featureLayer) {
            tileLayer.set('title', 'image');
            featureLayer.set('title', 'features');
            this.addLayer(new Group({
                title: options.title,
                fold: 'close',
                layers: [featureLayer, tileLayer]
            }));
        } else if (tileLayer) {
            this.addLayer(tileLayer);
        } else if (featureLayer) {
            this.addLayer(featureLayer);
        }
    }


    featureUrl(source)
    //================
    {
        return utils.absoluteUrl(`${this.id}/features/${source}`);
    }

    newFeatureLayer(title, source=null)
    //=================================
    {
        const featureLayer = new VectorLayer({
            title: title,
            source: new VectorSource({
                format: new GeoJSON({dataProjection: this.projection}),
                url: (source !== null) ? this.featureUrl(source) : undefined
            }),
            style: styles.defaultStyle.bind(this)
        });
        this._featureLayers.push(featureLayer);
        return featureLayer;
    }

/*
        const dataProjection = this.projection;

fetch(`${this.id}/features/${options.featureSource}`)
    .then(response => response.json())
    .then(json => {
        var features = new GeoJSON().readFeatures(json);
        vectorSource.addFeatures(features);
    })
    .catch(error => console.log(error));


fetch(url).then()

*/
    demoTopoJSON_()
    //=============
    {
         /* TopoJSON demo */
        const featureLayer = new VectorLayer({
            title: "Topology",
            source: new VectorSource({
                format: new TopoJSON({
                    dataProjection: this.projection
                }),
                url: utils.absoluteUrl(`${this.id}/topology/`)
            }),
            style: styles.defaultStyle.bind(this)
        });
        this._featureLayers.push(featureLayer);
        this.addLayer(featureLayer);
        /* End TopoJSON demo */
    }
}

//==============================================================================
/*

Todo:

* Feature layers
* Feature creation and editing
* Layer reordering
* Context menu (menu items depend on selection/position)
* Tooltips
* Feature vactor layer as tiles


*/
//==============================================================================

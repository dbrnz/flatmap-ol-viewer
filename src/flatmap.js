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

/**
 * Flatmap viewer and editor.
 *
 * Viewing mode:
 *
 *  * Features are highlighted on mouseover.
 *  * Show a tooltip with information (description + ??)
 *  * Notify listeners (other maps, scaffolds, etc) that feature is active
 *  * Context menu to perform different actions (incl. viewing details?)
 *  * Double click performs a default action
 *
 *
 * Editing mode:
 *
 *  * Default interaction is as above
 *  * Changes when a tool is active
 *
 */

//==============================================================================

'use strict';

//==============================================================================

import 'ol/ol.css';

import 'ol-contextmenu/dist/ol-contextmenu.css';

//==============================================================================

// Import after those required by packages so we can override styles

import '/static/css/ol-contextmenu.css';
import '/static/css/ol-layerswitcher.css';
import '/static/css/flatmap.css';

//==============================================================================

import {Map as olMap} from 'ol';
import {View as olView} from 'ol';

import FullScreen from 'ol/control/FullScreen';
import Projection from 'ol/proj/Projection';
import TileGrid from 'ol/tilegrid/TileGrid';
import TileLayer from 'ol/layer/Tile';

import {OverviewMap} from 'ol/control.js';
import {TileDebug} from 'ol/source.js';

//==============================================================================

import {Editor} from './editor.js';
import {LayerManager} from './layers.js';
import {MessagePasser} from './messages.js';
import {PopupMenu} from './menus.js';
import {Viewer} from './viewer.js';

import * as styles from './styles.js';

//==============================================================================

export class FlatMap extends olMap
{
    /**
     * Create and display a new FlatMap
     *
     * @param      {String}  htmlElementId  The HTML element identifier in which to display the map
     * @param      {Object}  options  The maps's configurable options
     * @param      {String}  options.id  An identifier for the map
     * @param      {Array<number>}  options.size   A two-long array giving the map's ``width`` and ``height``
     * @param      {Boolean}  [options.debug=false]  Add a layer showing the grid tiles
     * @param      {Boolean}  [options.annotate=false]  Allow features to be annotated
     * @param      {Boolean}  [options.edit=false]  Allow features to be edited
     * @param      {Boolean}  [options.layerSwitcher=false]  Add a control to control layer visibility
     * @param      {Boolean}  [options.overviewMap=false]  Add a control to show an overview map
     * @param      {Array<Object>}  options.layers  Details of the map's layers
     * @param      {String}  [options.layers.id]  The layer's features are in ``/{id}/features/{layer.id}``
     *                                            and the layer's image tiles in ``/{id}/tiles/{layer.id}/``
     * @param      {String}  [options.layers.title]  The layer's title. A layer will only appear in the
     *                                               layer switcher if it has title
     * @param      {Array<number>}  [options.layers.zoom] Optional [min, max] zoom levels for displaying
     *                                                    the layer
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

        const mapContainerElement = document.getElementById(htmlElementId);

        const mapView = new olView({
            projection: mapProjection,
            resolutions: mapResolutions,
            center: [options.size[0]/2,
                     options.size[1]/2],
            resolution: Math.max(options.size[0]/mapContainerElement.clientWidth,
                                 options.size[1]/mapContainerElement.clientHeight),
            maxZoom: maxZoom
          });

        super({
            target: htmlElementId,
            view: mapView,
            loadTilesWhileInteracting: true,
            loadTilesWhileAnimating: true
        });

        this.addControl(new FullScreen());

        this._options = options;
        this._id = options.id;
        this._projection = mapProjection;
        this._resolutions = mapResolutions;
        this._tileGrid = mapGrid;
        this._featureLayers = [];

        if (options.edit) {
            this._editor = new Editor(this);
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

        this._layerManager = new LayerManager(this, options.layerSwitcher);

        if (options.layers) {
            for (let layer of options.layers) {
                this._layerManager.addLayer(layer);
            }
        }

        // Highlight layer names in switcher
        this.set('active-layer', null);

        // Detect changes to the current layer
        this.on('propertychange', e => {
            if (e.key === 'active-layer') {
                if (e.oldValue) {
                    e.oldValue.setStyle((...args) => styles.defaultStyle(this, ...args));
                }
                this._activeLayer = e.target.get(e.key);
                if (this._editor) {
                    this._editor.setActiveLayer(this._activeLayer);
                }
                if (this._activeLayer) {
                    this._activeLayer.setStyle((...args) => styles.activeLayerStyle(this, ...args));
                } else {
                    this.enableViewer();
                }
            }
        });

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
        // Add default context menu
        this._contextMenu = new PopupMenu(this);

        // By default enable pointerMove select interaction to highlight features
        this._viewer = new Viewer(this);
        this._viewer.enable();

        this._messagePasser = new MessagePasser(this._id, json => this._viewer.process(json));
    }

    get contextMenu()
    //===============
    {
        return this._contextMenu;
    }

    get id()
    //======
    {
        return this._id;
    }

    get layerManager()
    //================
    {
        return this._layerManager;
    }

    get messageHandler()
    //==================
    {
        return this._messageHandler;
    }

    get options()
    //===========
    {
        return this._options;
    }

    get projection()
    //==============
    {
        return this._projection;
    }

    get resolutions()
    //===============
    {
        return this._resolutions;
    }

    get tileGrid()
    //============
    {
        return this._tileGrid;
    }

    enableViewer()
    //============
    {
        this._viewer.enable();
    }

    disableViewer()
    //=============
    {
        this._viewer.disable();
    }

    lowerActiveLayer()
    //================
    {
        if (this.get('active-layer')) {
            this._layerManager.lower(this.get('active-layer'));
        }
    }

    raiseActiveLayer()
    //================
    {
        if (this.get('active-layer')) {
            this._layerManager.raise(this.get('active-layer'));
        }
    }
}

//==============================================================================
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

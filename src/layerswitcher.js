// Adapted from https://github.com/walkermatt/ol-layerswitcher

import Control from 'ol/control/Control';
import Observable from 'ol/Observable';

var CSS_PREFIX = 'layer-switcher-';

/**
 * OpenLayers Layer Switcher Control.
 * See [the examples](./examples) for usage.
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object} opt_options Control options, extends olx.control.ControlOptions adding:
 * **`tipLabel`** `String` - the button tooltip.
 */
export class LayerSwitcher extends Control {

    constructor(opt_options) {

        var options = opt_options || {};

        var tipLabel = options.tipLabel ?
            options.tipLabel : 'Legend';

        var element = document.createElement('div');

        super({element: element, target: options.target});

        this.mapListeners = [];

        this.hiddenClassName = 'ol-unselectable ol-control layer-switcher';
        if (LayerSwitcher.isTouchDevice_()) {
            this.hiddenClassName += ' touch';
        }
        this.shownClassName = 'shown';

        element.className = this.hiddenClassName;

        var button = document.createElement('button');
        button.setAttribute('title', tipLabel);
        element.appendChild(button);

        this.panel = document.createElement('div');
        this.panel.className = 'panel';
        element.appendChild(this.panel);
        LayerSwitcher.enableTouchScroll_(this.panel);

        var this_ = this;

        button.onmouseover = function(e) {
            this_.showPanel();
        };

        this_.panel.onclick = function(e) {
            e = e || window.event;
            if (e.toElement === this_.panel || e.toElement === this_.panel.children[0]) {
                LayerSwitcher.removeActiveHighlight_(this_.getMap());
            }
        };

        this_.panel.onmouseout = function(e) {
            e = e || window.event;
            if (!this_.panel.contains(e.toElement || e.relatedTarget)) {
                this_.hidePanel();
            }
        };

    }

    /**
    * Set the map instance the control is associated with.
    * @param {ol.Map} map The map instance.
    */
    setMap(map) {
        // Clean up listeners associated with the previous map
        for (var i = 0, key; i < this.mapListeners.length; i++) {
            Observable.unByKey(this.mapListeners[i]);
        }
        this.mapListeners.length = 0;
        // Wire up listeners etc. and store reference to new map
        super.setMap(map);
        if (map) {
            var this_ = this;
            this.mapListeners.push(map.on('pointerdown', function() {
                this_.hidePanel();
            }));
            this.renderPanel();
        }
    }

    /**
    * Show the layer panel.
    */
    showPanel() {
        if (!this.element.classList.contains(this.shownClassName)) {
            this.element.classList.add(this.shownClassName);
            this.renderPanel();
        }
    }

    /**
    * Hide the layer panel.
    */
    hidePanel() {
        if (!this.getMap().get('active-layer')
          && this.element.classList.contains(this.shownClassName)) {
            this.element.classList.remove(this.shownClassName);
        }
    }

    /**
    * Re-draw the layer panel to represent the current state of the layers.
    */
    renderPanel() {
        LayerSwitcher.renderPanel(this.getMap(), this.panel);
    }

    /**
    * **Static** Re-draw the layer panel to represent the current state of the layers.
    * @param {ol.Map} map The OpenLayers Map instance to render layers for
    * @param {Element} panel The DOM Element into which the layer tree will be rendered
    */
    static renderPanel(map, panel) {
        while(panel.firstChild) {
            panel.removeChild(panel.firstChild);
        }

        var ul = document.createElement('ul');
        panel.appendChild(ul);
        // passing two map arguments instead of lyr as we're passing the map as the root of the layers tree
        LayerSwitcher.renderLayers_(map, ul, `layer-switcher-${map.id}`);
    }

    /**
    * **Static** Toggle the visible state of a layer.
    * Takes care of hiding other layers in the same exclusive group if the layer
    * is toggle to visible.
    * @private
    * @param {ol.Map} map The map instance.
    * @param {ol.layer.Base} The layer whos visibility will be toggled.
    */
    static setVisible_(map, lyr, visible) {
        lyr.setVisible(visible);
    }

    /**
    * **Static** Render all layers that are children of a group.
    * @private
    * @param {ol.Map} map The map instance.
    * @param {ol.layer.Base} lyr Layer to be rendered (should have a title property).
    * @param {Number} idx Position in parent group list.
    */
    static renderLayer_(map, lyr, idx, lyrId) {

        var li = document.createElement('li');

        var lyrTitle = lyr.title;
        lyr.setId(lyrId);

        var label = document.createElement('label');
        label.id = `${lyrId}-label`;

        li.className = 'layer';
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.id = lyrId;
        input.checked = lyr.visible;
        input.onchange = function(e) {
            LayerSwitcher.setVisible_(map, lyr, e.target.checked);
            // If not checked and active layer then turn off highlight on label
            if (!e.target.checked && map.get('active-layer') === lyr) {
                LayerSwitcher.removeActiveHighlight_(map);
            }
        };
        li.appendChild(input);

        label.htmlFor = lyrId;
        label.innerHTML = lyrTitle;

        // FUTURE -- disable layers outside current view's resolution:
        //
        //var rsl = map.getView().getResolution();
        //if (rsl > lyr.getMaxResolution() || rsl < lyr.getMinResolution()){
        //    label.className += ' disabled';
        //}

        li.appendChild(label);

        const activeLayer = map.get('active-layer');
        if (activeLayer !== undefined) {
            if (activeLayer === lyr) {
                label.classList.add(CSS_PREFIX + 'active-layer');
            }
            label.onclick = function (e) {
                if (LayerSwitcher.toggleActive_(map, lyr, label)) {
                    e.preventDefault();
                }
            }
        };

        return li;
    }

    /**
    * **Static** Render all layers that are children of a group.
    * @private
    * @param {ol.Map} map The map instance.
    * @param {ol.layer.Group} lyr Group layer whose children will be rendered.
    * @param {Element} elm DOM element that children will be appended to.
    */
    static renderLayers_(map, elm, id) {
        var lyrs = map.layerManager.layers.slice().reverse();
        for (var i = 0, l; i < lyrs.length; i++) {
            l = lyrs[i];
            if (l.title) {
                elm.appendChild(LayerSwitcher.renderLayer_(map, l, i, `${id}-${i}`));
            }
        }
    }

    /**
    * **Static** Call the supplied function for each layer in the passed layer group
    * recursing nested groups.
    * @param {ol.layer.Group} lyr The layer group to start iterating from.
    * @param {Function} fn Callback which will be called for each `ol.layer.Base`
    * found under `lyr`. The signature for `fn` is the same as `ol.Collection#forEach`
    */
    static forEachRecursive(lyr, fn) {
        lyr.getLayers().forEach(function(lyr, idx, a) {
            fn(lyr, idx, a);
            if (lyr.getLayers) {
                LayerSwitcher.forEachRecursive(lyr, fn);
            }
        });
    }

    /**
    * @private
    * @desc Apply workaround to enable scrolling of overflowing content within an
    * element. Adapted from https://gist.github.com/chrismbarr/4107472
    */
    static enableTouchScroll_(elm) {
        if(LayerSwitcher.isTouchDevice_()){
            var scrollStartPos = 0;
            elm.addEventListener("touchstart", function(event) {
                scrollStartPos = this.scrollTop + event.touches[0].pageY;
            }, false);
            elm.addEventListener("touchmove", function(event) {
                this.scrollTop = scrollStartPos - event.touches[0].pageY;
            }, false);
        }
    }

    /**
    * @private
    * @desc Determine if the current browser supports touch events. Adapted from
    * https://gist.github.com/chrismbarr/4107472
    */
    static isTouchDevice_() {
        try {
            document.createEvent("TouchEvent");
            return true;
        } catch(e) {
            return false;
        }
    }

    /**
     * Removes the active highlight.
     * @private
     * @param      {ol.Map} map The map instance.
     * @return     {Element}  DOM element for the label that was highlighted.
     */
    static removeActiveHighlight_(map) {
        const prevActiveLayer = map.get('active-layer');
        let prevActiveLabel = null;
        if (prevActiveLayer) {
            prevActiveLabel = document.getElementById(`${prevActiveLayer.id}-label`);
            if (prevActiveLabel) {
                prevActiveLabel.classList.remove(CSS_PREFIX + 'active-layer');
                map.set('active-layer', null);
            }
        }
        return prevActiveLabel;
    }

    /**
     * Highlight/unhighlight the layer's label.
     * @private
     * @param      {ol.Map} map The map instance.
     * @param      {ol.layer.Base} lyr The layer.
     * @param      {Element}  DOM element of the layer's label.
     * @return     {boolean} True if the layer's checkbox is checked.
     */
    static toggleActive_(map, lyr, label) {

        // Remove any existing highlight
        const prevActiveLabel = LayerSwitcher.removeActiveHighlight_(map);

        const lyrId = lyr.id;
        const checkbox = document.getElementById(lyrId);

        // Highlight clicked label if it is different to what was highlighted
        if (label !== prevActiveLabel) {
            label.classList.add(CSS_PREFIX + 'active-layer');
            map.set('active-layer', lyr);
            return checkbox.checked;
        }

        return false;
    }

}

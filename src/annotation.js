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

// need to import so we can override...
// div.jsPanel-titlebar { font-size: 1.2rem; }

import { jsPanel } from 'jspanel4/es6module/jspanel.js';
import 'jspanel4/es6module/extensions/modal/jspanel.modal.js';

//==============================================================================

/**
 * A map has a unique URI.
 *
 * Each feature on a map has a unique identifier. A feature's URI
 * is `MAP_URI#FEATURE_ID`.
 *
 * Each layer already has a unique id (currently its `source` attribute)
 * and each feature is part of some layer, so do we define a feature's
 * URI as `MAP_URI/LAYER_ID/FEATURE_ID`?? This convention is extendible
 * should layers have sub-layers.
 *
 * Annotation of a feature is a set of RDF statements about the feature.
 *
 * We use Turtle as our preferred RDF serialisation (what about JSON??).
 */


//
// Annotation and attribute display/editing:
//
// * HTML form/dialog box (JSPanel ??)
// * Prompts defined by a JSON file
//
// 	 * Property URL, Prompt, Help text (description), Input validation (type,
// 	   list, validation function, ...)
// 	 * Ordered by position in JSON array.

/*
 *  Standard prefixes: https://github.com/tgbugs/pyontutils/blob/master/nifstd/scigraph/curie_map.yaml
 *
 */

//==============================================================================

const STYLE_CLASSES = [ '', "neural", "artery", "vein" ];

const JSON_PROPERTIES = [
	{	prompt: 'Styles',
		property: 'class',
		values: STYLE_CLASSES,
		optional: true,
		multi_value: true
	},
	{	prompt: 'Hidden',
		property: 'hidden',
		value_type: 'boolean',
		default: false,
		optional: true
	}
];

//==============================================================================

const RDF_PROPERTIES = [
	{	prompt: 'Anatomical term',
		property: 'RO:0003301',      // "is model of"
		value_namespaces: ['UBERON', 'RO'],
		optional: true
	},
	{	prompt: 'Flatmap object',
		property: 'rdf:type',
		values: ['', 'flatmap:Edge', 'flatmap:Node', 'flatmap:Region'],
		optional: true
	}
];

const RDF_MAPPED_PROPERTIES = new Map([
	[ 'flatmap:Node', [
		{	prompt: 'Node type',
			property: 'flatmap:nodeType',
			values: ['', 'flatmap:N1Node', 'flatmap:N2Node', 'flatmap:N3Node']
		}
	]],
	[ 'flatmap:Edge', [
		{	prompt: 'Source node',
			property: 'flatmap:source',
			value_type: 'flatmap:Node'
		},
		{	prompt: 'Target node',
			property: 'flatmap:target',
			value_type: 'flatmap:Node'
		},
		{	prompt: 'Via node(s)',
			property: 'flatmap:via',
			value_type: 'flatmap:Node',
			optional: true,
			multi_value: true
		}
	]]
]);

// required attribute on <input>

function htmlFields(properties, feature)
{
	const html = [];
	for (const property of properties) {
		html.push('<div>');
		html.push(`  <label for="${property.property}">${property.prompt}:</label>`);
		if (property.values) {
			html.push(`  <select id="${property.property}" name="${property.property}">`);
    			for (const value of property.values) {
    				html.push(`    <option value="${value}">${value}</option>`);
    			}
			html.push('  </select>');
		} else if (property.value_type === 'boolean') {
			html.push(`  <select id="${property.property}" name="${property.property}">`);
				html.push(`    <option value="false">No</option>`);
				html.push(`    <option value="true">Yes</option>`);
			html.push('  </select>');
		} else {
			html.push(`  <input type="text" id="${property.property}" name="${property.property}"/>`)
		}
		html.push('</div>');
	}

	return html.join('\n');
}

//==============================================================================

export class Annotator
{
	constructor()
	{
		//this._dataFactory = N3.DataFactory;
		//this._store = N3.Store;
		// load store from turtle... (ex web server)
	}

	annotate(feature)
	{

		// Set title to ID...
		// go through JSON_PROPERTIES: feature.get(PROP)
		// go through RDF PROPERTIES: look for (feature.id, PROP, ??) in this._store
		// Also show read-only properties (e.g. rdfs:label)

		const featureId = feature.getId() || feature.get('id');

		const content = [];
		content.push('<form class="annotator">');
		content.push(htmlFields(JSON_PROPERTIES, feature));
		content.push('<hr/>');
		content.push(htmlFields(RDF_PROPERTIES, feature));
		content.push('<hr/>');
		content.push(`<div class='buttons'><input type="submit" value="Save"></div>`);
// Dynamically add RDF_MAPPED_PROPERTIES
		content.push('</form>');

		const dialog = jsPanel.modal.create({
		    contentSize: '300 auto',
		    content: content.join('\n'),
			headerTitle: `${featureId}`,
			headerControls: 'closeonly xs',
		    closeOnBackdrop: true,
		    dragit: { containment: 0 },
		    callback: function () {
		        // get all focusable elements within the panel content
		        var focusableElmts = this.content.querySelectorAll('input, button'),
		            first = focusableElmts[0],
		            last  = focusableElmts[focusableElmts.length - 1];
		        // focus first focusable element
		        first.focus();
		        // handler to lock focus within the panel
		        this.addEventListener('keydown', function (e) {
		            if (e.key === 'Tab') {
		                if ( e.shiftKey ) /* shift + tab */ {
		                    if (document.activeElement === first) {
		                        last.focus();
		                        e.preventDefault();
		                    }
		                } else /* tab */ {
		                    if (document.activeElement === last) {
		                        first.focus();
		                        e.preventDefault();
		                    }
		                }
		            } else if (e.key === 'Enter') {
		            	if (e.target === last) {
			            	// validate/save input and close dialog
		            		this.close();
		            	}
		            }
		        });
		        this.addEventListener('mousedown', function (e) {
		            	if (e.target === last) {
			            	// validate/save input and close dialog
		            		this.close();
		            	}
		        	// submit button event...
		        });
		    }
		});


	}
}

//==============================================================================

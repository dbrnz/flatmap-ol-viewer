#------------------------------------------------------------------------------

import json as JSON

import rdflib as rdf

#------------------------------------------------------------------------------

# Namespaces we use:

from rdflib.namespace import RDFS

FMAID = rdf.Namespace('http://identifiers.org/fma/')
fma = rdf.Namespace('http://purl.org/sig/ont/fma/')

#------------------------------------------------------------------------------

def process(json):
    graph = rdf.Graph()
    graph.bind('fma', str(fma))
    fma_nodes = {}
    for n, node in enumerate(json['nodes']):
        if node['id'].startswith('FMA:'):
            subject = FMAID[node['id']]
            fma_nodes[node['id']] = subject
            graph.add( (subject, RDFS.label, rdf.Literal(node['lbl'])) )
    for edge in json['edges']:
        if (edge['sub'] in fma_nodes
        and edge['pred'].startswith('fma:')
        and edge['obj'] in fma_nodes):
            graph.add( (fma_nodes[edge['sub']], fma[edge['pred'][4:]], fma_nodes[edge['obj']]) )
    return graph

#------------------------------------------------------------------------------

if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        sys.exit('Usage: {} JSON_FILE'.format(sys.argv[0]))

    with open(sys.argv[1]) as f:
        g = process(JSON.load(f))
        with open('graph.ttl', 'wb') as out:
           g.serialize(out, format='turtle', encoding='utf8')

#------------------------------------------------------------------------------

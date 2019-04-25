import json as JSON

import networkx as nx

from networkx.readwrite import json_graph

#import pylab as plt
#from networkx.drawing.nx_agraph import graphviz_layout, to_agraph
#import pygraphviz as pgv
#from networkx.drawing.nx_pylab import draw_spring
#import matplotlib.pyplot as plt


def process(json):
    graph = nx.DiGraph()
    nodes = {}
    for n, node in enumerate(json['nodes']):
        nodes[node['id']] = n
        graph.add_node(n+1, name=node['id'], label=node['lbl'])   # rdfs:label
        #node['meta']
    for edge in json['edges']:  # == triples
        graph.add_edge(nodes[edge['obj']], nodes[edge['sub']], part=edge['pred']) # fma:constitutional_part, fma:regional_part
        #edge['meta']
    return graph


if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        sys.exit('Usage: {} JSON_FILE'.format(sys.argv[0]))

    with open(sys.argv[1]) as f:
        g = process(JSON.load(f))

        d3 = json_graph.node_link_data(g)
        with open('graph.json', 'w') as out:
           JSON.dump(d3, out, indent=2)

        #draw_spring(g)
        #plt.show()

#!/usr/bin/env node
/* eslint-disable no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const Benchmark = require("benchmark");
const seedrandom = require("seedrandom");
const { sprintf } = require("sprintf-js");

const { Graph } = require("./dist");
const { components, dijkstraAll } = require("./dist/alg");

const seed = process.env.SEED;
seedrandom(seed, { global: true });
if (seed) {
  console.log("SEED: %s (%d)", seed, Math.random());
}

const NODE_SIZES = [100];
const EDGE_DENSITY = 0.2;
const KEY_SIZE = 10;

function runBenchmark(name, fn) {
  const options = {};
  options.onComplete = function (bench) {
    const { target } = bench;
    const { hz } = target;
    const { stats } = target;
    const { rme } = stats;
    const samples = stats.sample.length;
    const msg = sprintf(
      "    %25s: %13s ops/sec \xb1 %s%% (%3d run(s) sampled)",
      target.name,
      Benchmark.formatNumber(hz.toFixed(2)),
      rme.toFixed(2),
      samples
    );
    console.log(msg);
  };
  options.onError = function (bench) {
    console.error(`    ${bench.target.error}`);
  };
  options.setup = function () {
    this.count = Math.random() * 1000;
    this.nextInt = function (range) {
      const next = Math.floor(this.count % range);
      this.count += 1;
      return next;
    };
  };
  new Benchmark(name, fn, options).run();
}

function keys(count) {
  const ks = [];
  let k;
  for (let i = 0; i < count; ++i) {
    k = "";
    for (let j = 0; j < KEY_SIZE; ++j) {
      k += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    ks.push(k);
  }
  return ks;
}

function buildGraph(numNodes, edgeDensity) {
  const g = new Graph();
  const numEdges = numNodes * numNodes * edgeDensity;
  const ks = keys(numNodes);

  ks.forEach(function (k) {
    g.setNode(k);
  });

  for (let i = 0; i < numEdges; ++i) {
    let v;
    let w;
    do {
      v = ks[Math.floor(Math.random() * ks.length)];
      w = ks[Math.floor(Math.random() * ks.length)];
    } while (g.hasEdge(v, w));
    g.setEdge(v, w);
  }
  return g;
}

NODE_SIZES.forEach(function (size) {
  const g = buildGraph(size, EDGE_DENSITY);
  const { nodes } = g;
  const { edges } = g;
  const nameSuffix = `(${size},${EDGE_DENSITY})`;

  runBenchmark(`nodes${nameSuffix}`, function () {
    g.nodes;
  });

  runBenchmark(`sources${nameSuffix}`, function () {
    g.sources;
  });

  runBenchmark(`sinks${nameSuffix}`, function () {
    g.sinks;
  });

  runBenchmark(`filterNodes all${nameSuffix}`, function () {
    g.filterNodes(function () {
      return true;
    });
  });

  runBenchmark(`filterNodes none${nameSuffix}`, function () {
    g.filterNodes(function () {
      return false;
    });
  });

  runBenchmark(`setNode${nameSuffix}`, function () {
    g.setNode("key", "label");
  });

  runBenchmark(`node${nameSuffix}`, function () {
    g.node(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`set + removeNode${nameSuffix}`, function () {
    g.setNode("key");
    g.removeNode("key");
  });

  runBenchmark(`predecessors${nameSuffix}`, function () {
    g.predecessors(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`successors${nameSuffix}`, function () {
    g.successors(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`neighbors${nameSuffix}`, function () {
    g.neighbors(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`edges${nameSuffix}`, function () {
    g.edges;
  });

  runBenchmark(`setPath${nameSuffix}`, function () {
    g.setPath(["a", "b", "c", "d", "e"]);
  });

  runBenchmark(`setEdge${nameSuffix}`, function () {
    g.setEdge("from", "to", "label");
  });

  runBenchmark(`edge${nameSuffix}`, function () {
    const edge = edges[this.nextInt(edges.length)];
    g.edge(edge);
  });

  runBenchmark(`set + removeEdge${nameSuffix}`, function () {
    g.setEdge("from", "to");
    g.removeEdge("from", "to");
  });

  runBenchmark(`inEdges${nameSuffix}`, function () {
    g.inEdges(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`outEdges${nameSuffix}`, function () {
    g.outEdges(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`nodeEdges${nameSuffix}`, function () {
    g.nodeEdges(nodes[this.nextInt(nodes.length)]);
  });

  runBenchmark(`components${nameSuffix}`, function () {
    components(g);
  });

  runBenchmark(`dijkstraAll${nameSuffix}`, function () {
    dijkstraAll(g);
  });
});

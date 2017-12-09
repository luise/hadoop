const kelda = require('kelda');
const hdfs = require('./hdfs.js');

if (process.argv.length < 4) {
  throw new Error('Usage: kelda run ./hdfsExample.js <provider> <numHDFSDatanodes>\n' +
    'For example, to start a cluster with 3 datanodes on Amazon, run:\n' +
    '$ kelda run ./hdfsExample.js Amazon 3');
}
const provider = process.argv[2];
const numDatanodes = parseInt(process.argv[3], 10);
console.log(`Starting HDFS cluster on ${provider} with ${numDatanodes} datanodes and one namenode`);

// Start one Kelda worker machine for each datanode (i.e., for each HDFS worker), and one
// additional Kelda worker machine for the namenode (i.e., the HDFS master) to run on.
const machine = new kelda.Machine({ provider });
const inf = new kelda.Infrastructure(machine, machine.replicate(numDatanodes + 1));

const h = new hdfs.HDFS(numDatanodes);
h.exposeUIToPublic();
h.deploy(inf);

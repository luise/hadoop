const fs = require('fs');
const path = require('path');
const kelda = require('kelda');

/**
 * Replaces the keys defined by `vars` with their corresponding values in
 * `template`. A variable is denoted in the template using {{key}}.
 *
 * @param {string} template A template containing variables to replace.
 * @param {Object.<string, string>} vars Maps string variables to the value
 *     that they should be replaced with.
 * @returns {string} `template` with all of the variables replaced.
 */
function applyTemplate(templateArg, vars) {
  let template = templateArg;
  Object.keys(vars).forEach((k) => {
    if (typeof k === 'string') {
      template = template.replace(`{{${k}}}`, vars[k]);
    }
  });
  return template;
}

class HDFS {
  /**
   * Creates a HDFS cluster. The cluster will incude a collection of datanodes (which are
   * containers that store data), and a single namenode that manages the cluster.
   */
  constructor(nDatanodes) {
    const image = 'keldaio/hdfs';

    // The port that datanodes and external services use to communicate with the namenode.
    // This blueprint uses 8020 rather than 9000, which is the most commonly used port for HDFS,
    // because some Kelda internal traffic uses port 9000.
    this.hdfsPort = 8020;

    // The port that datanodes listen on for communication about reading and writing data.
    this.datanodePort = 50010;

    const hdfsConfDir = '/hadoop/conf';
    // Hadoop needs to be told where to find configuration files.
    const hadoopEnv = { HADOOP_CONF_DIR: hdfsConfDir };

    this.namenode = new kelda.Container({
      name: 'hdfs-namenode',
      image,
      command: ['sh', '-c',
        // Start by formatting the namenode. This needs to be done here (and not in the
        // Dockerfile) because it needs to be done after the configuration files have
        // been added to the container.
        'hdfs namenode -format && ' +
        // This script could also start the namenode by using 'hdfs namenode'; we don't
        // do that beause the web UI assumes that the logs are in /hadoop/logs (and
        // includes an interface to browse the files at that location), so we use the
        // hadoop-daemon.sh function to start the namenode and place the logs in the
        // expected location, and then tail those logs so that 'kelda logs' also shows
        // the datanode log output.
        '/hadoop/sbin/hadoop-daemon.sh start namenode && ' +
        'tail -f /hadoop/logs/*'],
      env: hadoopEnv,
    });

    this.datanodes = [];
    for (let i = 0; i < nDatanodes; i += 1) {
      this.datanodes.push(new kelda.Container({
        name: 'hdfs-datanode',
        image,
        command: ['sh', '-c',
          // As above, use the hadoop-daemon.sh script to start the datanode so that
          // the logs are in /hadoop/logs, where users (and the web UI) expect to find
          // them.
          '/hadoop/sbin/hadoop-daemon.sh start datanode && ' +
          'tail -f /hadoop/logs/*'],
        env: hadoopEnv,
      }));
    }

    this.namenodeURI = `hdfs://${this.namenode.getHostname()}:${this.hdfsPort}`;

    // Generate all of the configuration files.
    const hdfsConfigFiles = {};
    hdfsConfigFiles[path.join(hdfsConfDir, 'masters')] = `${this.namenode.getHostname()}\n`;

    // HDFS is typically configured with a 'slaves' file that lists all of the datanodes,
    // and that's used by utility commands in the sbin/ directory that help with running
    // commands on all of the datanodes. Kelda doesn't rely on those commands, and including
    // a 'slaves' file means that the entire cluster is re-started each time a slave is added
    // or removed, so we don't include it.

    const coreSiteTemplate = fs.readFileSync(
      path.join(__dirname, 'conf/core-site.xml'), { encoding: 'utf8' });
    const coreSiteFileContent = applyTemplate(coreSiteTemplate,
      { namenodeURI: this.namenodeURI });
    hdfsConfigFiles[path.join(hdfsConfDir, 'core-site.xml')] = coreSiteFileContent;

    const hdfsSiteFileContent = fs.readFileSync(
      path.join(__dirname, 'conf/hdfs-site.xml'), { encoding: 'utf8' });
    hdfsConfigFiles[path.join(hdfsConfDir, 'hdfs-site.xml')] = hdfsSiteFileContent;

    this.namenode.filepathToContent = hdfsConfigFiles;
    this.datanodes.forEach((datanode) => {
      datanode.filepathToContent = hdfsConfigFiles; // eslint-disable-line no-param-reassign
    });

    // Configure the network.
    // Enable datanodes to connect to the namenode (e.g., to send heartbeats).
    kelda.allowTraffic(this.datanodes, this.namenode, this.hdfsPort);

    // Enable the namenode to connect to datanodes (e.g., to send data).
    kelda.allowTraffic(this.namenode, this.datanodes, this.datanodePort);

    // Enable datanodes to connect to other datanodes (e.g., to replicate data blocks).
    kelda.allowTraffic(this.datanodes, this.datanodes, this.datanodePort);
  }

  /**
   * Allows public access to the HDFS UI.  This allows anyone on the public internet to
   * view the status of the HDFS cluster, see the logs, and browse file data.
   *
   * @returns {void}
   */
  exposeUIToPublic() {
    // Expose the namenode UI.
    kelda.allowTraffic(kelda.publicInternet, this.namenode, 50070);

    // Expose the datanode UI.
    kelda.allowTraffic(kelda.publicInternet, this.datanodes, 50075);
  }

  /**
   * Allows the given containers to access HDFS to read and write data.
   */
  enableAccess(containers) {
    containers.forEach((c) => {
      // The containers need to access the namenode, which serves as the gateway
      // to the HDFS cluster, and which will communicate which datanodes to fetch
      // a particular file from.
      kelda.allowTraffic(c, this.namenode, this.hdfsPort);
      // Containers will also need to directly access datanodes, in order to read and
      // write files.
      kelda.allowTraffic(c, this.datanodes, this.datanodePort);
    });
  }

  deploy(deployment) {
    this.namenode.deploy(deployment);
    this.datanodes.forEach(datanode => datanode.deploy(deployment));
  }
}

exports.HDFS = HDFS;

# Using Kelda.js to Launch and Manage HDFS Clusters

[Kelda](http://docs.kelda.io) makes it easy to launch and manage a
[Hadoop Distributed File System (HDFS)](https://hadoop.apache.org) cluster on
any cloud provider. This repository contains a blueprint that can be used to
start a HDFS cluster using Kelda.  Once you have Kelda installed, you can
launch a collection of machines on a cloud provider and configure and launch
HDFS simply by running:

```console
$ kelda run ./hdfsExample.js <provider> <number of datanodes>
```

For example, to start a cluster with 5 datanodes on Amazon, run:

```console
$ kelda run ./hdfsExample.js Amazon 5
```

After using `kelda run`, use `kelda show` to see the machines and containers
that have been started:

```console
$ kelda show
MACHINE         ROLE      PROVIDER    REGION       SIZE         PUBLIC IP         STATUS
i-03b23de671    Master    Amazon      us-west-1    m3.medium    54.183.233.139    connected
i-0e69858e8d    Worker    Amazon      us-west-1    m3.medium    13.56.19.128      connected
i-0e651fe578    Worker    Amazon      us-west-1    m3.medium    13.57.56.66       connected
i-0c9e2f65b9    Worker    Amazon      us-west-1    m3.medium    13.56.200.236     connected
i-03af049ee5    Worker    Amazon      us-west-1    m3.medium    54.215.185.136    connected
i-00fa7da599    Worker    Amazon      us-west-1    m3.medium    13.56.160.47      connected
i-001fd0e2ea    Worker    Amazon      us-west-1    m3.medium    52.53.178.115     connected

CONTAINER       MACHINE         COMMAND                              HOSTNAME          STATUS     CREATED        PUBLIC IP
7ebaff6a2ced    i-001fd0e2ea    keldaio/hdfs sh -c /hadoop/sbi...    hdfs-datanode5    running    2 hours ago    52.53.178.115:50075
b59a2f2d5ecc    i-00fa7da599    keldaio/hdfs sh -c /hadoop/sbi...    hdfs-datanode2    running    2 hours ago    13.56.160.47:50075
366ce9a47d93    i-03af049ee5    keldaio/hdfs sh -c /hadoop/sbi...    hdfs-datanode3    running    2 hours ago    54.215.185.136:50075
b52e174bebff    i-0c9e2f65b9    keldaio/hdfs sh -c /hadoop/sbi...    hdfs-datanode4    running    2 hours ago    13.56.200.236:50075
7765f325b290    i-0e651fe578    keldaio/hdfs sh -c /hadoop/sbi...    hdfs-datanode     running    2 hours ago    13.57.56.66:50075
c0ac1540ee8f    i-0e69858e8d    keldaio/hdfs sh -c hdfs nameno...    hdfs-namenode     running    2 hours ago    13.56.19.128:50070
```

This output shows that the HDFS namenode is running at IP address
`13.56.19.128`, and the web UI is available at `13.56.19.128:50070`
(which is the address shown under `PUBLIC_IP` on the container named
`hdfs-namenode`).

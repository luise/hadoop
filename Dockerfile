FROM ubuntu:16.04

# Note that this must be an active Hadoop version; otherwise, the
# download will fail, because the Apache mirrors only host the most
# recent minor release for each major release. The latest releases
# can be found here: http://hadoop.apache.org/releases.html
ENV HADOOP_VERSION 2.7.4

# Hadoop requires JAVA_HOME to be set to a location that
# contains bin/java
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/jre

COPY download_hadoop_from_mirror.py /

# Download Hadoop and Java.
# The mv command below can take roughly 10 minutes.
RUN apt-get update \
&& apt-get install -y \
  default-jre-headless \
  python \
&& python download_hadoop_from_mirror.py $HADOOP_VERSION \
&& rm download_hadoop_from_mirror.py \
&& tar -xzf hadoop-*.tar.gz \
&& rm hadoop-*.tar.gz \
&& mv /hadoop-* /hadoop \
&& apt-get remove --purge -y python \
&& apt-get autoremove --purge -y \
&& rm -rf /var/lib/lists/* /tmp/* /var/tmp/*

ENV PATH /hadoop/sbin:/hadoop/bin:$PATH

# Setup the data directories. These should be the directories
# corresponding to dfs.namenode.name.dir (which is set in hdfs-site.xml,
# or otherwise defaults to file://${hadoop.tmp.dir}/dfs/name) and
# dfs.datanode.data.dir (which is also set in hdfs-site.xml, or
# otherwise defaults to file://${hadoop.tmp.dir}/dfs/data).
# XXX: These directories should be on volumes once Kelda supports
# them.
RUN mkdir -p /data/dfs/data /data/dfs/name

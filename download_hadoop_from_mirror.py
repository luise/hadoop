"""
This file handles downloading Hadoop from an Apache mirror.

Apache maintains a list of mirrors for each distribution, and
asks that users do not download directly from Apache, leading to
the complexity here to find a mirror and download from there.
"""

import json
import sys
# This import assumes Python version 2; Python 3 has different URL libraries.
import urllib

if __name__ == '__main__':
    hadoop_version = sys.argv[1]

    # Download the list of release locations
    apache_url = ("http://www.apache.org/dyn/closer.cgi/hadoop/common/" +
        "hadoop-{0}/hadoop-{0}.tar.gz?as_json").format(hadoop_version)
    response = urllib.urlopen(apache_url)
    data = json.loads(response.read())

    # Pick the preferred location and attempt to download a release.
    release_filename = data["path_info"]
    release_url = data["preferred"] + data["path_info"]
    print "Attempting to download Hadoop version {0} from {1}".format(
        hadoop_version, release_url)
    urllib.urlretrieve(release_url, "hadoop-{0}.tar.gz".format(hadoop_version))

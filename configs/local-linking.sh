#!/bin/bash

# Setup yarn links to use the glsp-client packages in glsp-theia-integration
# (local development)
#
# Usage:
#  $ linkClient linkCmd baseDir
#       * linkCmd: The link command (link|unlink)
#       * baseDir: The base directory
function linkClient() {
    echo "--- Link Client packages ---"
    cd $2/glsp-client || exit

    cd examples/workflow-glsp || exit
    yarn $1
    cd ../../packages/client || exit
    yarn $1
    cd ../protocol || exit
    yarn $1
    cd $2/glsp-client || exit
    yarn install --force
    cd node_modules/sprotty || exit
    yarn $1
    cd ../sprotty-protocol || exit
    yarn $1
    cd ../vscode-jsonrpc || exit
    yarn $1
    cd ../inversify || exit
    yarn $1

}

# Setup yarn links to use the glsp-node packages in glsp-theia-integration
# (local development)
#
# Usage:
#  $ linkNodeServer linkCmd baseDir
#       * linkCmd: The link command (link|unlink)
#
linkNodeServer() {
    echo $2/glsp-server-node
    if [ -d $2/glsp-server-node ]; then
        cd $2/glsp-server-node/packages/graph || exit
        yarn $1
        cd ../layout-elk || exit
        yarn $1
        cd ../server || exit
        yarn $1
        cd ../../examples/workflow-server || exit
        yarn $1

        cd $2/glsp-server-node || exit

        yarn $1 @eclipse-glsp/protocol vscode-jsonrpc inversify
        yarn install --force
    fi
}

#### MAIN Script
# Script to (un)link the the glsp packages that spawn accross multiple repositories
# for local development.
# Usage:
#  $ ./local-linking.sh baseDir (--unlink [opional])
#       * baseDir: The base directory. All glsp repositories are expected to be
#                  childs of this directory
#       * --unlink: Optional flag. Set if packages should be unlinked instead of linked

baseDir=$(
    cd $1 || exit
    pwd
)
if [[ "$baseDir" == "" ]]; then
    echo "ERROR: No basedir was defined"
    exit 0
fi

if [[ "$2" != "--unlink" ]]; then
    # Link client
    linkClient link $baseDir
    linkNodeServer link $baseDir
    cd $baseDir/glsp-theia-integration || exit
    yarn link sprotty sprotty-protocol @eclipse-glsp/client @eclipse-glsp/protocol @eclipse-glsp-examples/workflow-glsp vscode-jsonrpc inversify
    if [ -d $baseDir/glsp-server-node ]; then
        yarn link @eclipse-glsp/server @eclipse-glsp/graph @eclipse-glsp/layout-elk @eclipse-glsp-examples/workflow-server
    fi
    yarn install --force
else
    yarn unlink sprotty sprotty-protocol @eclipse-glsp/client @eclipse-glsp/protocol @eclipse-glsp-examples/workflow-glsp vscode-jsonrpc inversify
    if [ -d $baseDir/glsp-server-node ]; then
        yarn unlink @eclipse-glsp/server @eclipse-glsp/graph @eclipse-glsp/layout-elk @eclipse-glsp-examples/workflow-server
    fi
    yarn
    yarn install --force
    linkNodeServer unlink $baseDir
    linkClient unlink $baseDir
fi

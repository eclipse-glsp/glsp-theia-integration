#!/bin/bash

# Setup yarn links to use the glsp-client packages in glsp-theia-integration
# (local development)
#
# Usage:
#  $ linkClient linkCmd baseDir
#       * linkCmd: The link command (link|unlink)
#       * baseDir: The base directory
function linkClient(){
    cd $2/glsp-client || exit
    
    cd examples/workflow-sprotty || exit
    yarn $1
    cd ../../packages/client || exit
    yarn $1
    cd ../protocol || exit
    yarn $1
    cd $2/glsp-client ||exit
    yarn $1 sprotty
    yarn install --force
}

#### MAIN Script
# Script to (un)link the the glsp packages that spawn accross multiple repositories
# for local development.
# Usage:
#  $ ./local-linking.sh baseDir (--unlink [opional])
#       * baseDir: The base directory. All glsp repositories are expected to be
#                  childs of this directory
#       * --unlink: Optional flag. Set if packages should be unlinked instead of linked

baseDir=$(cd $1|| exit; pwd)
if [[ "$baseDir" == "" ]]; then
    echo "ERROR: No basedir was defined"
    exit 0
fi


if [[ "$2" != "--unlink" ]]; then
    echo "--- Start linking all necessary packages --- "
    cd $baseDir/glsp-theia-integration || exit
    yarn install
    # Link local sprotty module so that glsp-client can reuse (to avoid DI issues)
    cd node_modules/sprotty|| exit
    yarn link
    # Link client
    linkClient link $baseDir
    cd $baseDir/glsp-theia-integration || exit
    yarn link @eclipse-glsp/client
    yarn link @eclipse-glsp/protocol
    yarn link @eclipse-glsp-examples/workflow-sprotty
    yarn install --force
    echo "--- LINKING SUCCESSFULL --- "
else
    echo "--- Start unlinking all previously linked packages --- "
    cd $baseDir/glsp-theia-integration/node_modules/sprotty || exit
    yarn unlink
    cd ../..
    yarn unlink @eclipse-glsp/client
    yarn unlink @eclipse-glsp/protocol
    yarn unlink @eclipse-glsp-examples/workflow-sprotty
    linkClient unlink $baseDir
    cd $baseDir/glsp-theia-integration
    yarn install --force
    echo "--- UNLINKING SUCCESSFULL --- "
fi

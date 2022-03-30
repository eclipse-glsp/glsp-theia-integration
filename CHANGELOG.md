# Eclipse GLSP Theia Integration Changelog

## [v0.10.0- Upcoming](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/v0.10.0)

### Changes

-   [navigation] Avoid changing the viewport twice when navigating to a diagram element. [#475](https://github.com/eclipse-glsp/glsp-theia-integration/pull/102)

### Breaking Changes

-   [theia] Updated Theia dependencies to >=1.22.0. Due to an API break Theia versions <= 1.22.0 are no longer supported. [#105](https://github.com/eclipse-glsp/glsp-theia-integration/pull/105)

## [v0.9.0- 09/12/2021](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/v0.9.0)

### Changes

-   [backend] Added ability to launch embedded GLSP servers from `GLSPBackendContribution` [#35](https://github.com/eclipse-glsp/glsp-theia-integration/pull/55) [#381](https://github.com/eclipse-glsp/glsp/pull/382)
-   [feature] Replaced `ExternalNavigateToTargetHandler` and its implementation in Theia `TheiaNavigateToTargetHandler` with a generic action `NavigateToExternalTargetAction` [#153](https://github.com/eclipse-glsp/glsp-client/pull/95) and an
-   [diagram] Cleanup diagram widget initialization by removing no longer needed options [#123](https://github.com/eclipse-glsp/glsp-theia-integration/pull/60)
-   [diagram] Fixed a bug that prevented activation of the diagram widget on model source changes [#168](https://github.com/eclipse-glsp/glsp-theia-integration/pull/61)
-   [diagram] Fixed a bug that kept the hover feedback visible after the diagram widget becomes inactive [#184](https://github.com/eclipse-glsp/glsp-theia-integration/pull/64)
-   [di] Made rebind of `CommandPalette` to `TheiaCommandPalette` optional to ensure compatibility with DI configurations where no `CommandPalette` is bound [#188](https://github.com/eclipse-glsp/glsp-theia-integration/pull/65)
-   [build] Dropped the dependency to the deprecated `@theia/languages` package. [#189](https://github.com/eclipse-glsp/glsp-theia-integration/pull/66)
-   [protocol] Adapted `SetDirtyStateAction` to provide an optional `reason` property indicating the cause for the dirty state change [#197](https://github.com/eclipse-glsp/glsp-theia-integration/pull/67)
-   [feature] Introduced `GLSPSelectionDataService` which can be used to forward additional information on top of the selection to the Theia selection service. [#228](https://github.com/eclipse-glsp/glsp/issues/228)
-   [diagram] Fixed a bug that displayed the diagram widget as inactive when initially opened. [#243](https://github.com/eclipse-glsp/glsp-theia-integration/pull/75)
-   [all] Refactored the theia-integration code base to remove boilerplate configuration code. [#258](https://github.com/eclipse-glsp/glsp-theia-integration/pull/84)
-   [protocol] Adapt frontend components to conform to the latest [protocol changes](eclipse-glsp/glsp/issues/315). [#315](https://github.com/eclipse-glsp/glsp-theia-integration/pull/86)
-   Upgrade to Theia 1.17.2 and ES2017 [#90](https://github.com/eclipse-glsp/glsp-theia-integration/pull/90)

### Breaking Changes

-   [backend] Renamed `GLSPServerContribution.start()` to `GLSPServerContribution.connect()` [#35](https://github.com/eclipse-glsp/glsp-theia-integration/pull/55)
-   [feature] Replaced `ExternalNavigateToTargetHandler` and its implementation in Theia `TheiaNavigateToTargetHandler` with a generic action `NavigateToExternalTargetAction` [#153](https://github.com/eclipse-glsp/glsp-client/pull/95) and an action handler `TheiaNavigateToExternalTargetHandler` in Theia [#153](https://github.com/eclipse-glsp/glsp-theia-integration/pull/57)

-   [build] Dropped the dependency to the deprecated `@theia/languages` package. This enables compatibility with new Theia versions (>1.4.0). As a consequence the new minium requirement for `sprotty-theia` is > 0.9.0 [#189](https://github.com/eclipse-glsp/glsp-theia-integration/pull/66)
-   [all] Refactored the theia-integration code base to remove boilerplate configuration code. This effects the many components of the base API. More details can be found in the corresponding PR. [#258](https://github.com/eclipse-glsp/glsp-theia-integration/pull/84)
-   [protocol] Adapt frontend components to conform to the latest [protocol changes](eclipse-glsp/glsp/issues/315). This affects some action definitions. [#315](https://github.com/eclipse-glsp/glsp-theia-integration/pull/86)
-   Upgrade to Theia 1.17.2 and ES2017. Downstream projects need to upgrade to ES2017 as well [#90](https://github.com/eclipse-glsp/glsp-theia-integration/pull/90)

## [v0.8.0 - 20/10/2020](https://github.com/eclipse-glsp/glsp-theia-integration/releases/tag/0.8.0)

This is the first release of Eclipse GLSP since it is hosted at the Eclipse Foundation.
The 0.8.0 release includes new protocol message types and respective framework support for several new features, such as copy-paste, diagram navigation, etc. It also contains several clean-ups of the protocol and refactorings to simplify and streamline the API.
The Eclipse Theia integration of GLSP features many improvements, such as problem marker integration, native context menu items and keybindings. Finally, several bug fixes and minor are part of this release as well.

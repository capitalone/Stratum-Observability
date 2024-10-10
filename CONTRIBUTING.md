# Contributions
We love to hear feedback from the community and encourage developers to contribute back to Stratum with bugfixes, feature requests, and new plugins whenever possible.

If you are looking to contribute a new feature, we recommend first implementing it as a custom plugin if possible. If you think your plugin is useful to others, let us know! We'd love to learn more and help you make it available.

## Intake

In order to maintain Stratum, we require that all contributions (feature requests or bugs) go through an intake process via GitHub issues so that maintainers can evaluate the impacts of changes and provide guidance on the implementation.

### Any contributions you make will be under the Apache License 2.0
In short, when you submit code changes, your submissions are understood to be under the same [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) that covers the project. Feel free to contact the maintainers if that's a concern.

### We develop with GitHub
We use github to host code, to track issues and feature requests, as well as accept pull requests.

### Process 

#### Submit a GitHub issue in the Stratum repository

[Stratum GitHub issues page.](https://github.com/capitalone/Stratum-Observability/issues/new/choose) Fill out the "Stratum Intake Request" issue template for both bugs and enhancements, providing as much detail as possible for your request.

#### Intake approval process

Once an issue is created, a maintainer will review the issue and provide feedback.

The intake approval process is relatively informal. We will
 * Go over your request and use cases
 * Provide any feedback, questions, technical considerations, or complications that we notice
 * Let you know if any specific updates would be required with your changes 

If we require additional information from you, we'll label the issue with *"engaged"* to indicate that it's mid-process and also add the correct request category: *"bug"*, *"enhancement"*, *"documentation"*, etc.

Once we've looked over the issue, we'll label your PR as one of the following:
* *"ready for contribution"* - your intake is approved and awaiting contributions
* *"duplicate"* - the issue outlines a request that's already been decided on
* *"wontfix"* - your intake is not something we plan to incorporate within Stratum. This may be because your enhancement is better suited as custom plugin instead

## Local development

### 1. Install dependencies

```
nvm use && npm ci
```

### 2. Build
This command will build out the compiled code within the repository's `dist/` folder.

```
npm run build
```

#### build:watch

To continuously build the application as you make changes, run
```
npm run build:watch
```

#### build:analyze

Since Stratum is a build-time integration, bundle size is definitely one of our priorities. Run
```
npm run build:analyze
```
to get an estimate of the gzipped size of the library.

#### Watching for changes
For continuous building on changes, use the `build:watch` script instead.
```
npm run build:watch
```

### 3. Code quality & maintenance
#### lint
Run code quality checks and attempt to fix any violations. This script is automatically run as part of a pre-commit hook. You will not likely need to run this manually.

```
npm run lint
```

#### prettier
Update code to conform to repository code style rules. This script is automatically run as part of a pre-commit hook. You will not likely need to run this manually.

```
npm run prettier
```

### 4. Unit tests
Unit tests are run via Jest.

#### test
Run full unit test suite.
```
npm run test
```

#### test:coverage
Run full unit test suite and calculate code coverage reports.
```
npm run test:coverage
```

## Pull requests

Once you are ready to merge your changes, open PR(s) in the repository and fill out the provided template.

The template will prompt you for the following information:
* A link to the connected Stratum intake request GitHub issue (include the "Fixes" prefix so that your issue will auto-close on PR merge)
* Testing steps so that we can test your changes locally
* A pre-release checklist to document the scope of your changes

Once your PR is submitted, all Stratum maintainers will be automatically be requested for review. PRs require at least one maintainer to approve before it can be merged.

## Release process

After a maintainer approves your PR, they will merge it to the base branch and handle any release activities.

* Add a *"complete"* label to your intake request.
* If your changes require a new release, we will verify that the new version is available for download and create a new release tag in GitHub crediting you!

We absolutely love and welcome any and all contributions. Thanks for being a part of the community! 

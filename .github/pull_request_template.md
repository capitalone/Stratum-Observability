🚨🚨 **IMPORTANT: For new features and bugfixes, please do not create a Pull Request without creating an issue first.** 🚨🚨  
*Failure to do so may result in the rejection of the PR.*

#### 🔖 Linked issue (required)  
Fixes #[ISSUE NUMBER]  

----

#### 👷 Testing plan (required)
*Outline replicatable steps to test your PR's changes. Provide any supporting output/screenshots here, as applicable.*

-----

#### ✔️ Checklist

Please review our [Contributor Docs](https://github.com/capitalone/Stratum-Observability/blob/main/CONTRIBUTING.md) for more details.

Select one of the following:
* [ ] I have not updated the package version (Stratum library code is unchanged and a new version in npm is not needed).
* [ ] I have bumped the Stratum library version in `package.json` and `package-lock.json` in preparation for a new release.

*Indicate which of the following pre-release actions you've done.*  
* [ ] If the package version changed, this PR's title is prefixed with `release([VERSION]): `
* [ ] I have added or updated the typedoc-style comments to all touched classes, functions, types, and constants.
* [ ] If this PR adds/updates functionality, I have updated the unit tests accordingly. All new functionality is covered.

----

**⏩ Next steps:**
- Please ensure that all the automated pipeline steps pass.
- Once your PR is opened, CODEOWNERS will be requested as reviewers. At least one review from a CODEOWNER is required to merge your PR.
- Once approved, a CODEOWNER will merge your changes and perform any other necessary release tasks.

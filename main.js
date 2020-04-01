const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const request = require('request-promise-native');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    console.log("Here 1");
    console.log(core.getInput('readme-api-key'));
    const readmeKey = core.getInput('readme-api-key', { required: true });

    console.log("here 2")
    console.log(core.getInput('api-file-path'));
    const apiFilePath = core.getInput('api-file-path', { required: true });

    console.log("here3")
    console.log(core.getInput('readme-api-id'));
    const apiSettingId = core.getInput('readme-api-id', { required: true });

    console.log("here 4")
    console.log(core.getInput('readme-api-id'));
    const apiVersion = core.getInput('readme-api-version', { required: true });

    console.log("here 5")
    console.log(core.getInput('repo-token'));
    const token = core.getInput('repo-token', { required: true });
    console.log("Here 6")

    const client = new github.GitHub(token);
    console.log(`Client: ${client}`);
    console.log(`Repo Owner: ${github.context.repository}`);
    console.log(`Repo Owner: ${github.context.repo}`);

    const apiFile = await client.repos.getContents({
      owner: github.context.repository.owner,
      repo: github.context.repository.repo,
      path: apiFilePath,
      ref: github.context.ref,
    });

    console.log(`apiFilePath: ${apiFilePath}`);
    console.log(`apiFile: ${apiFile}`);
    console.log(`apiSettingId: ${apiSettingId}`);
    console.log(`apiVersion: ${apiVersion}`);
    console.log(`readmeKey: ${readmeKey}`)

    fs.writeFileSync('file.json', Buffer.from(apiFile.data.content, 'base64').toString('utf8'));

    const options = {
      formData: {
        spec: fs.createReadStream(path.resolve(process.cwd(), 'file.json')),
      },
      headers: {
        'x-readme-version': apiVersion,
        'x-readme-source': 'github',
      },
      auth: { user: readmeKey },
      resolveWithFullResponse: true,
    };

    return request.put(`https://dash.readme.io/api/v1/api-specification/${apiSettingId}`, options).then(() => {
      'Success!'
    }, (err) => {
      if (err.statusCode === 503) {
        core.setFailed('Uh oh! There was an unexpected error uploading your file. Contact support@readme.io with a copy of your file for help!')
      } else {
        console.log(err)
        console.log(`ERROR Status Code IN REQUEST: ${err.statusCode}`)
        console.log(`ERROR Status MESSAGE IN REQUEST: ${err.message}`)
        core.setFailed(err.message);
      }
    });

  } catch (error) {
    console.log(`Error outside of request ${error}`)
    core.setFailed(error.message);
  }
}

run();

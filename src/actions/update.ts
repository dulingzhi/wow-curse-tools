/**
 * @File   : update.ts
 * @Author : Dencer (tdaddon@163.com)
 * @Link   : https://dengsir.github.io
 * @Date   : 4/12/2024, 5:55:11 PM
 */

import { Update } from '../commands/update';
import github = require('@actions/github');
import core = require('@actions/core');

async function checkNeedRun() {
    const token = core.getInput('token');

    const commits = (github.context.payload.commits as any[])?.map((x) => x.id);
    if (commits) {
        const octokit = github.getOctokit(token);

        for (const id of commits) {
            const commits = await octokit.rest.repos.getCommit({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                ref: id,
            });

            console.log(commits.data.files);

            if (commits.data.files) {
                for (const file of commits.data.files) {
                    if (file.filename.endsWith('.xml')) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

async function main() {
    if (await checkNeedRun()) {
        await new Update().run();
        core.info('Run success');
    } else {
        core.info('No need to run');
    }
}

main();

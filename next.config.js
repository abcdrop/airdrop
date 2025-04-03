/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GITHUB_OWNER: process.env.GITHUB_OWNER,
    NEXT_PUBLIC_GITHUB_REPO: process.env.GITHUB_REPO,
    NEXT_PUBLIC_GITHUB_FILE_PATH: process.env.GITHUB_FILE_PATH,
    NEXT_PUBLIC_GITHUB_BRANCH: process.env.GITHUB_BRANCH,
    NEXT_PUBLIC_GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
};

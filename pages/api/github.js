import { Octokit } from 'octokit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { content, message, path } = req.body;

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Dapatkan file saat ini untuk mendapatkan SHA
    const currentFile = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: process.env.NEXT_PUBLIC_GITHUB_OWNER,
      repo: process.env.NEXT_PUBLIC_GITHUB_REPO,
      path: path || process.env.NEXT_PUBLIC_GITHUB_FILE_PATH,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    // Update file
    const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: process.env.NEXT_PUBLIC_GITHUB_OWNER,
      repo: process.env.NEXT_PUBLIC_GITHUB_REPO,
      path: path || process.env.NEXT_PUBLIC_GITHUB_FILE_PATH,
      message: message || 'Update file via Next.js Editor',
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      sha: currentFile.data.sha,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('GitHub API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

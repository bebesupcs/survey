// Netlify Serverless Function: save.js
// Handles team visual editor saves and commits directly to GitHub repository

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Team-Passcode, X-Github-Token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };

  // Pre-flight CORS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const { fileContent, passcode, token: clientToken, author } = data;

    if (!fileContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "저장할 파일 내용(fileContent)이 비어있습니다." })
      };
    }

    // 1. Team Passcode Verification
    const EXPECTED_PASSCODE = process.env.TEAM_PASSCODE || "bebesup2026!";
    if (passcode !== EXPECTED_PASSCODE) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: "팀원 인증 비밀번호가 일치하지 않습니다. (기본: bebesup2026!)",
          code: "INVALID_PASSCODE"
        })
      };
    }

    // 2. GitHub Token Resolution (Netlify env or client-supplied token)
    const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || clientToken;
    if (!githubToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "GitHub 토큰이 설정되지 않았습니다. Netlify 환경 변수에 GITHUB_TOKEN을 등록하거나, 에디터에서 GitHub 토큰을 입력해주세요.",
          code: "MISSING_GITHUB_TOKEN"
        })
      };
    }

    const owner = process.env.GITHUB_OWNER || "bebesupcs";
    const repo = process.env.GITHUB_REPO || "survey";
    const path = "standalone-preview/questions-data.js";
    const branch = process.env.GITHUB_BRANCH || "main";

    // 3. Fetch current file SHA from GitHub
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Bebesup-Survey-Editor"
      }
    });

    let currentSha = null;
    if (getRes.ok) {
      const getJson = await getRes.json();
      currentSha = getJson.sha;
    } else if (getRes.status === 401 || getRes.status === 403) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          error: "GitHub 토큰 권한이 올바르지 않거나 만료되었습니다. (contents:write 권한 필요)",
          code: "GITHUB_AUTH_FAILED"
        })
      };
    }

    // 4. Commit updated questions-data.js to GitHub main branch
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const authorTag = author ? ` by ${author}` : "";
    const commitMessage = `Update questions-data.js from online visual editor${authorTag}`;

    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Bebesup-Survey-Editor"
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(fileContent, "utf8").toString("base64"),
        sha: currentSha || undefined,
        branch
      })
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `GitHub 저장 실패 (${putRes.status}): ${errJson.message || putRes.statusText}`
        })
      };
    }

    const commitData = await putRes.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        commitSha: commitData.commit ? commitData.commit.sha : "",
        message: "성공적으로 GitHub에 저장되었습니다! Netlify에서 자동 배포가 시작됩니다 (약 20초 소요)."
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err.message || String(err)
      })
    };
  }
};

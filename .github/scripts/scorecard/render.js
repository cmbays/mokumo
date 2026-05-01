// Scorecard renderer + sticky-comment poster.
//
// Two surfaces:
//   - `renderScorecardMarkdown(scorecard)` builds the comment body
//     with status banner + 1-row table + the `<!-- ci-scorecard -->`
//     marker. Layer 3 defensive: if a Red row arrives without
//     `failure_detail_md`, render `(detail missing — see workflow logs)`
//     instead of throwing.
//   - `renderFailClosedMarkdown(prMeta, validationResult)` builds the
//     fail-closed body when the artifact fails schema validation.
//   - `postStickyComment({ octokit, owner, repo, prNumber, body })`
//     finds an existing comment containing the HTML marker and updates
//     it; otherwise creates a new one. No `marocchino`.
//
// Used by `.github/workflows/scorecard-comment.yml` via
// `actions/github-script`, and by vitest tests with a mocked octokit.

"use strict";

const STICKY_MARKER = "<!-- ci-scorecard -->";

const STATUS_ICON = {
  Green: "🟢",
  Yellow: "🟡",
  Red: "🔴",
};

/** Render a single row line as a markdown table row. */
function renderRow(row) {
  const icon = STATUS_ICON[row.status] || "❔";
  const label = row.label || row.id;
  const delta = row.delta_text || "";
  return `| ${icon} ${row.status} | ${label} | ${delta} |`;
}

/** Render inline failure detail block for a Red row.
 *  Layer 3 defensive — if the producer somehow shipped a Red row without
 *  `failure_detail_md` (Layers 1 + 2 should have caught this), we render
 *  a placeholder pointing at the workflow logs rather than crashing. */
function renderFailureDetail(row) {
  if (row.status !== "Red") return "";
  const detail = row.failure_detail_md;
  if (typeof detail !== "string" || detail.length === 0) {
    return `\n> **${row.label || row.id}:** (detail missing — see workflow logs)\n`;
  }
  return `\n> **${row.label || row.id}:** ${detail}\n`;
}

/** Build the full sticky-comment body for a valid scorecard artifact. */
function renderScorecardMarkdown(scorecard) {
  const banner = `${STATUS_ICON[scorecard.overall_status] || "❔"} **CI status: ${scorecard.overall_status}**`;
  const rows = (scorecard.rows || []).map(renderRow).join("\n");
  const detailBlocks = (scorecard.rows || [])
    .map(renderFailureDetail)
    .join("");
  const headerLine = `_PR #${scorecard.pr.pr_number} • head ${scorecard.pr.head_sha.slice(0, 7)}_`;

  return [
    STICKY_MARKER,
    banner,
    "",
    headerLine,
    "",
    "| Status | Gate | Delta |",
    "| --- | --- | --- |",
    rows,
    detailBlocks,
  ].join("\n");
}

/** Build the fail-closed comment body when the artifact fails schema
 *  validation. Per the .feature spec: explains in plain prose, contains
 *  the JSON Pointer of the failing field, and contains the offending
 *  value. */
function renderFailClosedMarkdown(prMeta, result) {
  const valueRendered =
    result.value === undefined ? "(undefined)" : JSON.stringify(result.value);
  const prNumber = prMeta && prMeta.pr_number ? prMeta.pr_number : "?";
  return [
    STICKY_MARKER,
    "🔴 **CI scorecard failed to render**",
    "",
    `The scorecard artifact for PR #${prNumber} did not match the committed schema, so the renderer is failing closed: no green status will be shown until this is fixed.`,
    "",
    `- **JSON Pointer:** \`${result.pointer}\``,
    `- **Validator message:** ${result.message}`,
    `- **Offending value:** \`${valueRendered}\``,
    "",
    "See the workflow logs for the full validator output.",
  ].join("\n");
}

/** Sticky-comment poster. List comments on the PR, find one containing
 *  the marker, update it; otherwise create a new comment.
 *
 *  `octokit` must be the `actions/github-script` octokit shape (or a
 *  test mock). The function is idempotent: a second invocation with the
 *  same marker hits `update`, never `create`. */
async function postStickyComment({
  octokit,
  owner,
  repo,
  prNumber,
  body,
  marker = STICKY_MARKER,
}) {
  // Pagination: PRs can accumulate >100 comments on long-lived branches.
  // `paginate` resolves the iteration boundary for us.
  const comments = await octokit.paginate(
    octokit.rest.issues.listComments,
    {
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100,
    },
  );

  const existing = comments.find((c) => c.body && c.body.includes(marker));
  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    return { action: "updated", comment_id: existing.id };
  }

  const created = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
  return { action: "created", comment_id: created.data && created.data.id };
}

module.exports = {
  STICKY_MARKER,
  renderScorecardMarkdown,
  renderFailClosedMarkdown,
  postStickyComment,
};

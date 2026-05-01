import { describe, it, expect, vi } from "vitest";
import {
  STICKY_MARKER,
  renderScorecardMarkdown,
  renderFailClosedMarkdown,
  postStickyComment,
} from "../render.js";

const baseScorecard = {
  schema_version: 0,
  pr: {
    pr_number: 42,
    head_sha: "abcdef0123456789",
    base_sha: "0000000000000000",
    is_fork: false,
  },
  overall_status: "Green",
  rows: [
    {
      type: "CoverageDelta",
      id: "coverage",
      label: "Coverage",
      anchor: "coverage",
      status: "Green",
      delta_text: "stub — V1 walking skeleton",
    },
  ],
  top_failures: [],
  all_check_runs_url: "https://github.com/breezy-bays-labs/mokumo/runs",
};

describe("renderScorecardMarkdown", () => {
  it("includes the sticky comment HTML marker", () => {
    const md = renderScorecardMarkdown(baseScorecard);
    expect(md).toContain(STICKY_MARKER);
  });

  it("includes the status banner with overall_status", () => {
    const md = renderScorecardMarkdown(baseScorecard);
    expect(md).toContain("CI status: Green");
  });

  it("renders a green icon for green status", () => {
    const md = renderScorecardMarkdown(baseScorecard);
    expect(md).toContain("🟢");
    expect(md).not.toContain("🔴");
  });

  it("renders the row label and delta_text", () => {
    const md = renderScorecardMarkdown(baseScorecard);
    expect(md).toContain("Coverage");
    expect(md).toContain("stub — V1 walking skeleton");
  });

  it("includes the abbreviated head SHA", () => {
    const md = renderScorecardMarkdown(baseScorecard);
    expect(md).toContain("abcdef0");
  });

  it("renders inline failure_detail_md below a Red row", () => {
    const sc = {
      ...baseScorecard,
      overall_status: "Red",
      rows: [
        {
          ...baseScorecard.rows[0],
          status: "Red",
          delta_text: "-4.2 pp",
          failure_detail_md: "coverage dropped 4.2% on crate kikan",
        },
      ],
    };
    const md = renderScorecardMarkdown(sc);
    expect(md).toContain("coverage dropped 4.2% on crate kikan");
    expect(md).toContain("🔴");
  });

  it("renders the Layer-3 placeholder when a Red row is missing failure_detail_md", () => {
    const sc = {
      ...baseScorecard,
      overall_status: "Red",
      rows: [
        {
          ...baseScorecard.rows[0],
          status: "Red",
          delta_text: "-4.2 pp",
          // failure_detail_md intentionally omitted
        },
      ],
    };
    const md = renderScorecardMarkdown(sc);
    expect(md).toContain("(detail missing — see workflow logs)");
  });
});

describe("renderFailClosedMarkdown", () => {
  it("contains the sticky marker so it overwrites the same comment", () => {
    const md = renderFailClosedMarkdown(
      { pr_number: 42 },
      {
        valid: false,
        pointer: "/rows/0/failure_detail_md",
        value: undefined,
        message: "must have required property 'failure_detail_md'",
      },
    );
    expect(md).toContain(STICKY_MARKER);
  });

  it("contains the JSON Pointer of the failing field", () => {
    const md = renderFailClosedMarkdown(
      { pr_number: 42 },
      {
        valid: false,
        pointer: "/rows/0/failure_detail_md",
        value: undefined,
        message: "must have required property 'failure_detail_md'",
      },
    );
    expect(md).toContain("/rows/0/failure_detail_md");
  });

  it("contains the offending value", () => {
    const md = renderFailClosedMarkdown(
      { pr_number: 42 },
      {
        valid: false,
        pointer: "/overall_status",
        value: "Magenta",
        message: "must be equal to one of the allowed values",
      },
    );
    expect(md).toContain('"Magenta"');
  });

  it("explains the failure in plain prose, no green status", () => {
    const md = renderFailClosedMarkdown(
      { pr_number: 42 },
      { valid: false, pointer: "/foo", value: 1, message: "bad" },
    );
    expect(md).toContain("did not match the committed schema");
    expect(md).not.toContain("CI status: Green");
  });
});

describe("postStickyComment", () => {
  function makeOctokit({ existing = [] } = {}) {
    const updateComment = vi.fn().mockResolvedValue({ data: {} });
    const createComment = vi.fn().mockResolvedValue({ data: { id: 999 } });
    const listComments = vi.fn();
    const paginate = vi.fn().mockResolvedValue(existing);
    return {
      rest: {
        issues: {
          listComments,
          createComment,
          updateComment,
        },
      },
      paginate,
      _spies: { updateComment, createComment, paginate },
    };
  }

  it("creates a new comment when none exists with the marker", async () => {
    const octokit = makeOctokit({ existing: [] });
    const result = await postStickyComment({
      octokit,
      owner: "breezy-bays-labs",
      repo: "mokumo",
      prNumber: 42,
      body: `${STICKY_MARKER}\nbody`,
    });
    expect(result.action).toBe("created");
    expect(octokit._spies.createComment).toHaveBeenCalledTimes(1);
    expect(octokit._spies.updateComment).not.toHaveBeenCalled();
  });

  it("updates the existing marker-bearing comment instead of creating a duplicate", async () => {
    const octokit = makeOctokit({
      existing: [
        { id: 11, body: "unrelated" },
        { id: 22, body: `${STICKY_MARKER}\nold body` },
      ],
    });
    const result = await postStickyComment({
      octokit,
      owner: "breezy-bays-labs",
      repo: "mokumo",
      prNumber: 42,
      body: `${STICKY_MARKER}\nnew body`,
    });
    expect(result.action).toBe("updated");
    expect(result.comment_id).toBe(22);
    expect(octokit._spies.updateComment).toHaveBeenCalledTimes(1);
    expect(octokit._spies.createComment).not.toHaveBeenCalled();
  });

  it("is idempotent: a second invocation with the same marker still updates, never creates", async () => {
    const octokit = makeOctokit({
      existing: [{ id: 33, body: `${STICKY_MARKER}\nfirst body` }],
    });
    await postStickyComment({
      octokit,
      owner: "x",
      repo: "y",
      prNumber: 1,
      body: `${STICKY_MARKER}\nsecond body`,
    });
    await postStickyComment({
      octokit,
      owner: "x",
      repo: "y",
      prNumber: 1,
      body: `${STICKY_MARKER}\nthird body`,
    });
    expect(octokit._spies.updateComment).toHaveBeenCalledTimes(2);
    expect(octokit._spies.createComment).not.toHaveBeenCalled();
  });
});

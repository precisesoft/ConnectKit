/*
 Generates user-friendly documentation for each GitHub Actions workflow
 in .github/workflows and writes them to docs/workflows.

 Usage:
   node scripts/generate-workflow-docs.js
*/

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const WORKFLOWS_DIR = path.join(process.cwd(), '.github', 'workflows');
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'workflows');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatTrigger(on) {
  if (!on) return '- Manual only';
  const lines = [];
  const keys = typeof on === 'string' ? [on] : Object.keys(on);
  for (const k of keys) {
    if (k === 'push' || k === 'pull_request') {
      const branches = on[k]?.branches || on[k]?.[0]?.branches;
      const tags = on[k]?.tags;
      const targets = [];
      if (branches)
        targets.push(
          `branches: ${Array.isArray(branches) ? branches.join(', ') : branches}`,
        );
      if (tags)
        targets.push(`tags: ${Array.isArray(tags) ? tags.join(', ') : tags}`);
      lines.push(
        `- On ${k.replace('_', ' ')}${targets.length ? ` (${targets.join('; ')})` : ''}`,
      );
    } else if (k === 'schedule') {
      const cron = on[k]?.map?.((s) => s.cron).filter(Boolean) || [];
      lines.push(
        `- On schedule${cron.length ? ` (cron: ${cron.join(', ')})` : ''}`,
      );
    } else if (k === 'workflow_dispatch') {
      lines.push('- Manually from GitHub (Run workflow)');
    } else if (k === 'workflow_call') {
      lines.push('- Reusable (called by other workflows)');
    } else {
      lines.push(`- On ${k}`);
    }
  }
  return lines.join('\n');
}

function collectSecrets(obj, found = new Set()) {
  if (!obj) return found;
  if (typeof obj === 'string') {
    const re = /secrets\.(\w+)/gi;
    let m;
    while ((m = re.exec(obj))) found.add(m[1]);
    return found;
  }
  if (Array.isArray(obj)) {
    for (const v of obj) collectSecrets(v, found);
  } else if (typeof obj === 'object') {
    for (const v of Object.values(obj)) collectSecrets(v, found);
  }
  return found;
}

function collectArtifacts(job) {
  const artifacts = [];
  const steps = job?.steps || [];
  for (const s of steps) {
    if (!s) continue;
    const uses = s.uses || '';
    if (typeof uses === 'string' && uses.includes('actions/upload-artifact')) {
      const name =
        s.with?.name || s.with?.['artifact-name'] || s.name || 'artifact';
      artifacts.push(name);
    }
  }
  return artifacts;
}

function humanizeJobId(id) {
  return id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderWorkflowDoc(filename, wf) {
  const title = wf.name || path.basename(filename);
  const triggers = formatTrigger(wf.on);
  const secrets = Array.from(collectSecrets(wf));

  const jobSections = [];
  const jobs = wf.jobs || {};
  for (const [jobId, job] of Object.entries(jobs)) {
    const jobName = job.name || humanizeJobId(jobId);
    const needs = job.needs
      ? Array.isArray(job.needs)
        ? job.needs.map(humanizeJobId).join(', ')
        : humanizeJobId(job.needs)
      : 'None';
    const runsOn = job['runs-on'] || 'ubuntu-latest';
    const steps = (job.steps || [])
      .filter(Boolean)
      .map(
        (s) =>
          `      - ${s.name || (s.uses ? `Use ${s.uses}` : s.run ? 'Run script' : 'Step')}`,
      )
      .join('\n');
    const artifacts = collectArtifacts(job);

    jobSections.push(
      [
        `- Job: ${jobName}`,
        `  - Runner: ${runsOn}`,
        `  - Depends on: ${needs}`,
        artifacts.length ? `  - Artifacts: ${artifacts.join(', ')}` : null,
        `  - What happens:`,
        steps || '      - Steps defined in workflow',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  const friendlySummary = `This workflow helps automate checks for ${title.toLowerCase()}. It runs on specific events and performs a series of steps to validate or analyze your application. You can run it manually from GitHub when needed.`;

  const content = [
    `**${title}**`,
    '',
    '**What It Does**',
    `- ${friendlySummary}`,
    '',
    '**When It Runs**',
    triggers || '- Manual only',
    '',
    '**Jobs & Steps**',
    jobSections.length ? jobSections.join('\n') : '- No jobs defined',
    '',
    '**Required Secrets**',
    secrets.length ? `- ${secrets.join(', ')}` : '- None',
    '',
    '**How To Run Manually**',
    '- Go to your repository on GitHub',
    '- Click the Actions tab',
    `- Select "${title}" from the left sidebar`,
    '- Click the Run workflow button and follow prompts',
    '',
    '**Where To See Results**',
    '- Action run summary shows job status and logs',
    '- Artifacts section provides downloadable reports (if any)',
    '- Annotations highlight warnings and errors in code',
    '',
    '**Troubleshooting Tips**',
    '- If a step fails, open the step log to see details',
    '- Ensure required secrets exist under Settings > Secrets and variables > Actions',
    '- Check that referenced paths and scripts exist in the repo',
  ].join('\n');

  return content + '\n';
}

function main() {
  ensureDir(OUTPUT_DIR);
  const files = fs
    .readdirSync(WORKFLOWS_DIR)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort();

  const indexItems = [];
  for (const file of files) {
    const full = path.join(WORKFLOWS_DIR, file);
    const src = fs.readFileSync(full, 'utf8');
    let doc;
    try {
      doc = yaml.load(src);
    } catch (e) {
      console.error(`Failed to parse ${file}:`, e.message);
      continue;
    }
    const title = doc?.name || file.replace(/\.(ya?ml)$/i, '');
    const slug = slugify(title);
    const outPath = path.join(OUTPUT_DIR, `${slug}.md`);
    const md = renderWorkflowDoc(file, doc);
    fs.writeFileSync(outPath, md, 'utf8');
    indexItems.push({ title, slug, file });
  }

  // Write index
  const indexMd =
    [
      '**Workflow Catalog**',
      '',
      'This catalog explains all automated workflows in simple, non-technical language. Click any item to learn what it does, when it runs, and how to read results.',
      '',
      '**Workflows**',
      ...indexItems.map(
        (i) =>
          `- ${i.title} — docs/workflows/${i.slug}.md (source: .github/workflows/${i.file})`,
      ),
      '',
      '**Run Tips**',
      '- You can run most workflows manually from GitHub > Actions.',
      '- Scheduled workflows run automatically; results appear in Actions history.',
      '- Some workflows are reusable and run only when called by others.',
    ].join('\n') + '\n';
  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), indexMd, 'utf8');
}

main();

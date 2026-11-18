import { writeArtifact } from './common';
import {
  blackmatrixRuleRoot,
  citylineDomain,
  ghproxyPrefix,
  latencyTest,
  regions,
  serviceRegions,
  services,
  variants,
} from './proxy-config';

const upstream = [
  'https://raw.githubusercontent.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever/release',
  'https://johnshall.github.io/Shadowrocket-ADBlock-Rules-Forever',
];
const release = 'https://raw.githubusercontent.com/ilyydy/build-factory/release';
const ruleDir = 'clash-rules';
const license = 'https://creativecommons.org/licenses/by-sa/4.0/';
const proxy = '节点选择';
const testUrl = 'https://www.gstatic.com/generate_204';
const { intervalSeconds, toleranceMs, timeoutSeconds } = latencyTest;

const proxyGroups = [
  { name: proxy, type: 'select', 'include-all': true, 'empty-fallback': 'REJECT' },
  ...regions.map(({ name, clashAliases }) => ({
    name,
    type: 'url-test',
    'include-all': true,
    filter: `(?i)(${name}|${clashAliases.replace(/\b[A-Z]{2,3}\b/g, code => `\\b${code}\\b`)})`,
    url: testUrl,
    interval: intervalSeconds,
    tolerance: toleranceMs,
    timeout: timeoutSeconds * 1000,
    'empty-fallback': 'REJECT',
  })),
  ...services.map(name => ({
    name,
    type: 'select',
    proxies: [...serviceRegions, proxy],
  })),
];

type Variant = (typeof variants)[number];
type Policy = 'PROXY' | 'DIRECT' | 'REJECT';
type Provider = { url: string; behavior: 'classical' | 'domain'; format: 'yaml' | 'text' };
type Route = { type: string; value: string; policy: Policy; options: string[] };

function target(policy: Policy) {
  return policy === 'PROXY' ? proxy : policy;
}

function readRoutes(config: string): Route[] {
  const configLines = config.split(/\r?\n/).map(line => line.trim());
  const start = configLines.indexOf('[Rule]');
  if (start === -1) {
    throw new Error('Missing upstream [Rule] section');
  }

  const lines: string[] = [];
  for (const line of configLines.slice(start + 1)) {
    if (line.startsWith('[')) break;
    if (line && !/^(#|;|\/\/)/.test(line)) {
      lines.push(line.replace(/\s+#.*$/, '').trim());
    }
  }

  if (!lines.at(-1)?.startsWith('FINAL,')) {
    throw new Error('The upstream [Rule] section must end with FINAL');
  }

  return lines.map((line, index) => {
    const [type, value, destination, ...options] = line.split(',').map(field => field.trim());
    const policy = (type === 'FINAL' ? value : destination)?.toUpperCase();
    if (policy !== 'PROXY' && policy !== 'DIRECT' && policy !== 'REJECT') {
      throw new Error(`Unsupported upstream policy in ${line}`);
    }
    if (!value || (type === 'FINAL' && (destination !== undefined || index !== lines.length - 1))) {
      throw new Error(`Invalid upstream rule: ${line}`);
    }

    const supportsNoResolve = ['IP-CIDR', 'IP-CIDR6', 'GEOIP', 'RULE-SET'].includes(type);
    if (options.length && !(supportsNoResolve && options.length === 1 && options[0] === 'no-resolve')) {
      throw new Error(`Unsupported upstream rule options in ${line}`);
    }

    return { type, value, policy, options };
  });
}

async function fetchRoutes(source: string): Promise<Route[]> {
  const errors: unknown[] = [];
  for (const base of [...upstream, ...upstream]) {
    try {
      const url = `${base}/${source}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!response.ok) {
        throw new Error(`${url}: HTTP ${response.status}`);
      }
      return readRoutes(await response.text());
    } catch (error) {
      errors.push(error);
    }
  }
  throw new AggregateError(errors, `Unable to load ${source}`);
}

function externalProvider(url: string): [string, Provider] {
  const source = url.startsWith(`${blackmatrixRuleRoot}/`) &&
    url.slice(blackmatrixRuleRoot.length + 1).match(/^(?:Shadowrocket|QuantumultX)\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\.list$/);
  if (source) {
    const [, directory, file] = source;
    return [
      `blackmatrix-${directory.toLowerCase()}-${file.toLowerCase()}`,
      { url: `${blackmatrixRuleRoot}/Clash/${directory}/${file}.yaml`, behavior: 'classical', format: 'yaml' },
    ];
  }

  if (url === 'https://raw.githubusercontent.com/iab0x00/ProxyRules/main/Rule/AI.txt') {
    return ['proxyrules-ai', { url, behavior: 'classical', format: 'text' }];
  }

  throw new Error(`Unsupported upstream rule set: ${url}`);
}

function renderProfile(header: string, providers: Map<string, Provider>, rules: string[], urlPrefix = '') {
  return [
    header,
    'mode: rule',
    'proxy-providers: {}',
    'profile:',
    '  store-selected: true',
    '',
    'proxy-groups:',
    ...proxyGroups.map(({ name, ...options }) => [
      `  - name: ${JSON.stringify(name)}`,
      ...Object.entries(options).map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`),
    ].join('\n')),
    '',
    'rule-providers:',
    ...Array.from(providers, ([name, { url, behavior, format }]) => [
      `  ${name}:`,
      '    type: http',
      `    behavior: ${behavior}`,
      `    format: ${format}`,
      `    url: ${JSON.stringify(urlPrefix + url)}`,
      '    proxy: DIRECT',
      '    interval: 86400',
    ].join('\n')),
    '',
    'rules:',
    ...rules.map(rule => `  - ${JSON.stringify(rule)}`),
    '',
  ].join('\n');
}

function compileProfile({ name, source }: Variant, routes: Route[]) {
  const header = [
    `# Johnshall / Shadowrocket-ADBlock-Rules-Forever: ${upstream[1]}/${source}`,
    `# Routing rules adapted for Mihomo by build-factory (CC BY-SA 4.0: ${license})`,
  ].join('\n');
  const artifacts = new Map<string, string>();
  const providers = new Map<string, Provider>();
  const rules = [`DOMAIN-SUFFIX,${citylineDomain},${proxy}`];

  for (const service of services) {
    const [key, provider] = externalProvider(`${blackmatrixRuleRoot}/Shadowrocket/${service}/${service}.list`);
    providers.set(key, provider);
    rules.push(`RULE-SET,${key},${service}`);
  }

  let batch: Route[] = [];
  const blocks: Partial<Record<Policy, number>> = {};

  function flushBatch() {
    if (!batch.length) return;

    const { policy } = batch[0];
    const block = (blocks[policy] ?? 0) + 1;
    blocks[policy] = block;
    // Keep each same-policy run at its original priority. Give its domain
    // rules a trie-backed provider so large lists don't require a linear scan.
    const domains: string[] = [];
    const classical: string[] = [];
    for (const { type, value, options } of batch) {
      if (type === 'DOMAIN' || type === 'DOMAIN-SUFFIX') {
        domains.push(type === 'DOMAIN' ? value : `+.${value}`);
      } else {
        classical.push([type, value, ...options].join(','));
      }
    }

    for (const { behavior, entries } of [
      { behavior: 'domain', entries: domains },
      { behavior: 'classical', entries: classical },
    ] as const) {
      if (!entries.length) continue;
      const key = `${name}-${policy.toLowerCase()}-${block}-${behavior}`;
      const file = `${ruleDir}/${key}.txt`;
      artifacts.set(file, [header, ...entries, ''].join('\n'));
      providers.set(key, { url: `${release}/${file}`, behavior, format: 'text' });
      rules.push(`RULE-SET,${key},${target(policy)}`);
    }
    batch = [];
  }

  for (const route of routes) {
    const { type, value, policy, options } = route;
    if (['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'IP-CIDR', 'IP-CIDR6'].includes(type)) {
      if (batch.length && policy !== batch[0].policy) flushBatch();
      batch.push(route);
      continue;
    }

    flushBatch();
    switch (type) {
      case 'RULE-SET': {
        const [key, provider] = externalProvider(value);
        providers.set(key, provider);
        rules.push(['RULE-SET', key, target(policy), ...options].join(','));
        break;
      }
      case 'GEOIP':
        rules.push([type, value, target(policy), ...options].join(','));
        break;
      case 'FINAL':
        rules.push(`MATCH,${target(policy)}`);
        break;
      default:
        throw new Error(`Unsupported upstream rule type: ${type}`);
    }
  }

  artifacts.set(`${name}.yaml`, renderProfile(header, providers, rules));
  artifacts.set(`${name}_ghproxy.yaml`, renderProfile(header, providers, rules, ghproxyPrefix));
  return artifacts;
}

async function build() {
  const profiles = await Promise.all(variants.map(async variant => {
    try {
      return compileProfile(variant, await fetchRoutes(variant.source));
    } catch (error) {
      throw new Error(`Failed to build ${variant.name}.yaml`, { cause: error });
    }
  }));

  for (const artifacts of profiles) {
    for (const [file, content] of artifacts) {
      writeArtifact(file, content);
    }
  }
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

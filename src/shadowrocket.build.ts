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

const regionSubscription = '咕嘎云';
const testUrl = 'http://www.gstatic.com/generate_204';
const { intervalSeconds, toleranceMs, timeoutSeconds } = latencyTest;

const regionGroups = regions
  .map(({ name, shadowrocketAliases }) =>
    [
      `${name} = url-test`,
      regionSubscription,
      'use=true',
      `url=${testUrl}`,
      `interval=${intervalSeconds}`,
      `tolerance=${toleranceMs}`,
      `timeout=${timeoutSeconds}`,
      'select=0',
      `policy-regex-filter=(?i)(${name}|${shadowrocketAliases})`,
    ].join(','),
  )
  .join('\n');
const serviceGroups = services
  .map(name =>
    [
      `${name} = select`,
      ...serviceRegions,
      `interval=${intervalSeconds}`,
      `timeout=${timeoutSeconds}`,
      'select=0',
      `url=${testUrl}`,
    ].join(','),
  )
  .join('\n');
const serviceRules = services
  .map(name => `RULE-SET,${ghproxyPrefix}${blackmatrixRuleRoot}/Shadowrocket/${name}/${name}.list,${name}`)
  .join('\n');

const time = new Date().toLocaleString('zh-CN', {
  timeZone: 'Asia/Shanghai',
  hour12: false,
});

function renderProfile(title: string, source: string) {
  return `

[General]
# 基于${title}(https://github.com/Johnshall/Shadowrocket-ADBlock-Rules-Forever)的扩展版本
# ${time}
include = ${source}


[Proxy Group]
${regionGroups}

${serviceGroups}


[Rule]
DOMAIN-SUFFIX,${citylineDomain},PROXY
${serviceRules}

`;
}

for (const { name, title, source } of variants) {
  writeArtifact(`${name}.conf`, renderProfile(title, source));
}

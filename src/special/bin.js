import path from 'path';
import lodash from 'lodash';
import { loadMetadata, getScripts } from '../utils';

const binaryCache = {};

function getCacheOrLoad(dep, dir) {
  const index = `${dir}/${dep}`;
  if (!binaryCache[index]) {
    const metadata = loadMetadata(dep, dir) || {};
    binaryCache[index] = metadata.bin || {};
  }
  return binaryCache[index];
}

function getBinaries(dep, dir) {
  const binMetadata = getCacheOrLoad(dep, dir);

  if (typeof binMetadata === 'string') {
    return [[dep, binMetadata]];
  }

  return lodash.toPairs(binMetadata);
}

function getBinaryFeatures(dep, [key, value]) {
  const binPath = path.join('node_modules', dep, value).replace(/\\/g, '/');

  const features = [
    key,
    `--require ${key}`,
    `--require ${key}/register`,
    `$(npm bin)/${key}`,
    `node_modules/.bin/${key}`,
    `./node_modules/.bin/${key}`,
    binPath,
    `./${binPath}`,
  ];

  return features;
}

function isBinaryInUse(dep, scripts, dir) {
  const binaries = getBinaries(dep, dir);
  return binaries.some((bin) =>
    getBinaryFeatures(dep, bin).some((feature) =>
      scripts.some((script) => lodash.includes(` ${script} `, ` ${feature} `)),
    ),
  );
}

export default function parseBinary(content, filepath, deps, dir) {
  const scripts = getScripts(filepath, content);
  return deps.filter((dep) => isBinaryInUse(dep, scripts, dir));
}

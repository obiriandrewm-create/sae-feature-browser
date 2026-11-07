// Mock data generator for SAE Feature Browser
// Generates realistic SAE features with activations, tokens, labels

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface Feature {
  id: string;
  layer: number;
  featureIndex: number;
  maxActivation: number;
  activationHistogram: number[];
  topTokens: string[];
  tokenActivations: number[];
  semanticLabel: string | null;
  description: string | null;
  isBookmarked: boolean;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomGaussian(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generateActivationHistogram(maxAct: number, bins: number = 50): number[] {
  const hist = new Array(bins).fill(0);
  const samples = 10000;
  
  for (let i = 0; i < samples; i++) {
    const act = Math.max(0, randomGaussian(maxAct * 0.3, maxAct * 0.2));
    const bin = Math.min(bins - 1, Math.floor((act / maxAct) * bins));
    hist[bin]++;
  }
  
  const total = hist.reduce((a, b) => a + b, 0);
  return hist.map(v => v / total);
}

const tokenPool = [
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
  'this', 'that', 'these', 'those', 'it', 'he', 'she', 'they', 'we', 'you', 'i',
  'his', 'her', 'their', 'our', 'your', 'my', 'its',
  'not', 'no', 'yes', 'so', 'very', 'just', 'only', 'even', 'also', 'still',
  'model', 'layer', 'neuron', 'activation', 'feature', 'token', 'embedding', 'attention',
  'transformer', 'gradient', 'loss', 'training', 'inference', 'batch', 'epoch',
  'concept', 'meaning', 'semantic', 'syntax', 'grammar', 'context', 'sequence',
];

const semanticLabels = [
  'English definite articles',
  'Subject pronouns',
  'Past tense verbs',
  'Prepositional phrases',
  'Negation words',
  'Modal auxiliaries',
  'Technical ML terminology',
  'Mathematical operators',
  'Code syntax tokens',
  'Dialogue markers',
  'Temporal expressions',
  'Spatial prepositions',
  'Comparative adjectives',
  'Quantifiers',
  'Conjunctions',
  null,
  null,
  null,
];

function generateFeatures(count: number, layers: number = 32): Feature[] {
  const features: Feature[] = [];
  
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(Math.random() * layers);
    const featureIndex = Math.floor(Math.random() * 16384);
    const maxActivation = 1 + Math.random() * 20;
    
    const histogram = generateActivationHistogram(maxActivation);
    const numTopTokens = 5 + Math.floor(Math.random() * 10);
    const topTokens = Array.from({ length: numTopTokens }, () => randomChoice(tokenPool));
    const tokenActivations = topTokens.map(() => Math.random() * maxActivation);
    
    const labelRand = Math.random();
    let semanticLabel: string | null = null;
    if (labelRand < 0.7) {
      semanticLabel = randomChoice(semanticLabels.filter(Boolean) as string[]);
    }
    
    features.push({
      id: `L${layer}_F${featureIndex}`,
      layer,
      featureIndex,
      maxActivation,
      activationHistogram: histogram,
      topTokens,
      tokenActivations,
      semanticLabel,
      description: semanticLabel ? `Feature activates strongly on ${semanticLabel.toLowerCase()}` : null,
      isBookmarked: Math.random() < 0.05,
    });
  }
  
  return features;
}

function main() {
  const featureCount = parseInt(process.env.FEATURE_COUNT || '100000', 10);
  const outputDir = join(__dirname, '..', 'public', 'mock-data');
  
  mkdirSync(outputDir, { recursive: true });
  
  console.log(`Generating mock SAE features: ${featureCount} features...`);
  
  const features = generateFeatures(featureCount);
  
  writeFileSync(join(outputDir, 'features.json'), JSON.stringify(features, null, 2));
  
  const summary = {
    generatedAt: new Date().toISOString(),
    featureCount: features.length,
    layers: 32,
    featuresPerLayer: Math.floor(featureCount / 32),
    maxActivationRange: {
      min: Math.min(...features.map(f => f.maxActivation)),
      max: Math.max(...features.map(f => f.maxActivation)),
    },
    labeledFeatures: features.filter(f => f.semanticLabel !== null).length,
    bookmarkedFeatures: features.filter(f => f.isBookmarked).length,
  };
  
  writeFileSync(join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));
  
  console.log('Mock SAE data generated successfully!');
  console.log(JSON.stringify(summary, null, 2));
}

main();